import { Request } from "express";
import { Inject } from "injector";
import { IProjectSettingsResponse } from "../../common/ajax-interfaces";
import { IProjectSettings } from "../../common/interfaces";
import { ProjectController } from "../controllers/project-controller";

@Inject.Singleton
export class ProjectRequester {
    constructor(private projectController: ProjectController) {}

    public async getProjectSettings(): Promise<IProjectSettingsResponse> {
        const records = await this.projectController.getProjectSettings();
        const nitsFiledValues = await this.projectController.getNitsFieldValues();
        return {
            records,
            projects: await this.projectController.getJiraProjects(),
            nitsFiledValues,
        } as IProjectSettingsResponse;
    }

    public setProjectSettings(req: Request): Promise<void> {
        const projectSettings = req.body as IProjectSettings[];
        return this.projectController.setProjectSettings(projectSettings);
    }
}
