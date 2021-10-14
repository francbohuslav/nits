import arrayUtils from "../../common/array-utils";
import dateUtils from "../../common/date-utils";
import { IStats, IStatsArts, IStatsDays, IUserData } from "../../common/interfaces";
import { Worklog } from "../models/jira/interfaces";
import { JiraModel } from "../models/jira/jira-model";
import { UserDataModel } from "../models/user-data-model";
import { ITimesheetModel, Timesheet, TimesheetModelFactoryHandler } from "../models/uu/interfaces";

export class StatsController {
    constructor(private userDataModel: UserDataModel, private jiraModel: JiraModel, private timesheetModelFactory: TimesheetModelFactoryHandler) {}

    public async getStats(adminUid: string): Promise<IStats[]> {
        //TODO: BF: vice dnu
        const lastDays = 4;
        const adminUserData = await this.userDataModel.getUserData(adminUid);
        const timesheetModel = this.timesheetModelFactory(adminUserData.uuAccessCode1, adminUserData.uuAccessCode2);

        const userDataList = await this.userDataModel.getAllValidUserData();

        const { worklogsPerUserAndDay, worklogsPerUser } = await this.getJiraWorklogs(userDataList, lastDays);
        const { timesheetsPerUserAndDay, timesheetsPerUser } = await this.getWtmTimesheets(timesheetModel, userDataList, lastDays);

        const stats: IStats[] = [];
        for (const userData of userDataList) {
            const days: IStatsDays = {};
            const artifacts: IStatsArts = {};

            let jiraHours = 0;
            let wtmHours = 0;

            if (worklogsPerUserAndDay[userData.jiraAccountId]) {
                jiraHours = arrayUtils.sumAction(worklogsPerUser[userData.jiraAccountId], (w) => w.timeSpentSeconds) / 3600;
                Object.entries(worklogsPerUserAndDay[userData.jiraAccountId]).forEach(([date, workLogs]) => {
                    const dayStats = (days[date] = days[date] || { date, jiraHours: 0, wtmHours: 0 });
                    dayStats.jiraHours = arrayUtils.sumAction(workLogs, (w) => w.timeSpentSeconds) / 3600;
                });
            }
            if (timesheetsPerUserAndDay[userData.uid]) {
                wtmHours = arrayUtils.sumAction(timesheetsPerUser[userData.uid], (t) => dateUtils.secondsBetween(t.datetimeFrom, t.datetimeTo)) / 3600;
                Object.entries(timesheetsPerUserAndDay[userData.uid]).forEach(([date, timesheets]) => {
                    const dayStats = (days[date] = days[date] || { date, jiraHours: 0, wtmHours: 0 });
                    dayStats.wtmHours = arrayUtils.sumAction(timesheets, (t) => dateUtils.secondsBetween(t.datetimeFrom, t.datetimeTo)) / 3600;
                });
                const timesheetsPerArtifacts = arrayUtils.toGroups(timesheetsPerUser[userData.uid], (t) => t.subject);
                Object.entries(timesheetsPerArtifacts).forEach(([art, timesheets]) => {
                    artifacts[art] = {
                        artifact: art,
                        wtmHours: arrayUtils.sumAction(timesheets, (t) => dateUtils.secondsBetween(t.datetimeFrom, t.datetimeTo)) / 3600,
                    };
                });
            }
            const stat: IStats = {
                uid: userData.uid,
                name: userData.name,
                jiraHours,
                wtmHours,
                days,
                artifacts,
            };
            stats.push(stat);
        }
        return stats;
    }

    private async getJiraWorklogs(
        userDataList: IUserData[],
        lastDays: number
    ): Promise<{ worklogsPerUser: IWorklogsPerUser; worklogsPerUserAndDay: IWorklogsPerUserAndDay }> {
        const validUserIds = userDataList.map((u) => u.jiraAccountId);
        const worklogList = await this.jiraModel.getLastWorklogs(lastDays);

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
        lastDays: number
    ): Promise<{ timesheetsPerUser: ITimesheetsPerUser; timesheetsPerUserAndDay: ITimesheetsPerUserAndDay }> {
        const validUserIds = userDataList.map((u) => u.uid);
        //TODO: BF: filtr
        const timesheetsPerUser = await timesheetModel.getTimesheetsOfUsers(validUserIds, lastDays /*, (t) => t.data?.nits !== undefined*/);
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
