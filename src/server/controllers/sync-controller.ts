import arrayUtils from "../../common/array-utils";
import { ISyncReport, ISyncReportUser, TimesheetMapping, TimesheetMappingsPerDay } from "../models/interfaces";
import { IIssue, IIssueCustomField, Worklog } from "../models/jira/interfaces";
import { JiraModel } from "../models/jira/jira-model";
import { UserDataModel } from "../models/user-data-model";
import { nitsTimesheetFilter, Timesheet, TimesheetModelFactoryHandler } from "../models/uu/interfaces";
import { ProjectController } from "./project-controller";
import { assert } from "../../common/core";
import { IProjectConfig } from "../project-config";
import { IProjectSettings } from "../../common/interfaces";
import dateUtils from "../../common/date-utils";

export class SyncController {
    constructor(
        private userDataModel: UserDataModel,
        private jiraModel: JiraModel,
        private projectController: ProjectController,
        private projectConfig: IProjectConfig,
        private timesheetModelFactory: TimesheetModelFactoryHandler
    ) {}

    public async sync(): Promise<ISyncReport> {
        const report: ISyncReport = { users: [], log: [] };

        // Get all changed worklogs
        let allWorklogList = await this.jiraModel.getLastWorklogs(this.projectConfig.syncDaysCount);

        // Filter that worklogs be project settings. Only worklogs with artifact is relevant
        const wtmTsConfigPerWorklogs: IWtmTsConfigPerWorklogId = {};
        const issuesById = await this.getAllNeededIssues(allWorklogList);
        allWorklogList.forEach((w) => (w.issueKey = issuesById[w.issueId].key));
        allWorklogList = await this.filterWorklogsAndAssignWtmConfig(allWorklogList, issuesById, wtmTsConfigPerWorklogs, report);

        // Split worklogs by user
        const worklogListPerAccountId: { [accountId: string]: Worklog[] } = {};
        allWorklogList.forEach((w) => {
            const accountId = w.author.accountId;
            worklogListPerAccountId[accountId] = worklogListPerAccountId[accountId] || [];
            worklogListPerAccountId[accountId].push(w);
        });

        // Process user's worklogs
        const userDataList = await this.userDataModel.getAllValidUserData();
        for (const userData of userDataList) {
            const worklogList = worklogListPerAccountId[userData.jiraAccountId] || [];
            const reportUser: ISyncReportUser = {
                name: userData.name,
                uid: userData.uid,
                log: [],
            };
            report.users.push(reportUser);
            try {
                const timesheetModel = this.timesheetModelFactory(userData.uuAccessCode1, userData.uuAccessCode2);
                // Join worklogs from same issue
                const timesheetMappingsPerDay = timesheetModel.convertWorklogsToTimesheetMappings(worklogList, reportUser);
                const commentErrors = worklogList.filter((w) => w.commentAsTextErrors.length > 0).map((w) => w.commentAsTextErrors);
                if (commentErrors.length) {
                    reportUser.log.push(commentErrors);
                }
                const exitingTimesheets = await timesheetModel.getMyLastTimesheets(
                    dateUtils.toIsoFormat(dateUtils.increaseDay(new Date(), this.projectConfig.syncDaysCount))
                );
                const { timesheetsToDelete, timesheetsToRemain } = this.separateTimesheets(exitingTimesheets);
                const newTimesheets = this.computeNewTimesheets(timesheetMappingsPerDay, timesheetsToRemain);
                // reportUser.log.push({ timesheetMappingsPerDay });
                reportUser.log.push({ timesheetsToDelete: timesheetsToDelete.map((t) => t.toString()) });
                reportUser.log.push({ timesheetsToRemain: timesheetsToRemain.map((t) => t.toString()) });
                await timesheetModel.removeTimesheets(timesheetsToDelete, reportUser);
                await timesheetModel.saveTimesheets(newTimesheets, reportUser);
                userData.lastSynchronization = new Date().toISOString();
                this.userDataModel.setUserData(userData.uid, userData);
            } catch (err) {
                if (err instanceof Error) {
                    reportUser.log.push(err.message + "\n" + err.stack);
                } else {
                    reportUser.log.push(err.toString());
                }
            }
        }
        return report;
    }

