import dateUtils from "../../../common/date-utils";
import { IUserData } from "../../../common/interfaces";
import { ISyncReportUser, TimesheetMappingsPerDay } from "../interfaces";
import { Worklog } from "../jira/interfaces";

export type TimesheetModelFactoryHandler = (accessCode1: string, accessCode2: string) => ITimesheetModel;

export interface ITimesheetModel {
    saveTimesheets(newTimesheets: Timesheet[], report: ISyncReportUser): Promise<void>;
    removeTimesheets(timesheets: Timesheet[], report: ISyncReportUser): Promise<void>;
    getUserLastTimesheets(userData: IUserData): Promise<Timesheet[]>;
    convertWorklogsToTimesheetMappings(worklogList: Worklog[], report: ISyncReportUser): TimesheetMappingsPerDay;
}

export class Timesheet {
    public datetimeFrom: string;
    public datetimeTo: string;
    public subject: string;
    public supplierContract: string;
    public category: string;
    public highRate: boolean;
    public description: string;
    public data: ITimesheetData;

    public toString(): string {
        return `UU Timesheet: ${dateUtils.formatDateTime(this.datetimeFrom, true)} - ${dateUtils.formatDateTime(this.datetimeTo, true)} - ${this.description}`;
    }
}

export interface ITimesheetData {
    nits: {
        issueKey: string;
        worklogIds: string[];
    };
}
