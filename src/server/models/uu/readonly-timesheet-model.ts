import arrayUtils from "../../../common/array-utils";
import dateUtils from "../../../common/date-utils";
import { WtmApi, WtmError } from "../../apis/wtm-api";
import { IWtmTsConfigPerIssueKey } from "../../controllers/sync-controller";
import { ISyncReportUser, TimesheetMapping, TimesheetMappingsPerDay } from "../interfaces";
import { Worklog } from "../jira/interfaces";
import { UuUserModel } from "../uu-user-model";
import { ITimesheetModel, ITimesheetPerUser, Timesheet } from "./interfaces";

export class ReadOnlyTimesheetModel implements ITimesheetModel {
    constructor(protected accessCode1: string, protected accessCode2: string, protected uuUserModel: UuUserModel, protected wtmApi: WtmApi) {}

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

    public async getMyLastTimesheets(since: string): Promise<Timesheet[]> {
        const tokenResponse = await this.uuUserModel.getToken(this.accessCode1, this.accessCode2);
        const to = new Date();
        const toStr = dateUtils.toIsoFormat(to);
        const from = dateUtils.toDate(since);
        const fromStr = dateUtils.toIsoFormat(from);
        const fromMonthDate = new Date(from.getFullYear(), from.getMonth(), 1);
        const toMonthDate = new Date(to.getFullYear(), to.getMonth(), 1);
        const timesheets: Timesheet[] = [];
        let time = fromMonthDate;
        while (dateUtils.isLowerOrEqualsThen(time, toMonthDate)) {
            const items = await this.wtmApi.listWorkerTimesheetItemsByMonth(tokenResponse.id_token, time.getFullYear(), time.getMonth() + 1);
            items
                .filter((t) => dateUtils.toIsoFormat(t.datetimeFrom) >= fromStr && dateUtils.toIsoFormat(t.datetimeFrom) <= toStr)
                .map((t) => timesheets.push(t));
            time = dateUtils.toDate(dateUtils.increase(time, "month", 1));
        }
        return timesheets;
    }

    public async getTimesheetsOfUsers(userUids: string[], since: Date, toExcept: Date, filter?: (t: Timesheet) => boolean): Promise<ITimesheetPerUser> {
        const tokenResponse = await this.uuUserModel.getToken(this.accessCode1, this.accessCode2);
        const to = dateUtils.increaseDay(toExcept, -1);
        const toStr = dateUtils.toIsoFormat(to);
        const fromStr = dateUtils.toIsoFormat(since);
        const fromMonthDate = new Date(since.getFullYear(), since.getMonth(), 1);
        const toMonthDate = new Date(to.getFullYear(), to.getMonth(), 1);
        const timesheetsPerUser: ITimesheetPerUser = {};
        let time = fromMonthDate;
        while (dateUtils.isLowerOrEqualsThen(time, toMonthDate)) {
            console.log(`getTimesheetsOfUsers ${time.toISOString()}`);
            try {
                const evaluations = await this.wtmApi.listConfirmerMonthlyEvaluations(tokenResponse.id_token, time.getFullYear(), time.getMonth() + 1);
                console.log(`Evaluation ${evaluations.length}`);
                for (const evaluation of evaluations) {
                    if (!userUids.includes(evaluation.workerUuIdentity)) {
                        continue;
                    }
                    timesheetsPerUser[evaluation.workerUuIdentity] = timesheetsPerUser[evaluation.workerUuIdentity] || [];
                    const items = await this.wtmApi.listTimesheetItemsByMonthlyEvaluation(tokenResponse.id_token, evaluation.id);
                    items
                        .filter((t) => dateUtils.toIsoFormat(t.datetimeFrom) >= fromStr && dateUtils.toIsoFormat(t.datetimeFrom) <= toStr)
                        .filter((t) => (filter ? filter(t) : true))
                        .map((t) => timesheetsPerUser[evaluation.workerUuIdentity].push(t));
                }
            } catch (ex) {
                if (ex instanceof WtmError) {
                    if (
                        ex.uuAppErrorMap["uu-specialistwtm-main/listConfirmerMonthlyEvaluations/monthlyEvaluationsNotFound"] &&
                        ex.uuAppErrorMap["uu-specialistwtm-main/listConfirmerMonthlyEvaluations/confirmerMonthlyTimesheetNotFound"] &&
                        Object.keys(ex.uuAppErrorMap).length == 2
                    ) {
                        // This is not error for us. Just empty data
                    } else {
                        throw ex;
                    }
                } else {
                    throw ex;
                }
            }
            time = dateUtils.toDate(dateUtils.increase(time, "month", 1));
        }
        return timesheetsPerUser;
    }

    public convertWorklogsToTimesheetMappings(
        worklogList: Worklog[],
        wtmTsConfigPerIssueKey: IWtmTsConfigPerIssueKey,
        report: ISyncReportUser
    ): TimesheetMappingsPerDay {
        worklogList.forEach((w) => report.log.push(w.toString()));
        //TODO: BF: otestovat utc, zda se nahodou casy v 11vecer a v 1 ranu vykazou spravne
        const worklogsPerDay = arrayUtils.toGroups(worklogList, (w) => dateUtils.toIsoFormat(w.startedDate));
        const worklogsPerDayAndIssue: { [day: string]: { [issueId: string]: Worklog[] } } = {};
        Object.entries(worklogsPerDay).forEach(([day, wlogs]) => (worklogsPerDayAndIssue[day] = arrayUtils.toGroups(wlogs, (w) => w.issueKey)));
        console.log(worklogsPerDayAndIssue);
        const timesheetsMapping: TimesheetMapping[] = [];
        Object.entries(worklogsPerDayAndIssue).forEach(([day, worklogsPerIssue]) => {
            Object.entries(worklogsPerIssue).forEach(([issueKey, worklogs]) => {
                const mapping = new TimesheetMapping();
                mapping.jiraIssueKey = issueKey;
                mapping.date = day;
                mapping.description = worklogs.map((w) => w.commentAsText).join("\n");
                mapping.spentSeconds = arrayUtils.sumAction(worklogs, (w) => w.timeSpentSeconds);
                mapping.jiraWorklogs = worklogs;
                mapping.wtmArtifact = wtmTsConfigPerIssueKey[issueKey].wtmArtifact;
                timesheetsMapping.push(mapping);
            });
        });
        const timesheetMappingsPerDay = arrayUtils.toGroups(timesheetsMapping, (m) => m.date);
        return timesheetMappingsPerDay;
    }
}
