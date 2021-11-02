import { Inject } from "injector";
import arrayUtils from "../../common/array-utils";
import { assert } from "../../common/core";
import dateUtils from "../../common/date-utils";
import { IArtifactSettings } from "../../common/interfaces";
import { WtmError } from "../apis/wtm-api";
import { ISyncReport, ISyncReportUser, TimesheetMapping, TimesheetMappingsPerDay } from "../models/interfaces";
import { IIssue, IIssueCustomField, Worklog } from "../models/jira/interfaces";
import { JiraModel } from "../models/jira/jira-model";
import { SystemDataModel } from "../models/system-data-model";
import { UserDataModel } from "../models/user-data-model";
import { nitsTimesheetFilter, Timesheet, TimesheetModelFactoryHandler } from "../models/uu/interfaces";
import { IProjectConfig } from "../project-config";
import { NotifyController } from "./notify-controller";
import { ProjectController } from "./project-controller";

@Inject.Singleton
export class SyncController {
    constructor(
        private userDataModel: UserDataModel,
        private systemDataModel: SystemDataModel,
        private jiraModel: JiraModel,
        private projectController: ProjectController,
        private notifyController: NotifyController,
        @Inject.Value("projectConfig") private projectConfig: IProjectConfig,
        @Inject.Value("timesheetModelFactory") private timesheetModelFactory: TimesheetModelFactoryHandler
    ) {}

    public async sync(): Promise<ISyncReport> {
        const report: ISyncReport = { users: [], log: [] };
        let isAtLeastOneError = false;
        const syncDaysCount = (await this.systemDataModel.getSystemConfig()).syncDaysCount;

        // Get all changed worklogs
        let allWorklogList = await this.jiraModel.getLastWorklogs(
            dateUtils.increaseDay(new Date(), -syncDaysCount),
            dateUtils.increaseDay(dateUtils.getStartOfDay())
        );

        // Filter that worklogs be project settings. Only worklogs with artifact is relevant
        const wtmTsConfigPerIssueKey: IWtmTsConfigPerIssueKey = {};
        const issuesById = await this.getAllNeededIssues(allWorklogList);
        allWorklogList.forEach((w) => (w.issueKey = issuesById[w.issueId].key));
        allWorklogList = await this.filterWorklogsAndAssignWtmConfig(allWorklogList, issuesById, wtmTsConfigPerIssueKey, report);

        // Split worklogs by user
        const worklogListPerAccountId: { [accountId: string]: Worklog[] } = {};
        allWorklogList.forEach((w) => {
            const accountId = w.author.accountId;
            worklogListPerAccountId[accountId] = worklogListPerAccountId[accountId] || [];
            worklogListPerAccountId[accountId].push(w);
        });

        // Process user's worklogs
        let userDataList = await this.userDataModel.getAllValidUserData();
        userDataList = userDataList.filter((u) => u.state == "active" || u.state == "readonly");
        for (const userData of userDataList) {
            const worklogList = worklogListPerAccountId[userData.jiraAccountId] || [];
            const reportUser: ISyncReportUser = {
                name: userData.name,
                uid: userData.uid,
                log: [],
            };
            report.users.push(reportUser);
            try {
                const timesheetModel = this.timesheetModelFactory(userData);
                // Join worklogs from same issue
                const timesheetMappingsPerDay = timesheetModel.convertWorklogsToTimesheetMappings(worklogList, wtmTsConfigPerIssueKey, reportUser);
                const commentErrors = worklogList.filter((w) => w.commentAsTextErrors.length > 0).map((w) => w.commentAsTextErrors);
                if (commentErrors.length) {
                    reportUser.log.push(commentErrors);
                }
                const exitingTimesheets = await timesheetModel.getMyLastTimesheets(dateUtils.toIsoFormat(dateUtils.increaseDay(new Date(), -syncDaysCount)));
                const { timesheetsToDelete, timesheetsToRemain } = this.separateTimesheets(exitingTimesheets);
                const newTimesheets = this.computeNewTimesheets(timesheetMappingsPerDay, timesheetsToRemain);
                // reportUser.log.push({ timesheetMappingsPerDay });
                reportUser.log.push({ timesheetsToDelete: timesheetsToDelete.map((t) => t.toString()) });
                reportUser.log.push({ timesheetsToRemain: timesheetsToRemain.map((t) => t.toString()) });
                await timesheetModel.removeTimesheets(timesheetsToDelete, reportUser);
                await timesheetModel.saveTimesheets(newTimesheets, reportUser);
                userData.lastSynchronization = new Date().toISOString();
                userData.lastError = null;
                this.userDataModel.setUserData(userData.uid, userData);
            } catch (err) {
                isAtLeastOneError = true;
                if (err instanceof WtmError) {
                    reportUser.log.push(err.message + "\n" + err.stack);
                    reportUser.log.push(err.uuAppErrorMap);
                    err.additionalData && reportUser.log.push(err.additionalData);
                } else if (err instanceof Error) {
                    reportUser.log.push(err.message + "\n" + err.stack);
                } else {
                    reportUser.log.push(err.toString());
                }
                userData.lastError = {
                    message: err.message,
                    stack: err.stack,
                    uuAppErrorMap: err.uuAppErrorMap,
                    additionalData: err.additionalData,
                };
                this.userDataModel.setUserData(userData.uid, userData);
            }
        }
        try {
            if (isAtLeastOneError) {
                await this.notifyController.syncError();
            }
        } catch (err) {
            report.log.push(err.message + "\n" + err.stack);
        }
        return report;
    }

