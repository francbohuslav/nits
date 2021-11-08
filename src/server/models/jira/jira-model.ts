import { Inject } from "injector";
import arrayUtils from "../../../common/array-utils";
import { assert } from "../../../common/core";
import dateUtils from "../../../common/date-utils";
import { IArtifactSettings } from "../../../common/interfaces";
import { JiraApi } from "../../apis/jira-api";
import { IProjectConfig } from "../../project-config";
import { ISyncReport } from "../interfaces";
import { IAccount, IIssue, IIssueCustomField, Worklog } from "./interfaces";

@Inject.Singleton
export class JiraModel {
    constructor(private jiraApi: JiraApi, @Inject.Value("projectConfig") private projectConfig: IProjectConfig) {}

    public async getLastWorklogs(since: Date, toExcept: Date): Promise<Worklog[]> {
        const worklogIdList = await this.jiraApi.getUpdatedWorklogIds(since, toExcept);
        let worklogList = await this.jiraApi.getWorklogs(worklogIdList);
        worklogList.forEach((w) => {
            w.startedDate = new Date(w.started);
        });
        worklogList = worklogList.filter((w) => dateUtils.isLowerThen(w.startedDate, toExcept) && dateUtils.isLowerOrEqualsThen(since, w.startedDate));
        worklogList.forEach((w) => {
            w.commentAsText = this.convertCommentToText(w);
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

    public async filterWorklogsAndAssignWtmConfig(
        worklogList: Worklog[],
        issuesById: { [id: string]: IIssue },
        wtmTsConfigPerIssueKey: IWtmTsConfigPerIssueKey,
        artifactSettingsList: IArtifactSettings[],
        report: ISyncReport
    ): Promise<Worklog[]> {
        const validProjectCodes = artifactSettingsList.map((p) => p.jiraProjectKey);

        const validWorklogs: Worklog[] = [];
        for (const workglog of worklogList) {
            const issue = issuesById[workglog.issueId];
            const parentIssue = issue.fields.parent ? issuesById[issue.fields.parent.id] : null;
            assert(issue, `Issue ${workglog.issueKey} of worklog ${workglog.toString()} not found`);

            const projectKey = issue.fields.project.key;
            let nitsField = issue.fields[this.projectConfig.jira.nitsCustomField] as IIssueCustomField;
            nitsField = nitsField || (parentIssue ? (parentIssue.fields[this.projectConfig.jira.nitsCustomField] as IIssueCustomField) : null);
            const nitsFieldId = nitsField ? nitsField.id : null;

            let artifactSettings: IArtifactSettings = null;

            if (!validProjectCodes.includes(projectKey)) {
                report.log.push(`Worklog ${workglog.toString()} skipped. Project ${projectKey} is not configured.`);
                continue;
            }

            // Exact fit of project and NITS field
            artifactSettings = artifactSettingsList.find((p) => p.jiraProjectKey == projectKey && p.jiraNitsField && p.jiraNitsField == nitsFieldId);
            if (artifactSettings) {
                report.log.push(`Worklog ${workglog.toString()} passed. Artifact ${artifactSettings.wtmArtifact} will be used.`);
            }
            // Issue with project without specified NITS field
            if (!artifactSettings) {
                artifactSettings = artifactSettingsList.find((p) => p.jiraProjectKey == projectKey && !p.jiraNitsField && !nitsFieldId);
                if (artifactSettings) {
                    report.log.push(`Worklog ${workglog.toString()} passed. Artifact ${artifactSettings.wtmArtifact} will be used.`);
                }
            }
            // Issue with project but with unknown NITS field
            if (!artifactSettings) {
                artifactSettings = artifactSettingsList.find((p) => p.jiraProjectKey == projectKey && !p.jiraNitsField && nitsFieldId);
                if (artifactSettings) {
                    report.log.push(
                        `Worklog ${workglog.toString()} passed. Artifact ${
                            artifactSettings.wtmArtifact
                        } will be used. WARNING: issue or parent has unused NITS custom field ${JSON.stringify(nitsField)}.`
                    );
                }
            }
            if (artifactSettings) {
                validWorklogs.push(workglog);
                wtmTsConfigPerIssueKey[issue.key] = artifactSettings;
            } else {
                report.log.push(`Worklog ${workglog.toString()} skipped. Neither issue ${issue.key} nor parent has no valid configuration.`);
            }
        }
        return validWorklogs;
    }

    /**
     * Returns all used issues and parents in worklogs
     * @param worklogList
     */
    public async getAllNeededIssues(worklogList: Worklog[]): Promise<{ [id: string]: IIssue }> {
        const issues = worklogList.length ? await this.getIssuesById(worklogList.map((w) => w.issueId)) : [];
        const issuesById = arrayUtils.toDictionary<IIssue, IIssue>(issues, (i) => i.id);
        const parents = issues.length ? await this.getIssuesById(issues.filter((i) => i.fields.parent?.id).map((i) => i.fields.parent.id)) : [];
        parents.forEach((p) => {
            if (!issuesById[p.id]) {
                issuesById[p.id] = p;
            }
        });
        return issuesById;
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

export type IWtmTsConfigPerIssueKey = { [issueId: string]: IArtifactSettings };