    protected async filterWorklogsAndAssignWtmConfig(
        worklogList: Worklog[],
        issuesById: { [id: string]: IIssue },
        wtmTsConfigPerWorklogs: IWtmTsConfigPerWorklogId,
        report: ISyncReport
    ): Promise<Worklog[]> {
        const projectSettingsList = await this.projectController.getProjectSettings();

        const validProjectCodes = projectSettingsList.map((p) => p.jiraProjectKey);

        const validWorklogs: Worklog[] = [];
        for (const workglog of worklogList) {
            const issue = issuesById[workglog.issueId];
            const parentIssue = issue.fields.parent ? issuesById[issue.fields.parent.id] : null;
            assert(issue, `Issue ${workglog.issueKey} of worklog ${workglog.toString()} not found`);

            const projectKey = issue.fields.project.key;
            let nitsField = issue.fields[this.projectConfig.jira.nitsCustomField] as IIssueCustomField;
            nitsField = nitsField || (parentIssue ? (parentIssue.fields[this.projectConfig.jira.nitsCustomField] as IIssueCustomField) : null);
            const nitsFieldId = nitsField ? nitsField.id : null;

            let projectSettings: IProjectSettings = null;

            if (!validProjectCodes.includes(projectKey)) {
                report.log.push(`Worklog ${workglog.toString()} skipped. Project ${projectKey} is not configured.`);
                continue;
            }

            // Exact fit of project and NITS field
            projectSettings = projectSettingsList.find((p) => p.jiraProjectKey == projectKey && p.jiraNitsField && p.jiraNitsField == nitsFieldId);
            if (projectSettings) {
                report.log.push(`Worklog ${workglog.toString()} passed. Artifact ${projectSettings.wtmArtifact} will be used.`);
            }
            // Issue with project without specified NITS field
            if (!projectSettings) {
                projectSettings = projectSettingsList.find((p) => p.jiraProjectKey == projectKey && !p.jiraNitsField && !nitsFieldId);
                if (projectSettings) {
                    report.log.push(`Worklog ${workglog.toString()} passed. Artifact ${projectSettings.wtmArtifact} will be used.`);
                }
            }
            // Issue with project but with unknown NITS field
            if (!projectSettings) {
                projectSettings = projectSettingsList.find((p) => p.jiraProjectKey == projectKey && !p.jiraNitsField && nitsFieldId);
                if (projectSettings) {
                    report.log.push(
                        `Worklog ${workglog.toString()} passed. Artifact ${
                            projectSettings.wtmArtifact
                        } will be used. WARNING: issue or parent has unused NITS custom field ${JSON.stringify(nitsField)}.`
                    );
                }
            }
            if (projectSettings) {
                validWorklogs.push(workglog);
                wtmTsConfigPerWorklogs[workglog.id] = {
                    projectSettings,
                    artifact: projectSettings.wtmArtifact,
                };
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
            const newTimesheets: Timesheet[] = [];
            const timesheetMappingToProcess = JSON.parse(JSON.stringify(timesheetMapping));
            let interval: IInterval = null;
            do {
                interval = this.getNextFreeTimeSegment(searchFromTime, timesheetsToRemain);
                if (interval) {
                    this.computeNewTimesheetsInSegment(interval, newTimesheets, timesheetMappingToProcess);
                    if (timesheetMappingToProcess.length == 0) {
                        return newTimesheets;
                    }
                    if (dateUtils.toIsoFormat(searchFromTime) != dateUtils.toIsoFormat(interval.to)) {
                        break;
                    }
                    searchFromTime = interval.to;
                }
            } while (interval);
            startHour--;
        }
        throw new Error(`There is no space in ${timesheetMapping[0].date} for new timesheets`);
    }

    protected computeNewTimesheetsInSegment(interval: IInterval, newTimesheets: Timesheet[], timesheetMapping: TimesheetMapping[]) {
        if (timesheetMapping.length == 0) {
            return;
        }
        let restTime = dateUtils.secondsBetween(interval.from, interval.to);
        let startTime = interval.from;
        let tsm: TimesheetMapping = null;
        do {
            tsm = timesheetMapping[0];
            const timeToSpent = restTime >= tsm.spentSeconds ? tsm.spentSeconds : restTime;
            const ts = new Timesheet();
            ts.description = tsm.description;
            ts.datetimeFrom = startTime.toISOString();
            startTime = dateUtils.increase(startTime, "seconds", timeToSpent);
            ts.datetimeTo = startTime.toISOString();
            ts.subject = tsm.wtmArtifact;
            ts.highRate = false;
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
        } while (timesheetMapping.length > 0 && restTime > 0);
    }

    protected getNextFreeTimeSegment(searchFromTime: Date, timesheetsToRemain: Timesheet[]): IInterval {
        const day = dateUtils.toIsoFormat(searchFromTime);
        const timesheetsAfterTime = timesheetsToRemain.filter((t) => !dateUtils.isLowerOrEqualsThen(t.datetimeTo, searchFromTime));
        while (timesheetsAfterTime.length > 0 && dateUtils.isLowerOrEqualsThen(timesheetsAfterTime[0].datetimeFrom, searchFromTime)) {
            searchFromTime = dateUtils.toDate(timesheetsAfterTime[0].datetimeTo);
            timesheetsAfterTime.shift();
        }
        // No space to end of day
        if (day != dateUtils.toIsoFormat(searchFromTime)) {
            return null;
        }

        return {
            from: searchFromTime,
            to:
                timesheetsAfterTime.length == 0
                    ? dateUtils.getStartOfDay(dateUtils.increaseDay(searchFromTime))
                    : dateUtils.toDate(timesheetsAfterTime[0].datetimeFrom),
        };
    }
}

export interface IWtmTsConfig {
    artifact: string;
    projectSettings: IProjectSettings;
}

export type IWtmTsConfigPerWorklogId = { [worklogId: string]: IWtmTsConfig };

export interface IInterval {
    from: Date;
    to: Date;
}
