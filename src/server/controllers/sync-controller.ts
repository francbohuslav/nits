import { CachedFs } from "dropbox-fs";
import { Inject } from "injector";
import { join } from "path";
import { assert } from "../../common/core";
import dateUtils from "../../common/date-utils";
import { WtmError } from "../apis/wtm-api";
import { ISyncReport, ISyncReportUser, TimesheetMapping, TimesheetMappingsPerDay } from "../models/interfaces";
import { Worklog } from "../models/jira/interfaces";
import { IWtmTsConfigPerIssueKey, JiraModel } from "../models/jira/jira-model";
import { ProjectDataModel } from "../models/project-data-model";
import { SystemDataModel } from "../models/system-data-model";
import { UserDataModel } from "../models/user-data-model";
import { nitsTimesheetFilter, Timesheet, TimesheetModelFactoryHandler } from "../models/uu/interfaces";
import { IProjectConfig } from "../project-config";
import { NotifyController } from "./notify-controller";

@Inject.Singleton
export class SyncController {
    private nextPossibleStartTime: Date;

    constructor(
        private userDataModel: UserDataModel,
        private systemDataModel: SystemDataModel,
        private jiraModel: JiraModel,
        private projectDataModel: ProjectDataModel,
        private notifyController: NotifyController,
        private dropboxCachedFs: CachedFs,
        @Inject.Value("timesheetModelFactory") private timesheetModelFactory: TimesheetModelFactoryHandler,
        @Inject.Value("syncStorageDir") private storageDir: string,
        @Inject.Value("projectConfig") private projectConfig: IProjectConfig
    ) {}

