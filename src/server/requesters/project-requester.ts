import { Request } from "express";
import { Inject } from "injector";
import { IArtifactSettingsResponse } from "../../common/ajax-interfaces";
import { IArtifactSettings, ISystemConfig } from "../../common/interfaces";
import { ProjectController } from "../controllers/project-controller";

@Inject.Singleton
export class ProjectRequester {
    constructor(private projectController: ProjectController) {}

    public async getArtifactSettings(): Promise<IArtifactSettingsResponse> {
        const records = await this.projectController.getArtifactSettings();
        const nitsFieldValues = await this.projectController.getNitsFieldValues();
        return {
            records,
            projects: await this.projectController.getJiraProjects(),
            nitsFieldValues,
        } as IArtifactSettingsResponse;
    }

    public setArtifactSettings(req: Request): Promise<void> {
        const artifactSettings = req.body as IArtifactSettings[];
        return this.projectController.setArtifactSettings(artifactSettings);
    }

    public getSystemConfig(): Promise<ISystemConfig> {
        return this.projectController.getSystemConfig();
    }

    public setSystemConfig(req: Request): Promise<void> {
        return this.projectController.setSystemConfig(req.body as ISystemConfig);
    }
}