    protected async filterWorklogsAndAssignWtmConfig(
        worklogList: Worklog[],
        issuesById: { [id: string]: IIssue },
        wtmTsConfigPerIssueKey: IWtmTsConfigPerIssueKey,
        report: ISyncReport
    ): Promise<Worklog[]> {
        const artifactSettingsList = await this.projectController.getArtifactSettings();

        const validProjectCodes = artifactSettingsList.map((p) => p.jiraProjectKey);

        const validWorklogs: Worklog[] = [];
        for (const workglog of worklogList) {
            const issue = issuesById[workglog.issueId];
            const parentIssue = issue.fields.parent ? issuesById[issue.fields.parent.id] : null;
            assert(issue, `Issue ${workglog.issueKey} of worklog ${workglog.toString()} not found`);

            const projectKey = issue.fields.project.key;
            let nitsField = issue.fields[this.projectConfig.jira.nitsCustomField] as IIssueCustomField;
            nitsField = nitsField || (parentIssue ? (parentIssue.fields[this.projectConfig.jira.nitsCustomField] as IIssueCustomField) : null);
            const nitsFieldId = nitsField ? nitsField.id : null;

            let artifactSettings: IArtifactSettings = null;

            if (!validProjectCodes.includes(projectKey)) {
                report.log.push(`Worklog ${workglog.toString()} skipped. Project ${projectKey} is not configured.`);
                continue;
            }

            // Exact fit of project and NITS field
            artifactSettings = artifactSettingsList.find((p) => p.jiraProjectKey == projectKey && p.jiraNitsField && p.jiraNitsField == nitsFieldId);
            if (artifactSettings) {
                report.log.push(`Worklog ${workglog.toString()} passed. Artifact ${artifactSettings.wtmArtifact} will be used.`);
            }
            // Issue with project without specified NITS field
            if (!artifactSettings) {
                artifactSettings = artifactSettingsList.find((p) => p.jiraProjectKey == projectKey && !p.jiraNitsField && !nitsFieldId);
                if (artifactSettings) {
                    report.log.push(`Worklog ${workglog.toString()} passed. Artifact ${artifactSettings.wtmArtifact} will be used.`);
                }
            }
            // Issue with project but with unknown NITS field
            if (!artifactSettings) {
                artifactSettings = artifactSettingsList.find((p) => p.jiraProjectKey == projectKey && !p.jiraNitsField && nitsFieldId);
                if (artifactSettings) {
                    report.log.push(
                        `Worklog ${workglog.toString()} passed. Artifact ${
                            artifactSettings.wtmArtifact
                        } will be used. WARNING: issue or parent has unused NITS custom field ${JSON.stringify(nitsField)}.`
                    );
                }
            }
            if (artifactSettings) {
                validWorklogs.push(workglog);
                wtmTsConfigPerIssueKey[issue.key] = artifactSettings;
            } else {
                report.log.push(`Worklog ${workglog.toString()} skipped. Neither issue ${issue.key} nor parent has no valid configuration.`);
            }
        }
        return validWorklogs;
    }

