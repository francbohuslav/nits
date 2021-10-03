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

    private async filterWorklogsAndAssignWtmConfig(
        worklogList: Worklog[],
        wtmTsConfigPerWorklogs: IWtmTsConfigPerWorklogId,
        report: ISyncReport
    ): Promise<Worklog[]> {
        const projectSettingsList = await this.projectController.getProjectSettings();
        const projectsWithNitsField = projectSettingsList.filter((p) => !!p.jiraNitsField).map((p) => p.jiraProjectCode);
        console.log("projectsWithNitsField", projectsWithNitsField);
        const projectsWithoutNitsField = projectSettingsList
            .filter((p) => projectsWithNitsField.indexOf(p.jiraProjectCode) == -1)
            .map((p) => p.jiraProjectCode);
        console.log("projectsWithoutNitsField", projectsWithoutNitsField);

        const validProjectCodes = projectSettingsList.map((p) => p.jiraProjectCode);
        const issuesById = await this.getAllNeededIssues(worklogList);
        const validWorklogs: Worklog[] = [];
        for (const workglog of worklogList) {
            const issue = issuesById[workglog.issueId];
            const nitsField = issue.fields[this.projectConfig.nitsCustomField] as IIssueCustomField;
            assert(issue, `Issue ${workglog.issueId} of worklog ${workglog.toString()} not found`);
            if (validProjectCodes.indexOf(issue.fields.project.key) == -1) {
                report.log.push(`Worklog ${workglog.toString()} skipped. Project ${issue.fields.project.key} is not configured.`);
                continue;
            }
            // Issue with project without specified nits field
            if (projectsWithoutNitsField.indexOf(issue.fields.project.key) > -1) {
                validWorklogs.push(workglog);
                const projectSettings = projectSettingsList.find((p) => p.jiraProjectCode == issue.fields.project.key && !p.jiraNitsField);
                report.log.push(`Worklog ${workglog.toString()} passed. Artifact ${projectSettings.wtmArtifact} will be used.`);
                wtmTsConfigPerWorklogs[workglog.id] = {
                    projectSettings,
                    artifact: projectSettings.wtmArtifact,
                };
                continue;
            }
            // Issue with project and nits specified
            let projectSettings = projectSettingsList.find(
                (p) => p.jiraProjectCode == issue.fields.project.key && p.jiraNitsField && p.jiraNitsField == nitsField?.id
            );
            if (projectSettings) {
                report.log.push(`Worklog ${workglog.toString()} passed. Artifact ${projectSettings.wtmArtifact} will be used.`);
                validWorklogs.push(workglog);
                wtmTsConfigPerWorklogs[workglog.id] = {
                    projectSettings,
                    artifact: projectSettings.wtmArtifact,
                };
            }
            assert(!nitsField?.id, `Unknown nitsCustomField ${JSON.stringify(nitsField)}.`);

            if (issue.fields.parent) {
                const parent = issuesById[issue.fields.parent.id];
                assert(parent);
                projectSettings = projectSettingsList.find(
                    (p) => p.jiraProjectCode == parent.fields.project.key && p.jiraNitsField && p.jiraNitsField == nitsField?.id
                );
                if (projectSettings) {
                    report.log.push(`Worklog ${workglog.toString()} passed. Artifact ${projectSettings.wtmArtifact} will be used because of issue parent.`);
                    validWorklogs.push(workglog);
                    wtmTsConfigPerWorklogs[workglog.id] = {
                        projectSettings,
                        artifact: projectSettings.wtmArtifact,
                    };
                    continue;
                }
                projectSettings = projectSettingsList.find((p) => p.jiraProjectCode == parent.fields.project.key && !p.jiraNitsField && !nitsField?.id);
                if (projectSettings) {
                    report.log.push(`Worklog ${workglog.toString()} passed. Artifact ${projectSettings.wtmArtifact} will be used because of issue parent.`);
                    validWorklogs.push(workglog);
                    wtmTsConfigPerWorklogs[workglog.id] = {
                        projectSettings,
                        artifact: projectSettings.wtmArtifact,
                    };
                    continue;
                }
            }
            report.log.push(`Worklog ${workglog.toString()} skipped. Neither issue ${issue.key} nor parent has no valid configuration.`);
        }
        return validWorklogs;
    }

    private async getAllNeededIssues(worklogList: Worklog[]): Promise<{ [id: string]: IIssue }> {
        const issues = await this.jiraModel.getIssuesById(worklogList.map((w) => w.issueId));
        const issuesById = arrayUtils.toDictionary<IIssue, IIssue>(issues, (i) => i.id);
        const parents = await this.jiraModel.getIssuesById(issues.filter((i) => i.fields.parent?.id).map((i) => i.fields.parent.id));
        parents.forEach((p) => {
            if (!issuesById[p.id]) {
                issuesById[p.id] = p;
            }
        });
        return issuesById;
    }
}

interface IWtmTsConfig {
    artifact: string;
    projectSettings: IProjectSettings;
}

type IWtmTsConfigPerWorklogId = { [worklogId: string]: IWtmTsConfig };
