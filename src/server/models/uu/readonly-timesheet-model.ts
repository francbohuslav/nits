import dateUtils from "../../../common/date-utils";
import { IUserData } from "../../../common/interfaces";
import { WtmApi } from "../../apis/wtm-api";
import { ISyncReportUser } from "../interfaces";
import { Worklog } from "../jira/interfaces";
import { UuUserModel } from "../uu-user-model";
import { ITimesheetModel, Timesheet } from "./interfaces";

export class ReadOnlyTimesheetModel implements ITimesheetModel {
    constructor(private accessCode1: string, private accessCode2: string, private uuUserModel: UuUserModel, private wtmApi: WtmApi) {}

    public async saveTimesheets(newTimesheets: Timesheet[], report: ISyncReportUser): Promise<void> {
        for (const ts of newTimesheets) {
            report.log.push(`Simulation of saving timesheet ${ts}`);
        }
    }
    public async removeTimesheets(timesheets: Timesheet[], report: ISyncReportUser): Promise<void> {
        for (const ts of timesheets) {
            report.log.push(`Simulation of removing timesheet ${ts}`);
        }
    }
    public async getLastUserTimesheets(_userData: IUserData): Promise<Timesheet[]> {
        const tokenResponse = await this.uuUserModel.getToken(this.accessCode1, this.accessCode2);
        const to = new Date();
        const toStr = dateUtils.toIsoFormat(to);
        const from = dateUtils.toDate(dateUtils.increaseDay(new Date(), -7));
        const fromStr = dateUtils.toIsoFormat(from);
        const fromMonthDate = new Date(from.getFullYear(), from.getMonth(), 1);
        const toMonthDate = new Date(to.getFullYear(), to.getMonth(), 1);
        const timesheets: Timesheet[] = [];
        let time = fromMonthDate;
        while (dateUtils.toIsoFormat(toMonthDate) >= dateUtils.toIsoFormat(time)) {
            const items = await this.wtmApi.listWorkerTimesheetItemsByMonth(tokenResponse.id_token, time.getFullYear(), time.getMonth() + 1);
            items
                .filter((t) => dateUtils.toIsoFormat(t.datetimeFrom) >= fromStr && dateUtils.toIsoFormat(t.datetimeFrom) <= toStr)
                .map((t) => timesheets.push(t));
            time = dateUtils.toDate(dateUtils.increase(time, "month", 1));
        }
        return timesheets;
    }
    convertWorklogsToTimesheets(worklogList: Worklog[]): Timesheet[] {
        return worklogList.map((w) => {
            const ts = new Timesheet();
            ts.description = w.commentAsText;
            ts.datetimeFrom = w.startedDate.toISOString();
            ts.datetimeTo = new Date(dateUtils.increase(w.startedDate, "seconds", w.timeSpentSeconds)).toISOString();
            //TODO: BF: tady bude prevod na subject
            return ts;
        });
    }
}
