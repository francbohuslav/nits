import { Inject } from "injector";
import arrayUtils from "../../common/array-utils";
import dateUtils from "../../common/date-utils";
import { IProjectSettings } from "../../common/interfaces";
import { JiraApi } from "../apis/jira-api";
import { ProjectDataModel } from "../models/project-data-model";

@Inject.Singleton
export class ProjectController {
    private getNitsFiledValuesLastTime: number = 0;
    private getNitsFiledValuesCache: { [key: string]: string };
    constructor(private projectDataModel: ProjectDataModel, private jiraApi: JiraApi) {}

    public getProjectSettings(): Promise<IProjectSettings[]> {
        return this.projectDataModel.getProjectSettings();
    }

    public setProjectSettings(projectSettings: IProjectSettings[]): Promise<void> {
        return this.projectDataModel.setProjectSettings(projectSettings);
    }

    public async getJiraProjects(): Promise<{ [key: string]: string }> {
        const projects = await this.jiraApi.getProjects();
        return arrayUtils.toDictionary<any, string>(
            projects,
            (r) => r.key,
            (r) => `${r.name} (${r.key})`
        );
    }

    public async getNitsFieldValues(): Promise<{ [key: string]: string }> {
        const now = dateUtils.toTimestamp();
        if (this.getNitsFiledValuesLastTime < now) {
            this.getNitsFiledValuesCache = await this.jiraApi.getNitsFiledValues();
            this.getNitsFiledValuesLastTime = now + 5 * 60;
        }
        return this.getNitsFiledValuesCache;
    }
}
