import { WtmApi } from "../../apis/wtm-api";
import { ISyncReportUser } from "../interfaces";
import { UuUserModel } from "../uu-user-model";
import { Timesheet } from "./interfaces";
import { ReadOnlyTimesheetModel } from "./readonly-timesheet-model";

export class WritableTimesheetModel extends ReadOnlyTimesheetModel {
    constructor(accessCode1: string, accessCode2: string, uuUserModel: UuUserModel, wtmApi: WtmApi) {
        super(accessCode1, accessCode2, uuUserModel, wtmApi);
    }

    public async saveTimesheets(newTimesheets: Timesheet[], report: ISyncReportUser): Promise<void> {
        if (newTimesheets.length == 0) {
            return;
        }
        const tokenResponse = await this.uuUserModel.getToken(this.accessCode1, this.accessCode2);
        for (const ts of newTimesheets) {
            report.log.push(`Saving timesheet ${ts} ...`);
            const id = await this.wtmApi.createTimesheetItem(tokenResponse.id_token, {
                datetimeFrom: ts.datetimeFrom,
                datetimeTo: ts.datetimeTo,
                description: ts.description,
                subject: ts.subject.match(/^ues:/) ? ts.subject : `ues:${ts.subject}`,
                data: ts.data,
            });
            report.log[report.log.length - 1] += " created, ID: " + id;
        }
    }

    public async removeTimesheets(timesheets: Timesheet[], report: ISyncReportUser): Promise<void> {
        if (timesheets.length == 0) {
            return;
        }
        for (const ts of timesheets) {
            report.log.push(`Deleting timesheet ${ts} ...`);
        }
        const toDelete = timesheets.map((t) => t.id);
        const tokenResponse = await this.uuUserModel.getToken(this.accessCode1, this.accessCode2);
        await this.wtmApi.deleteTimesheetItems(tokenResponse.id_token, toDelete);
        report.log[report.log.length - 1] += " deleted";
    }
}
