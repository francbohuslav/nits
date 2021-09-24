import JiraClientApi, { JiraApiOptions } from "jira-client";
import dateUtils from "../../common/date-utils";
import { IAccount, Worklog } from "../models/jira/interfaces";

export class JiraApi {
    private client: JiraClientApi;
    constructor(options: JiraApiOptions) {
        this.client = new JiraClientApi(options);
    }

    public async getUpdatedWorklogIds(): Promise<number[]> {
        let since = (dateUtils.toTimestamp() - 7 * 24 * 3600) * 1000;
        const worklogIdList = new Set<number>();
        let isLastPage = false;
        while (!isLastPage) {
            console.log("JIRA updatedWorklogs ...");
            const response = await this.client.updatedWorklogs(since, undefined);
            response.values.forEach((value: any) => {
                worklogIdList.add(value.worklogId);
            });

            console.log("... " + response.values.length);
            isLastPage = response.lastPage;
            if (!isLastPage) {
                since = response.until;
                console.log("Next page since " + since);
            }
        }
        return [...worklogIdList];
    }

    public async getWorklogs(ids: number[]): Promise<Worklog[]> {
        console.log("JIRA getWorklogs ...");
        const response = await this.client.getWorklogs(
            ids.map((i) => i + ""),
            undefined
        );
        console.log("... " + response.length);
        return response as Worklog[];
    }

    public async getCurrentUser(): Promise<IAccount> {
        console.log("JIRA get current user");
        const response = await this.client.getCurrentUser();
        return response as IAccount;
    }
}
