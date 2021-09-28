import { IProjectSettings } from "../../common/interfaces";
import { JiraApi } from "../apis/jira-api";
import { ProjectDataModel } from "../models/project-data-model";

export class ProjectController {
    constructor(private projectDataModel: ProjectDataModel, private jiraApi: JiraApi) {}

    public getProjectSettings(): Promise<IProjectSettings[]> {
        return this.projectDataModel.getProjectSettings();
    }

    public setProjectSettings(projectSettings: IProjectSettings[]): Promise<void> {
        return this.projectDataModel.setProjectSettings(projectSettings);
    }

    public getNitsFieldValues(): Promise<{ [key: string]: string }> {
        return this.jiraApi.getNitsFiledValues();
    }
}
