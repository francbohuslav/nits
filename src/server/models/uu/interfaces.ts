import { IUserData } from "../../../common/interfaces";
import { ISyncReport } from "../interfaces";
import { Worklog } from "../jira/interfaces";

export interface ITimesheetModel {
    saveTimesheets(newTimesheets: Timesheet[], report: ISyncReport): Promise<void>;
    removeTimesheets(timesheets: Timesheet[], report: ISyncReport): Promise<void>;
    getLastUserTimesheets(userData: IUserData): Promise<Timesheet[]>;
    convertWorklogsToTimesheets(worklogList: Worklog[]): Timesheet[];
}

export class Timesheet {
    public toString(): string {
        //TODO: BF: dodat nejakou identifikac
        return "UU Timesheet";
    }
}
