import { Inject } from "injector";
import arrayUtils from "../../common/array-utils";
import dateUtils from "../../common/date-utils";
import { IArtifactSettings, ISystemConfig } from "../../common/interfaces";
import { JiraApi } from "../apis/jira-api";
import { ProjectDataModel } from "../models/project-data-model";
import { SystemDataModel } from "../models/system-data-model";

@Inject.Singleton
export class ProjectController {
    private getNitsFiledValuesLastTime: number = 0;
    private getNitsFiledValuesCache: { [key: string]: string };
    constructor(private projectDataModel: ProjectDataModel, private jiraApi: JiraApi, private systemDataModel: SystemDataModel) {}

    public getArtifactSettings(): Promise<IArtifactSettings[]> {
        return this.projectDataModel.getArtifactSettings();
    }

    public setArtifactSettings(artifactSettings: IArtifactSettings[]): Promise<void> {
        return this.projectDataModel.setArtifactSettings(artifactSettings);
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

    public getSystemConfig(): Promise<ISystemConfig> {
        return this.systemDataModel.getSystemConfig();
    }

    public setSystemConfig(artifactSettings: ISystemConfig): Promise<void> {
        return this.systemDataModel.setSystemConfig(artifactSettings);
    }
}