    /**
     * Returns all used issues and parents in worklogs
     * @param worklogList
     */
    private async getAllNeededIssues(worklogList: Worklog[]): Promise<{ [id: string]: IIssue }> {
        const issues = worklogList.length ? await this.jiraModel.getIssuesById(worklogList.map((w) => w.issueId)) : [];
        const issuesById = arrayUtils.toDictionary<IIssue, IIssue>(issues, (i) => i.id);
        const parents = issues.length ? await this.jiraModel.getIssuesById(issues.filter((i) => i.fields.parent?.id).map((i) => i.fields.parent.id)) : [];
        parents.forEach((p) => {
            if (!issuesById[p.id]) {
                issuesById[p.id] = p;
            }
        });
        return issuesById;
    }

    protected separateTimesheets(exitingTimesheets: Timesheet[]): { timesheetsToDelete: Timesheet[]; timesheetsToRemain: Timesheet[] } {
        const timesheetsToDelete: Timesheet[] = [];
        const timesheetsToRemain: Timesheet[] = [];
        for (const timesheet of exitingTimesheets) {
            if (nitsTimesheetFilter(timesheet)) {
                timesheetsToDelete.push(timesheet);
            } else {
                timesheetsToRemain.push(timesheet);
            }
        }
        return {
            timesheetsToRemain,
            timesheetsToDelete,
        };
    }

    protected computeNewTimesheets(timesheetMappingsPerDay: TimesheetMappingsPerDay, timesheetsToRemain: Timesheet[]): Timesheet[] {
        let newTimesheets: Timesheet[] = [];
        Object.entries(timesheetMappingsPerDay).forEach(([day, tsm]) => {
            const timesheetsToRemainOfDay = timesheetsToRemain.filter((t) => dateUtils.toIsoFormat(t.datetimeFrom) == day);
            newTimesheets = newTimesheets.concat(this.computeNewTimesheetsInDay(tsm, timesheetsToRemainOfDay));
        });
        return newTimesheets;
    }

    protected computeNewTimesheetsInDay(timesheetMapping: TimesheetMapping[], timesheetsToRemain: Timesheet[]): Timesheet[] {
        if (timesheetMapping.length == 0) {
            return [];
        }
        let startHour = 8;
        while (startHour > -1) {
            let searchFromTime = dateUtils.increase(dateUtils.getStartOfDay(timesheetMapping[0].date), "hours", startHour);
            const startOfDay = timesheetsToRemain
                .map((t) => t.datetimeFrom)
                .reduce((p, c) => (dateUtils.isLowerThen(p, c) ? dateUtils.toDate(p) : dateUtils.toDate(c)), searchFromTime);
            const newTimesheets: Timesheet[] = [];
            const timesheetMappingToProcess = JSON.parse(JSON.stringify(timesheetMapping));
            let segment: { interval: IInterval; isPauseApplied: boolean } = null;
            do {
                const alreadyProcessedHours = dateUtils.secondsBetween(startOfDay, searchFromTime) / 3600;
                segment = this.getNextFreeTimeSegment(searchFromTime, timesheetsToRemain, segment?.isPauseApplied, alreadyProcessedHours);
                if (segment) {
                    const endTime = this.computeNewTimesheetInSegment(segment.interval, newTimesheets, timesheetMappingToProcess);
                    if (timesheetMappingToProcess.length == 0) {
                        return newTimesheets;
                    }
                    if (dateUtils.toIsoFormat(searchFromTime) != dateUtils.toIsoFormat(endTime)) {
                        break;
                    }
                    searchFromTime = endTime;
                }
            } while (segment);
            startHour -= 0.5;
        }
        throw new Error(`There is no space in ${timesheetMapping[0].date} for new timesheets`);
    }

