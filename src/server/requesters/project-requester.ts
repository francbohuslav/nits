import { Request } from "express";
import { IProjectSettingsResponse } from "../../common/ajax-interfaces";
import { IProjectSettings } from "../../common/interfaces";
import { ProjectController } from "../controllers/project-controller";

export class ProjectRequester {
    constructor(private projectController: ProjectController) {}

    public async getProjectSettings(): Promise<IProjectSettingsResponse> {
        const records = await this.projectController.getProjectSettings();
        const nitsFiledValues = await this.projectController.getNitsFieldValues();
        return {
            records,
            nitsFiledValues,
        } as IProjectSettingsResponse;
    }

    public setProjectSettings(req: Request): Promise<void> {
        const projectSettings = req.body as IProjectSettings[];
        return this.projectController.setProjectSettings(projectSettings);
    }
}
