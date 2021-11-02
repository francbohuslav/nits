import axios, { AxiosError } from "axios";
import { assert } from "../../common/core";
import { IMonthlyEvaluation, Timesheet } from "../models/uu/interfaces";

export class WtmApi {
    private wtmUrl = "https://uuos9.plus4u.net/uu-specialistwtmg01-main/99923616732453117-8031926f783d4aaba733af73c1974840";

    public async listWorkerTimesheetItemsByMonth(idToken: string, year: number, month: number): Promise<Timesheet[]> {
        assert(year);
        assert(month);

        try {
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
        } catch (ex) {
            if (ex instanceof WtmError) {
                if (
                    ex.response?.uuAppErrorMap &&
                    Object.values(ex.response?.uuAppErrorMap).length == 1 &&
                    !ex.response?.uuAppErrorMap["uu-specialistwtm-main/listWorkerTimesheetItemsByMonth/timesheetItemsNotFound"]
                ) {
                    throw ex;
                }
                return [];
            } else {
                throw ex;
            }
        }
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
        assert(evaluationId);
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

    public async createTimesheetItem(idToken: string, newTimesheet: INewTimesheet): Promise<string> {
        try {
            const response = await this.serverRequest<ICreateTimesheetItemResponse>(idToken, "createTimesheetItem", newTimesheet);
            return response.createdTimesheetItem.id;
        } catch (err) {
            if (err instanceof WtmError) {
                err.additionalData = newTimesheet;
            }
            throw err;
        }
    }

    public async deleteTimesheetItems(idToken: string, ids: string[]): Promise<void> {
        try {
            const response = await this.serverRequest<IDeleteTimesheetItemsResponse>(idToken, "deleteTimesheetItems", {
                itemList: ids.map((id) => ({ id })),
            });

            if (response.deletedItemList == null || response.deletedItemList.length != ids.length) {
                console.log("To delete", ids);
                console.log("Response", response);
                throw new Error(`Nelze smazat některé výkazy. Více v logách na serveru.`);
            }
        } catch (err) {
            if (err instanceof WtmError) {
                err.additionalData = ids;
            }
            throw err;
        }
    }

    private convertToTimesheets(timesheetItemList: Timesheet[]): Timesheet[] {
        return timesheetItemList.map((t) => {
            const newT = new Timesheet();
            Object.keys(t).forEach((key) => ((newT as any)[key] = (t as any)[key]));
            return newT;
        });
    }

    private async serverRequest<T extends IBaseResponse>(idToken: string, command: string, dtoIn: any): Promise<T> {
        try {
            console.log("/" + command);
            const response = await axios.post(this.wtmUrl + "/" + command, dtoIn, {
                headers: { Authorization: `Bearer ${idToken}` },
            });
            const data = response.data as T;
            if (data.uuAppErrorMap && Object.keys(data.uuAppErrorMap).length) {
                throw new WtmError("UU WTM error", data);
            }
            return data;
        } catch (err) {
            const error = err as AxiosError<IBaseResponse>;
            if (error.isAxiosError) {
                const response: IErrorResponse = {
                    ...error.response.data,
                    status: error.response.status,
                    statusText: error.response.statusText,
                };
                throw new WtmError(err.message, response);
            }
            if (err instanceof WtmError) {
                throw err;
            }
            throw new WtmError(err.message, err.response?.data);
        }
    }
}

export class WtmError extends Error {
    constructor(message: string, public response: IBaseResponse, public additionalData?: any) {
        super(message);
    }
}

interface IBaseResponse {
    uuAppErrorMap: any;
}

interface IErrorResponse extends IBaseResponse {
    status: number;
    statusText: string;
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

interface ICreateTimesheetItemResponse extends IBaseResponse {
    createdTimesheetItem: Timesheet;
}

interface IDeleteTimesheetItemsResponse extends IBaseResponse {
    deletedItemList: Timesheet[];
}

interface INewTimesheet {
    datetimeFrom: string;
    datetimeTo: string;
    subject: string;
    description: string;
    data: any;
}
