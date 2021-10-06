import arrayUtils from "../../common/array-utils";
import { ISyncReport, ISyncReportUser } from "../models/interfaces";
import { IIssue, IIssueCustomField, Worklog } from "../models/jira/interfaces";
import { JiraModel } from "../models/jira/jira-model";
import { UserDataModel } from "../models/user-data-model";
import { TimesheetModelFactoryHandler } from "../models/uu/interfaces";
import { ProjectController } from "./project-controller";
import { assert } from "../../common/core";
import { IProjectConfig } from "../project-config";
import { IProjectSettings } from "../../common/interfaces";

export class SyncController {
    constructor(
        private userDataModel: UserDataModel,
        private jiraModel: JiraModel,
        private projectController: ProjectController,
        private projectConfig: IProjectConfig,
        private timesheetModelFactory: TimesheetModelFactoryHandler
    ) {}

    public async sync(): Promise<ISyncReport> {
        const userDataList = await this.userDataModel.getAllValidUserData();
        const report: ISyncReport = { users: [], log: [] };
        let worklogList = await this.jiraModel.getLastWorklogs();
        const wtmTsConfigPerWorklogs: IWtmTsConfigPerWorklogId = {};
        worklogList = await this.filterWorklogsAndAssignWtmConfig(worklogList, wtmTsConfigPerWorklogs, report);
        const worklogListPerAccountId: { [accountId: string]: Worklog[] } = {};
        worklogList.forEach((w) => {
            const accountId = w.author.accountId;
            worklogListPerAccountId[accountId] = worklogListPerAccountId[accountId] || [];
            worklogListPerAccountId[accountId].push(w);
        });
        for (const [accountId, worklogList] of Object.entries(worklogListPerAccountId)) {
            const userData = userDataList.find((u) => u.jiraAccountId == accountId);
            const reportUser: ISyncReportUser = {
                name: userData?.name,
                uid: userData?.uid || worklogList[0].author.displayName,
                log: [],
            };
            if (!userData) {
                //report.log.push("User is not logged into NITS, skipped.");
                continue;
            }
            report.users.push(reportUser);
            try {
                const timesheetModel = this.timesheetModelFactory(userData.uuAccessCode1, userData.uuAccessCode2);
                const newTimesheets = timesheetModel.convertWorklogsToTimesheets(worklogList);
                const timesheets = await timesheetModel.getLastUserTimesheets(userData);
                await timesheetModel.removeTimesheets(timesheets, reportUser);
                await timesheetModel.saveTimesheets(newTimesheets, reportUser);
            } catch (err) {
                if (err instanceof Error) {
                    reportUser.log.push(err.message + "\n" + err.stack);
                } else {
                    reportUser.log.push(err.toString());
                }
            }
        }
        return report;
    }

    protected async filterWorklogsAndAssignWtmConfig(
        worklogList: Worklog[],
        wtmTsConfigPerWorklogs: IWtmTsConfigPerWorklogId,
        report: ISyncReport
    ): Promise<Worklog[]> {
        const projectSettingsList = await this.projectController.getProjectSettings();

        const validProjectCodes = projectSettingsList.map((p) => p.jiraProjectKey);
        const issuesById = await this.getAllNeededIssues(worklogList);
        const validWorklogs: Worklog[] = [];
        for (const workglog of worklogList) {
            const issue = issuesById[workglog.issueId];
            const parentIssue = issue.fields.parent ? issuesById[issue.fields.parent.id] : null;
            assert(issue, `Issue ${workglog.issueId} of worklog ${workglog.toString()} not found`);

            const projectKey = issue.fields.project.key;
            let nitsField = issue.fields[this.projectConfig.jira.nitsCustomField] as IIssueCustomField;
            nitsField = nitsField || (parentIssue ? (parentIssue.fields[this.projectConfig.jira.nitsCustomField] as IIssueCustomField) : null);
            const nitsFieldId = nitsField ? nitsField.id : null;

            let projectSettings: IProjectSettings = null;

            if (validProjectCodes.indexOf(projectKey) == -1) {
                report.log.push(`Worklog ${workglog.toString()} skipped. Project ${projectKey} is not configured.`);
                continue;
            }

            // Exact fit of project and NITS field
            projectSettings = projectSettingsList.find((p) => p.jiraProjectKey == projectKey && p.jiraNitsField && p.jiraNitsField == nitsFieldId);
            if (projectSettings) {
                report.log.push(`Worklog ${workglog.toString()} passed. Artifact ${projectSettings.wtmArtifact} will be used.`);
            }
            // Issue with project without specified NITS field
            if (!projectSettings) {
                projectSettings = projectSettingsList.find((p) => p.jiraProjectKey == projectKey && !p.jiraNitsField && !nitsFieldId);
                if (projectSettings) {
                    report.log.push(`Worklog ${workglog.toString()} passed. Artifact ${projectSettings.wtmArtifact} will be used.`);
                }
            }
            // Issue with project but with unknown NITS field
            if (!projectSettings) {
                projectSettings = projectSettingsList.find((p) => p.jiraProjectKey == projectKey && !p.jiraNitsField && nitsFieldId);
                if (projectSettings) {
                    report.log.push(
                        `Worklog ${workglog.toString()} passed. Artifact ${
                            projectSettings.wtmArtifact
                        } will be used. WARNING: issue or parent has unused NITS custom field ${JSON.stringify(nitsField)}.`
                    );
                }
            }
            if (projectSettings) {
                validWorklogs.push(workglog);
                wtmTsConfigPerWorklogs[workglog.id] = {
                    projectSettings,
                    artifact: projectSettings.wtmArtifact,
                };
            } else {
                report.log.push(`Worklog ${workglog.toString()} skipped. Neither issue ${issue.key} nor parent has no valid configuration.`);
            }
        }
        return validWorklogs;
    }

    private async getAllNeededIssues(worklogList: Worklog[]): Promise<{ [id: string]: IIssue }> {
        const issues = worklogList.length ? await this.jiraModel.getIssuesById(worklogList.map((w) => w.issueId)) : [];
        const issuesById = arrayUtils.toDictionary<IIssue, IIssue>(issues, (i) => i.id);
        const parents = issues.length ? await this.jiraModel.getIssuesById(issues.filter((i) => i.fields.parent?.id).map((i) => i.fields.parent.id)) : [];
        parents.forEach((p) => {
            if (!issuesById[p.id]) {
                issuesById[p.id] = p;
            }
        });
        return issuesById;
    }
}

export interface IWtmTsConfig {
    artifact: string;
    projectSettings: IProjectSettings;
}

export type IWtmTsConfigPerWorklogId = { [worklogId: string]: IWtmTsConfig };
