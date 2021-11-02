import { Inject } from "injector";
import { join } from "path";
import { IArtifactSettings } from "../../common/interfaces";
import { DropboxCachedFs } from "../dropbox-fs/dropbox-cached-fs";

@Inject.Singleton
export class ProjectDataModel {
    constructor(@Inject.Value("projectStorageDir") private storageDir: string, private dropboxCachedFs: DropboxCachedFs) {}

    public async getArtifactSettings(): Promise<IArtifactSettings[]> {
        const filePath = this.getFilePath();
        if (!(await this.dropboxCachedFs.fileExists(filePath))) {
            return [];
        }
        const content = await this.dropboxCachedFs.readFile(filePath);
        if (!content) {
            console.error(`Project settings data are empty`);
            return [];
        }
        return JSON.parse(content);
    }

    public async setArtifactSettings(artifactSettings: IArtifactSettings[]): Promise<void> {
        const filePath = this.getFilePath();
        const content = JSON.stringify(artifactSettings, null, 2);
        await this.dropboxCachedFs.writeFile(filePath, content);
    }

    private getFilePath(): string {
        return join(this.storageDir, "project-settings.data");
    }
}
