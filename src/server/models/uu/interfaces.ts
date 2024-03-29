import dateUtils from "../../../common/date-utils";
import { IUserData } from "../../../common/interfaces";
import { ISyncReportUser, TimesheetMappingsPerDay } from "../interfaces";
import { Worklog } from "../jira/interfaces";
import { IWtmTsConfigPerIssueKey } from "../jira/jira-model";

export type TimesheetModelFactoryHandler = (userData: IUserData) => ITimesheetModel;

export interface ITimesheetModel {
    saveTimesheets(newTimesheets: Timesheet[], report: ISyncReportUser): Promise<void>;
    removeTimesheets(timesheets: Timesheet[], report: ISyncReportUser): Promise<void>;
    getMyLastTimesheets(since: string): Promise<Timesheet[]>;
    convertWorklogsToTimesheetMappings(
        worklogList: Worklog[],
        wtmTsConfigPerIssueKey: IWtmTsConfigPerIssueKey,
        report: ISyncReportUser
    ): TimesheetMappingsPerDay;
    getTimesheetsOfUsers(
        userUids: string[],
        since: Date,
        toExcept: Date,
        projectCode: string,
        filter?: (t: Timesheet, code: string) => boolean
    ): Promise<ITimesheetPerUser>;
}

export class Timesheet {
    public id: string;
    public datetimeFrom: string;
    public datetimeTo: string;
    public subject: string;
    public description: string;
    public data: ITimesheetData;
    public workerUuIdentity: string;

    public getSpentHours() {
        return dateUtils.secondsBetween(this.datetimeFrom, this.datetimeTo) / 3600;
    }

    public isSameAs(other: Timesheet) {
        return (
            this.datetimeFrom == other.datetimeFrom &&
            this.datetimeTo == other.datetimeTo &&
            this.subject == other.subject &&
            this.description == other.description &&
            JSON.stringify(this.data) == JSON.stringify(other.data)
        );
    }

    public toString(): string {
        const time = dateUtils.secondsBetween(this.datetimeFrom, this.datetimeTo) / 3600;
        return `UU Timesheet: ${dateUtils.formatDateTime(this.datetimeFrom, true)} - ${dateUtils.formatDateTime(
            this.datetimeTo,
            true
        )} = ${dateUtils.formatHours(time)} | ${this.subject} | ${this.description}`;
    }
}

export interface ITimesheetData {
    nits: {
        project: string;
        issueKey: string;
        worklogIds: string[];
    };
}

export interface IMonthlyEvaluation {
    id: string; // "5d42f13390d8d20009fc68ca",
    awid: string; // "8031926f783d4aaba733af73c1974840",
    workerUuIdentity: string; // "12-4127-1",
    confirmerUuIdentity: string; // "12-8835-1",
    yearMonth: string; // "201908",
    timesheetOU: string; // "ues:UNI-BT[210795]:SWF.D1.DAMAS-62[88101689640399391]:",
    minutesWorkedNormalRate: number; // 2490,
    minutesWorkedHighRate: number; // 0,
    minutesConfirmedNormalRate: number; // 2490,
    minutesConfirmedHighRate: number; // 0,
    minutesNotConfirmedNormalRate: number; // 0,
    minutesNotConfirmedHighRate: number; // 0,
    workerMonthlyTimesheet: string; // "5d42cf0990d8d20009fc4d04",
    confirmerMonthlyTimesheet: string; // "5d42e93190d8d20009fc6099",
    existsItemNotFullyConfirmed: boolean; // false;
    workerData: {
        id: string; //"5b100fe83329ff0005a30049";
        uuIdentity: string; // "12-4127-1";
        name: string; //"Jan Tuček";
    };
    workerMonthlyTimesheetData: {
        id: string; // 5d42cf0990d8d20009fc4d04";
        awid: string; // 8031926f783d4aaba733af73c1974840";
        workerUuIdentity: string; // 12-4127-1";
        yearMonth: string; // 201908";
        minutesWorkedNormalRate: number; // 6090;
        minutesWorkedHighRate: number; // 0;
        minutesConfirmedNormalRate: number; // 5985;
        minutesConfirmedHighRate: number; // 0;
        minutesNotConfirmedNormalRate: number; //  0;
        minutesNotConfirmedHighRate: number; // 0;
    };
    timesheetOUData: {
        id: string; // 5c9dd5b0e90aaa000933bac1";
        name: string; // uuDamasEvog01.Phase62.Designs";
        code: string; // SWF.D1.DAMAS-62";
    };
}

export type ITimesheetPerUser = { [uid: string]: Timesheet[] };

export const nitsTimesheetFilter = (t: Timesheet, wtmProjectCode: string) => {
    if (!wtmProjectCode) {
        throw Error("Project code is not set. Contact author of this app and provide him screen of this error.");
    }
    const dataProject = t.data?.nits?.project || "NITS";
    return t.data?.nits !== undefined && dataProject === wtmProjectCode;
};
