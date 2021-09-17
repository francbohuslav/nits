import JiraClientApi, { JiraApiOptions } from "jira-client";
import dateUtils from "../../common/date-utils";
import { IAccount, Worklog } from "../models/jira/interfaces";

export class JiraApi {
    private client: JiraClientApi;
    constructor(options: JiraApiOptions) {
        this.client = new JiraClientApi(options);
    }

    public async getUpdatedWorklogIds(): Promise<number[]> {
        //TODO: BF:
        let since = (dateUtils.getActualTimestamp() - 1 * 24 * 3600) * 1000;
        // let since = (dateUtils.getActualTimestamp() - 5 * 24 * 3600) * 1000;
        const worklogIdList = new Set<number>();
        let isLastPage = false;
        while (!isLastPage) {
            const response = await this.client.updatedWorklogs(since, undefined);
            response.values.forEach((value: any) => {
                worklogIdList.add(value.worklogId);
            });

            isLastPage = response.lastPage;
            if (!isLastPage) {
                since = response.until;
                console.log("Next page since " + since);
            }
        }
        return [...worklogIdList];
    }

    public async getWorklogs(ids: number[]): Promise<Worklog[]> {
        const response = await this.client.getWorklogs(
            ids.map((i) => i + ""),
            undefined
        );
        return response as Worklog[];
    }

    public async getCurrentUser(): Promise<IAccount> {
        const response = await this.client.getCurrentUser();
        return response as IAccount;
    }
}
