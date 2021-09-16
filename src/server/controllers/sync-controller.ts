import { ISyncReport } from "../models/interfaces";
import { IJiraModel } from "../models/jira/interfaces";
import { UserDataModel } from "../models/user-data-model";
import { ITimesheetModel } from "../models/uu/interfaces";

export class SyncController {
    constructor(private userDataModel: UserDataModel, private jiraModel: IJiraModel, private timesheetModel: ITimesheetModel) {}

    public async sync(): Promise<ISyncReport[]> {
        const userDataList = await this.userDataModel.getAllValidUserData();
        const reportList: ISyncReport[] = [];
        for (const userData of userDataList) {
            const report: ISyncReport = {
                name: userData.name,
                uid: userData.uid,
                log: [],
            };
            reportList.push(report);
            try {
                const worklogList = await this.jiraModel.getLastUserWorklogs(userData);
                const newTimesheets = this.timesheetModel.convertWorklogsToTimesheets(worklogList);
                const timesheets = await this.timesheetModel.getLastUserTimesheets(userData);
                await this.timesheetModel.removeTimesheets(timesheets, report);
                await this.timesheetModel.saveTimesheets(newTimesheets, report);
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
