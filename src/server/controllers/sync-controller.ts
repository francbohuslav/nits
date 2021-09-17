import { ISyncReport } from "../models/interfaces";
import { Worklog } from "../models/jira/interfaces";
import { JiraModel } from "../models/jira/jira-model";
import { UserDataModel } from "../models/user-data-model";
import { TimesheetFactoryHandler } from "../models/uu/interfaces";

export class SyncController {
    constructor(private userDataModel: UserDataModel, private jiraModel: JiraModel, private timesheetModelFactory: TimesheetFactoryHandler) {}

    public async sync(): Promise<ISyncReport[]> {
        const userDataList = await this.userDataModel.getAllValidUserData();
        const reportList: ISyncReport[] = [];
        const worklogList = await this.jiraModel.getLastWorklogs();
        const worklogListPerAccountId: { [accountId: string]: Worklog[] } = {};
        worklogList.forEach((w) => {
            const accountId = w.author.accountId;
            worklogListPerAccountId[accountId] = worklogListPerAccountId[accountId] || [];
            worklogListPerAccountId[accountId].push(w);
        });
        for (const [accountId, worklogList] of Object.entries(worklogListPerAccountId)) {
            const userData = userDataList.find((u) => u.jiraAccountId == accountId);
            const report: ISyncReport = {
                name: userData?.name,
                uid: userData?.uid || worklogList[0].author.displayName,
                log: [],
            };
            reportList.push(report);
            if (!userData) {
                report.log.push("User is not logged into NITS, skipped.");
                continue;
            }
            try {
                const timesheetModel = this.timesheetModelFactory(userData.uuAccessCode1, userData.uuAccessCode2);
                const newTimesheets = timesheetModel.convertWorklogsToTimesheets(worklogList);
                const timesheets = await timesheetModel.getLastUserTimesheets(userData);
                await timesheetModel.removeTimesheets(timesheets, report);
                await timesheetModel.saveTimesheets(newTimesheets, report);
            } catch (err) {
                if (err instanceof Error) {
                    report.log.push(err.message + "\n" + err.stack);
                } else {
                    report.log.push(err.toString());
                }
            }
        }
        return reportList;
    }
}
