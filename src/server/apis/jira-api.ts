import JiraClientApi, { JiraApiOptions } from "jira-client";
import dateUtils from "../../common/date-utils";
import arrayUtils from "../../common/array-utils";
import { IAccount, IIssue, Worklog } from "../models/jira/interfaces";
import { IProjectConfig } from "../project-config";

export class JiraApi {
    private client: JiraClientApi;
    constructor(options: JiraApiOptions, private projectConfig: IProjectConfig) {
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
        const chunkSize = 1000;
        const allWorklogs: Worklog[] = [];
        for (let i = 0; i < ids.length; i += chunkSize) {
            const chunk = ids.slice(i, i + chunkSize);
            console.log(`JIRA getWorklogs ${chunk.length}x ...`);
            const response = await this.client.getWorklogs(
                chunk.map((i) => i + ""),
                undefined
            );
            allWorklogs.push(...(response as Worklog[]));
            console.log("... " + response.length);
        }
        return allWorklogs.map((t) => {
            const newT = new Worklog();
            Object.keys(t).forEach((key) => ((newT as any)[key] = (t as any)[key]));
            return newT;
        });
    }

    public async getCurrentUser(): Promise<IAccount> {
        console.log("JIRA get current user");
        const response = await this.client.getCurrentUser();
        return response as IAccount;
    }

    public async getProjects(): Promise<any[]> {
        const response = await this.client.listProjects();
        response.sort((a, b) => a.name.localeCompare(b.name));
        return response;
    }

    public async getNitsFiledValues(): Promise<{ [key: string]: string }> {
        const response = await this.client.getIssueCreateMetadata({
            expand: "projects.issuetypes.fields",
        });
        const values: { [key: string]: string } = {};
        response.projects.forEach((project: any) => {
            project.issuetypes.forEach((issuetype: any) => {
                const nitsFiled = issuetype?.fields[this.projectConfig.nitsCustomField];
                nitsFiled?.allowedValues?.forEach((field: any) => {
                    values[field.id] = field.value;
                });
            });
        });
        return values;
    }

    public async searchIssues(searchString: string, fields: string[]): Promise<IIssue[]> {
        let totalResults = 0;
        let response: any;
        const issues: IIssue[] = [];
        do {
            response = await this.client.searchJira(searchString, {
                maxResults: 1000,
                fields,
                startAt: totalResults,
            });
            totalResults += response.issues.length;
            issues.push(...response.issues);
        } while (totalResults < response.total);
        return [...issues];
    }
}
