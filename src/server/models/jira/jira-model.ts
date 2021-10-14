import { JiraApi } from "../../apis/jira-api";
import { IProjectConfig } from "../../project-config";
import { IAccount, IIssue, Worklog } from "./interfaces";

export class JiraModel {
    constructor(private jiraApi: JiraApi, private projectConfig: IProjectConfig) {}

    public async getLastWorklogs(sinceDays: number): Promise<Worklog[]> {
        const worklogIdList = await this.jiraApi.getUpdatedWorklogIds(sinceDays);
        const worklogList = await this.jiraApi.getWorklogs(worklogIdList);
        worklogList.forEach((w) => {
            w.commentAsText = this.convertCommentToText(w);
            w.startedDate = new Date(w.started);
        });
        worklogList.sort((a, b) => a.startedDate.getTime() - b.startedDate.getTime());
        return worklogList;
    }

    public async getCurrentUser(): Promise<IAccount> {
        return await this.jiraApi.getCurrentUser();
    }

    public async getIssuesById(ids: string[]): Promise<IIssue[]> {
        const uniqIds = ids.filter((id, index) => ids.indexOf(id) == index);
        return await this.jiraApi.searchIssues("id in (" + uniqIds.join(",") + ")", ["project", "parent", this.projectConfig.jira.nitsCustomField]);
    }

    private convertCommentToText(worklog: Worklog): string {
        worklog.commentAsTextErrors = [];
        const comment = worklog.comment;
        const lines: string[] = [];
        if (comment) {
            if (comment.type != "doc") {
                worklog.commentAsTextErrors.push(`Comment type "${comment.type}" is not supported in worklog ${worklog.id}"`);
            }
            if (comment.version != 1) {
                worklog.commentAsTextErrors.push(`Comment version "${comment.version}" is not supported in worklog ${worklog.id}"`);
            }
            comment.content.forEach((p) => {
                if (p.type != "paragraph") {
                    worklog.commentAsTextErrors.push(`Comment block "${p.type}" is not supported in worklog ${worklog.id}"`);
                }
                const line: string[] = [];
                p.content.forEach((s) => {
                    if (s.type == "text") {
                        if (s.text) {
                            line.push(s.text);
                        }
                    } else if (s.type == "emoji") {
                        if (s.attrs?.text) {
                            line.push(s.attrs?.text);
                        }
                    } else {
                        worklog.commentAsTextErrors.push(`Comment segment "${s.type}" is not supported in worklog ${worklog.id}"`);
                    }
                });
                if (line.length) {
                    lines.push(line.join(""));
                }
            });
        }
        return lines.join("\n");
    }
}
