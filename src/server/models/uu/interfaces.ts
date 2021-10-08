import { IUserData } from "../../../common/interfaces";
import { ISyncReportUser, TimesheetMapping } from "../interfaces";
import { Worklog } from "../jira/interfaces";

export type TimesheetModelFactoryHandler = (accessCode1: string, accessCode2: string) => ITimesheetModel;

export interface ITimesheetModel {
    saveTimesheets(newTimesheets: Timesheet[], report: ISyncReportUser): Promise<void>;
    removeTimesheets(timesheets: Timesheet[], report: ISyncReportUser): Promise<void>;
    getLastUserTimesheets(userData: IUserData): Promise<Timesheet[]>;
    convertWorklogsToTimesheetMappings(worklogList: Worklog[], report: ISyncReportUser): TimesheetMapping[];
}

export class Timesheet {
    public datetimeFrom: string;
    public datetimeTo: string;
    public subject: string;
    public supplierContract: string;
    public category: string;
    public highRate: boolean;
    public description: string;

    public toString(): string {
        return `UU Timesheet: ${this.datetimeFrom} - ${this.description}`;
    }
}