    protected computeNewTimesheetInSegment(interval: IInterval, newTimesheets: Timesheet[], timesheetMapping: TimesheetMapping[]): Date {
        if (timesheetMapping.length == 0) {
            return;
        }
        let restTime = dateUtils.secondsBetween(interval.from, interval.to);
        let startTime = interval.from;
        const tsm = timesheetMapping[0];
        const timeToSpent = restTime >= tsm.spentSeconds ? tsm.spentSeconds : restTime;
        const ts = new Timesheet();
        ts.description = tsm.description;
        ts.datetimeFrom = startTime.toISOString();
        startTime = dateUtils.increase(startTime, "seconds", timeToSpent);
        ts.datetimeTo = startTime.toISOString();
        ts.subject = tsm.wtmArtifact;
        ts.data = {
            nits: {
                issueKey: tsm.jiraIssueKey,
                worklogIds: tsm.jiraWorklogs.map((w) => w.id),
            },
        };
        newTimesheets.push(ts);
        restTime -= timeToSpent;
        if (timeToSpent < tsm.spentSeconds) {
            tsm.spentSeconds -= timeToSpent;
        } else {
            timesheetMapping.shift();
        }
        return startTime;
    }

    protected getNextFreeTimeSegment(
        searchFromTime: Date,
        timesheetsToRemain: Timesheet[],
        isPauseApplied: boolean,
        alreadyProcessedHours: number
    ): { interval: IInterval; isPauseApplied: boolean } {
        const day = dateUtils.toIsoFormat(searchFromTime);
        let interval: IInterval = null;
        do {
            const timesheetsAfterTime = timesheetsToRemain.filter((t) => !dateUtils.isLowerOrEqualsThen(t.datetimeTo, searchFromTime));
            while (timesheetsAfterTime.length > 0 && dateUtils.isLowerOrEqualsThen(timesheetsAfterTime[0].datetimeFrom, searchFromTime)) {
                alreadyProcessedHours += dateUtils.secondsBetween(searchFromTime, timesheetsAfterTime[0].datetimeTo) / 3600;
                searchFromTime = dateUtils.toDate(timesheetsAfterTime[0].datetimeTo);
                timesheetsAfterTime.shift();
            }
            // No space to end of day
            if (day != dateUtils.toIsoFormat(searchFromTime)) {
                return null;
            }

            interval = {
                from: searchFromTime,
                to:
                    timesheetsAfterTime.length == 0
                        ? dateUtils.getStartOfDay(dateUtils.increaseDay(searchFromTime))
                        : dateUtils.toDate(timesheetsAfterTime[0].datetimeFrom),
            };
            if (!isPauseApplied && alreadyProcessedHours >= 4 && dateUtils.secondsBetween(interval.from, interval.to) >= 1800) {
                interval.from = dateUtils.increase(interval.from, "minutes", 30);
                searchFromTime = interval.from;
                isPauseApplied = true;
            }
        } while (dateUtils.areEquals(interval.from, interval.to));
        return { interval, isPauseApplied };
    }
}

export type IWtmTsConfigPerIssueKey = { [issueId: string]: IArtifactSettings };

export interface IInterval {
    from: Date;
    to: Date;
}
