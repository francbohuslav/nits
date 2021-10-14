import axios from "axios";
import { IMonthlyEvaluation, Timesheet } from "../models/uu/interfaces";

export class WtmApi {
    private wtmUrl = "https://uuos9.plus4u.net/uu-specialistwtmg01-main/99923616732453117-8031926f783d4aaba733af73c1974840";

    public async listWorkerTimesheetItemsByMonth(idToken: string, year: number, month: number): Promise<Timesheet[]> {
        const response = await this.serverRequest<IListWorkerTimesheetItemsByMonthResponse>(idToken, "listWorkerTimesheetItemsByMonth", {
            yearMonth: year + (month + "").padStart(2, "0"),
            pageInfo: {
                pageIndex: 0,
                pageSize: 10000,
            },
        });
        if (response.pageInfo.total >= response.pageInfo.pageSize) {
            throw new Error(`Příliš mnoho výkazů pro ${year}-${month}`);
        }
        return this.convertToTimesheets(response.timesheetItemList);
    }

    public async listConfirmerMonthlyEvaluations(idToken: string, year: number, month: number): Promise<IMonthlyEvaluation[]> {
        const response = await this.serverRequest<IListConfirmerMonthlyEvaluations>(idToken, "listConfirmerMonthlyEvaluations", {
            yearMonth: year + (month + "").padStart(2, "0"),
            pageInfo: {
                pageIndex: 0,
                pageSize: 10000,
            },
        });
        if (response.pageInfo.total >= response.pageInfo.pageSize) {
            throw new Error(`Příliš mnoho evaluations pro ${year}-${month}`);
        }
        return response.monthlyEvaluationList;
    }

    public async listTimesheetItemsByMonthlyEvaluation(idToken: string, evaluationId: string): Promise<Timesheet[]> {
        const response = await this.serverRequest<IListWorkerTimesheetItemsByMonthResponse>(idToken, "listTimesheetItemsByMonthlyEvaluation", {
            monthlyEvaluation: evaluationId,
            pageInfo: {
                pageIndex: 0,
                pageSize: 10000,
            },
        });
        if (response.pageInfo.total >= response.pageInfo.pageSize) {
            throw new Error(`Příliš mnoho výkazů pro ${evaluationId}`);
        }
        return this.convertToTimesheets(response.timesheetItemList);
    }

    private convertToTimesheets(timesheetItemList: Timesheet[]): Timesheet[] {
        return timesheetItemList.map((t) => {
            const newT = new Timesheet();
            Object.keys(t).forEach((key) => ((newT as any)[key] = (t as any)[key]));
            return newT;
        });
    }

    private async serverRequest<T extends IBaseResponse>(idToken: string, command: string, dtoIn: any): Promise<T> {
        const response = await axios.post(this.wtmUrl + "/" + command, dtoIn, {
            headers: { Authorization: `Bearer ${idToken}` },
        });
        const data = response.data as T;
        if (data.uuAppErrorMap && Object.keys(data.uuAppErrorMap).length) {
            throw new WtmError("UU WTM error", data.uuAppErrorMap);
        }
        return data;
    }
}

export class WtmError extends Error {
    constructor(message: string, public uuAppErrorMap: any) {
        super(message);
    }
}

interface IBaseResponse {
    uuAppErrorMap: any;
}

interface IPagedResponse extends IBaseResponse {
    pageInfo: {
        total: number;
        pageSize: number;
    };
}

interface IListWorkerTimesheetItemsByMonthResponse extends IPagedResponse {
    timesheetItemList: Timesheet[];
}

interface IListConfirmerMonthlyEvaluations extends IPagedResponse {
    monthlyEvaluationList: IMonthlyEvaluation[];
}
