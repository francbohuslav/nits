import { JiraApi } from "../../apis/jira-api";
import { IAccount, Worklog } from "./interfaces";

export class JiraModel {
    constructor(private jiraApi: JiraApi) {}
    public async getLastWorklogs(): Promise<Worklog[]> {
        const worklogIdList = await this.jiraApi.getUpdatedWorklogIds();
        const worklogList = await this.jiraApi.getWorklogs(worklogIdList);
        worklogList.forEach((w) => {
            w.commentAsText = this.convertCommentToText(w);
            w.startedDate = new Date(w.started);
        });
        return worklogList;
    }

    public async getCurrentUser(): Promise<IAccount> {
        return await this.jiraApi.getCurrentUser();
    }

    //TODO: BF: vice vykazu nenaslo
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
                    if (s.type != "text") {
                        worklog.commentAsTextErrors.push(`Comment segment "${s.type}" is not supported in worklog ${worklog.id}"`);
                    }
                    if (s.text) {
                        line.push(s.text);
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