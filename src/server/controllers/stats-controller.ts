import { Inject } from "injector";
import arrayUtils from "../../common/array-utils";
import dateUtils from "../../common/date-utils";
import { IStats, IStatsDays, IUserData, IUserStats } from "../../common/interfaces";
import { Worklog } from "../models/jira/interfaces";
import { JiraModel } from "../models/jira/jira-model";
import { UserDataModel } from "../models/user-data-model";
import { ITimesheetModel, nitsTimesheetFilter, Timesheet, TimesheetModelFactoryHandler } from "../models/uu/interfaces";

@Inject.Singleton
export class StatsController {
    constructor(
        private userDataModel: UserDataModel,
        private jiraModel: JiraModel,
        @Inject.Value("timesheetModelFactory") private timesheetModelFactory: TimesheetModelFactoryHandler
    ) {}

    public async getAdminStats(adminUid: string, month: string): Promise<IStats[]> {
        const stats: IStats[] = [];

        const since = dateUtils.toDate(month);
        const toExcept = dateUtils.increase(since, "months", 1);
        console.log(`Stats for ${since.toISOString()} - ${toExcept.toISOString()}`);
        const adminUserData = await this.userDataModel.getUserData(adminUid);
        const timesheetModel = this.timesheetModelFactory(adminUserData);

        const userDataList = await this.userDataModel.getAllValidUserData();

        const { worklogsPerUserAndDay, worklogsPerUser } = await this.getJiraWorklogs(userDataList, since, toExcept);
        const { timesheetsPerUserAndDay, timesheetsPerUser } = await this.getWtmTimesheets(timesheetModel, userDataList, since, toExcept);

        for (const userData of userDataList) {
            const days: IStatsDays = {};

            let jiraHours = 0;
            let wtmHours = 0;

            if (worklogsPerUserAndDay[userData.jiraAccountId]) {
                jiraHours = arrayUtils.sumAction(worklogsPerUser[userData.jiraAccountId], (w) => w.timeSpentSeconds) / 3600;
                Object.entries(worklogsPerUserAndDay[userData.jiraAccountId]).forEach(([date, workLogs]) => {
                    const dayStats = (days[date] = days[date] || { date, jiraHours: 0, wtmHours: 0, artifacts: {} });
                    dayStats.jiraHours = arrayUtils.sumAction(workLogs, (w) => w.timeSpentSeconds) / 3600;
                });
            }
            if (timesheetsPerUserAndDay[userData.uid]) {
                wtmHours = arrayUtils.sumAction(timesheetsPerUser[userData.uid], (t) => t.getSpentHours());
                Object.entries(timesheetsPerUserAndDay[userData.uid]).forEach(([date, timesheets]) => {
                    const dayStats = (days[date] = days[date] || { date, jiraHours: 0, wtmHours: 0, artifacts: {} });
                    dayStats.wtmHours = arrayUtils.sumAction(timesheets, (t) => t.getSpentHours());
                    const timesheetsPerArtifacts = arrayUtils.toGroups(timesheets, (t) => t.subject);
                    Object.entries(timesheetsPerArtifacts).forEach(([art, timesheets]) => {
                        dayStats.artifacts[art] = {
                            artifact: art,
                            wtmHours: arrayUtils.sumAction(timesheets, (t) => t.getSpentHours()),
                        };
                    });
                });
            }
            const stat: IStats = {
                uid: userData.uid,
                name: userData.name,
                jiraHours,
                wtmHours,
                days,
                lastSynchronization: userData.lastSynchronization,
            };
            stats.push(stat);
        }
        return stats;
    }

    public async getUserStats(uid: string): Promise<IUserStats> {
        const userData = await this.userDataModel.getUserData(uid);
        const timesheetModel = this.timesheetModelFactory(userData);
        const from = new Date();
        const timesheets = await timesheetModel.getMyLastTimesheets(dateUtils.toIsoFormat(new Date(from.getFullYear(), from.getMonth(), 1)));
        const stats: IUserStats = {
            lastSynchronization: userData.lastSynchronization,
            wtmHours: arrayUtils.sumAction(timesheets.filter(nitsTimesheetFilter), (t) => t.getSpentHours()),
        };
        return stats;
    }

    private async getJiraWorklogs(
        userDataList: IUserData[],
        since: Date,
        toExcept: Date
    ): Promise<{ worklogsPerUser: IWorklogsPerUser; worklogsPerUserAndDay: IWorklogsPerUserAndDay }> {
        const validUserIds = userDataList.map((u) => u.jiraAccountId);
        const worklogList = await this.jiraModel.getLastWorklogs(since, toExcept);
        const worklogsPerUser = arrayUtils.toGroups(
            worklogList.filter((w) => validUserIds.includes(w.author.accountId)),
            (w) => w.author.accountId
        );
        const worklogsPerUserAndDay: { [accountId: string]: { [date: string]: Worklog[] } } = {};
        Object.entries(worklogsPerUser).forEach(
            ([accountId, wlogs]) => (worklogsPerUserAndDay[accountId] = arrayUtils.toGroups(wlogs, (w) => dateUtils.toIsoFormat(w.startedDate)))
        );
        return { worklogsPerUserAndDay, worklogsPerUser };
    }

    private async getWtmTimesheets(
        timesheetModel: ITimesheetModel,
        userDataList: IUserData[],
        since: Date,
        toExcept: Date
    ): Promise<{ timesheetsPerUser: ITimesheetsPerUser; timesheetsPerUserAndDay: ITimesheetsPerUserAndDay }> {
        const validUserIds = userDataList.map((u) => u.uid);
        const timesheetsPerUser = await timesheetModel.getTimesheetsOfUsers(validUserIds, since, toExcept, nitsTimesheetFilter);
        const timesheetsPerUserAndDay: ITimesheetsPerUserAndDay = {};
        Object.entries(timesheetsPerUser).forEach(
            ([uid, ts]) => (timesheetsPerUserAndDay[uid] = arrayUtils.toGroups(ts, (t) => dateUtils.toIsoFormat(t.datetimeFrom)))
        );
        return { timesheetsPerUserAndDay, timesheetsPerUser };
    }
}

type ITimesheetsPerUser = { [uid: string]: Timesheet[] };
type ITimesheetsPerUserAndDay = { [uid: string]: { [date: string]: Timesheet[] } };

type IWorklogsPerUser = { [accountId: string]: Worklog[] };
type IWorklogsPerUserAndDay = { [accountId: string]: { [date: string]: Worklog[] } };