    public async sync(): Promise<ISyncReport> {
        const report: ISyncReport = {
            startedAt: new Date(),
            timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            users: [],
            log: [],
        };
        if (this.nextPossibleStartTime && dateUtils.isLowerThen(new Date(), this.nextPossibleStartTime)) {
            report.log.push(`Too soon. Try it again after ${dateUtils.formatDateTime(this.nextPossibleStartTime)}`);
            return report;
        }
        this.setNextPossibleStartTime();
        let isAtLeastOneError = false;
        const syncDaysCount = (await this.systemDataModel.getSystemConfig()).syncDaysCount;

        let startDate = dateUtils.increaseDay(dateUtils.getStartOfDay(), -syncDaysCount + 1);
        if (dateUtils.isLowerThen(startDate, dateUtils.getStartOfMonth())) {
            startDate = dateUtils.getStartOfMonth();
            report.log.push("Range was shortened, because of new month");
        }
        const endDate = dateUtils.increaseDay(dateUtils.getStartOfDay());
        report.log.push("Sync range: " + startDate.toISOString() + " - " + endDate.toISOString());

        // Get all changed worklogs
        let allWorklogList = await this.jiraModel.getLastWorklogs(startDate, endDate);

        // Filter that worklogs by project settings. Only worklogs with artifact is relevant
        const wtmTsConfigPerIssueKey: IWtmTsConfigPerIssueKey = {};
        const issuesById = await this.jiraModel.getAllNeededIssues(allWorklogList);
        allWorklogList.forEach((w) => (w.issueKey = issuesById[w.issueId].key));

        if (this.projectConfig.jira.nitsCustomFieldIsArtifact) {
            allWorklogList = this.jiraModel.filterWorklogsByArtifactAndAssignWtmConfig(allWorklogList, issuesById, wtmTsConfigPerIssueKey, report);
        } else {
            const artifactSettingsList = await this.projectDataModel.getArtifactSettings();
            allWorklogList = this.jiraModel.filterWorklogsByRulesAndAssignWtmConfig(
                allWorklogList,
                issuesById,
                wtmTsConfigPerIssueKey,
                artifactSettingsList,
                report
            );
        }
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
                const exitingTimesheets = await timesheetModel.getMyLastTimesheets(dateUtils.toIsoFormat(startDate));
                const { timesheetsToDelete, notNitsTimesheets } = this.separateTimesheets(exitingTimesheets);
                const newTimesheets = this.computeNewTimesheets(timesheetMappingsPerDay, notNitsTimesheets);
                const notChangedTimesheets = this.excludeNotChangedTimesheets(newTimesheets, timesheetsToDelete);

                reportUser.log.push({ timesheetsToDelete: timesheetsToDelete.map((t) => t.toString()) });
                reportUser.log.push({ notNitsTimesheets: notNitsTimesheets.map((t) => t.toString()) });
                reportUser.log.push({ notChangedTimesheets: notChangedTimesheets.map((t) => t.toString()) });

                await timesheetModel.removeTimesheets(timesheetsToDelete, reportUser);
                await timesheetModel.saveTimesheets(newTimesheets, reportUser);
                userData.lastSynchronization = new Date().toISOString();
                userData.lastError = null;
                this.userDataModel.setUserData(userData.uid, userData);
            } catch (err) {
                isAtLeastOneError = true;
                if (err instanceof WtmError) {
                    reportUser.log.push(err.message + "\n" + err.stack);
                    if (err.response?.uuAppErrorMap) {
                        reportUser.log.push(err.response?.uuAppErrorMap);
                    }
                    err.additionalData && reportUser.log.push(err.additionalData);
                } else if (err instanceof Error) {
                    reportUser.log.push(err.message + "\n" + err.stack);
                } else {
                    reportUser.log.push(err.toString());
                }
                userData.lastError = {
                    message: err.message,
                    stack: err.stack,
                    response: err.response,
                    additionalData: err.additionalData,
                };
                this.userDataModel.setUserData(userData.uid, userData);
            }
            this.setNextPossibleStartTime();
        }
        try {
            if (isAtLeastOneError) {
                await this.notifyController.syncError();
            }
        } catch (err) {
            report.log.push(err.message + "\n" + err.stack);
        }
        await this.saveReportToFile(report);
        return report;
    }

    private async saveReportToFile(report: ISyncReport): Promise<void> {
        const file = `sync-${new Date().toISOString().replace(/[^a-z0-9]/gi, "-")}.json`;
        await this.dropboxCachedFs.writeFile(join(this.storageDir, file), JSON.stringify(report, null, 2));
    }

    public async getReportFilesList(): Promise<string[]> {
        const files = await this.dropboxCachedFs.readdir(this.storageDir);
        files.sort((a, b) => -a.localeCompare(b));
        for (let i = 40; i < files.length; i++) {
            const file = files[i];
            this.dropboxCachedFs.unlinkFile(join(this.storageDir, file));
        }
        return files.slice(0, 40);
    }

    public async getReportFile(file: string): Promise<ISyncReport> {
        assert(file.match(/^[a-z0-9.-]+$/i));
        const content = await this.dropboxCachedFs.readFile(join(this.storageDir, file));
        return JSON.parse(content);
    }

    /**
     * Separates WTM timesheets if it is NITS timesheet for specific project
     * @param exitingTimesheets
     * @returns
     */
    protected separateTimesheets(exitingTimesheets: Timesheet[]): { timesheetsToDelete: Timesheet[]; notNitsTimesheets: Timesheet[] } {
        const timesheetsToDelete: Timesheet[] = [];
        const notNitsTimesheets: Timesheet[] = [];
        for (const timesheet of exitingTimesheets) {
            if (nitsTimesheetFilter(timesheet, this.projectConfig.wtmProjectCode)) {
                timesheetsToDelete.push(timesheet);
            } else {
                notNitsTimesheets.push(timesheet);
            }
        }
        return {
            notNitsTimesheets,
            timesheetsToDelete,
        };
    }

    protected computeNewTimesheets(timesheetMappingsPerDay: TimesheetMappingsPerDay, notNitsTimesheets: Timesheet[]): Timesheet[] {
        let newTimesheets: Timesheet[] = [];
        Object.entries(timesheetMappingsPerDay).forEach(([day, tsm]) => {
            const timesheetsToRemainOfDay = notNitsTimesheets.filter((t) => dateUtils.toIsoFormat(t.datetimeFrom) == day);
            newTimesheets = newTimesheets.concat(this.computeNewTimesheetsInDay(tsm, timesheetsToRemainOfDay));
        });
        return newTimesheets;
    }

    protected computeNewTimesheetsInDay(timesheetMapping: TimesheetMapping[], notNitsTimesheets: Timesheet[]): Timesheet[] {
        if (timesheetMapping.length == 0) {
            return [];
        }
        let startHour = 8;
        while (startHour > -1) {
            let searchFromTime = dateUtils.increase(dateUtils.getStartOfDay(timesheetMapping[0].date), "hours", startHour);
            const startOfDay = notNitsTimesheets
                .map((t) => t.datetimeFrom)
                .reduce((p, c) => (dateUtils.isLowerThen(p, c) ? dateUtils.toDate(p) : dateUtils.toDate(c)), searchFromTime);
            const newTimesheets: Timesheet[] = [];
            const timesheetMappingToProcess = JSON.parse(JSON.stringify(timesheetMapping));
            let segment: { interval: IInterval; isPauseApplied: boolean } = null;
            do {
                const alreadyProcessedHours = dateUtils.secondsBetween(startOfDay, searchFromTime) / 3600;
                segment = this.getNextFreeTimeSegment(searchFromTime, notNitsTimesheets, segment?.isPauseApplied, alreadyProcessedHours);
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
        ts.subject = tsm.wtmArtifact.match(/^ues:/) ? tsm.wtmArtifact : `ues:${tsm.wtmArtifact}`;
        ts.data = {
            nits: {
                project: this.projectConfig.wtmProjectCode,
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
        notNitsTimesheets: Timesheet[],
        isPauseApplied: boolean,
        alreadyProcessedHours: number
    ): { interval: IInterval; isPauseApplied: boolean } {
        const day = dateUtils.toIsoFormat(searchFromTime);
        let interval: IInterval = null;
        do {
            const timesheetsAfterTime = notNitsTimesheets.filter((t) => !dateUtils.isLowerOrEqualsThen(t.datetimeTo, searchFromTime));
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

    private setNextPossibleStartTime() {
        this.nextPossibleStartTime = dateUtils.increase(new Date(), "minutes", 5);
    }

    protected excludeNotChangedTimesheets(newTimesheets: Timesheet[], timesheetsToDelete: Timesheet[]): Timesheet[] {
        const newTimesheetsCopy = [...newTimesheets];
        const timesheetsToDeleteCopy = [...timesheetsToDelete];
        const excludedTimesheets: Timesheet[] = [];
        newTimesheetsCopy.forEach((newTimeSheet) => {
            timesheetsToDeleteCopy.forEach((timesheetToDelete) => {
                if (newTimeSheet.isSameAs(timesheetToDelete)) {
                    excludedTimesheets.push(newTimeSheet);
                    this.removeTimesheetFromList(newTimeSheet, newTimesheets);
                    this.removeTimesheetFromList(timesheetToDelete, timesheetsToDelete);
                }
            });
        });
        return excludedTimesheets;
    }

    private removeTimesheetFromList(timesheet: Timesheet, timesheets: Timesheet[]): void {
        const index = timesheets.findIndex((t) => t == timesheet);
        if (index == -1) {
            throw new Error(`Timesheet ${timesheet} does not exists in list [${timesheets?.join(", ")}]`);
        }
        timesheets.splice(index, 1);
    }
}

export interface IInterval {
    from: Date;
    to: Date;
}
