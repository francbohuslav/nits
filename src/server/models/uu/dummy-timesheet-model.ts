import { IUserData } from "../../../common/interfaces";
import { ISyncReport } from "../interfaces";
import { Worklog } from "../jira/interfaces";
import { ITimesheetModel, Timesheet } from "./interfaces";

export class DummyTimesheetModel implements ITimesheetModel {
    public async saveTimesheets(newTimesheets: Timesheet[], report: ISyncReport): Promise<void> {
        for (const ts of newTimesheets) {
            console.log(`Saving timesheet ${ts}`);
            report.log.push(`Saving timesheet ${ts}`);
        }
    }
    public async removeTimesheets(timesheets: Timesheet[], report: ISyncReport): Promise<void> {
        for (const ts of timesheets) {
            console.log(`Removing timesheet ${ts}`);
            report.log.push(`Removing timesheet ${ts}`);
        }
    }
    public async getLastUserTimesheets(userData: IUserData): Promise<Timesheet[]> {
        //TODO: BF: nejaka pekna data
        return [new Timesheet(), new Timesheet()];
    }
    convertWorklogsToTimesheets(worklogList: Worklog[]): Timesheet[] {
        return worklogList.map((w) => {
            const ts = new Timesheet();
            return ts;
        });
    }
}
