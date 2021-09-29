import dateUtils from "../../common/date-utils";
import { IProjectSettings } from "../../common/interfaces";
import { JiraApi } from "../apis/jira-api";
import { ProjectDataModel } from "../models/project-data-model";

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

    public getJiraProjects(): Promise<{ [key: string]: string }> {
        return this.jiraApi.getProjects();
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
