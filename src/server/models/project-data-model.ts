import fs from "fs";
import { Inject } from "injector";
import { join } from "path";
import { IArtifactSettings } from "../../common/interfaces";
const fsp = fs.promises;

@Inject.Singleton
export class ProjectDataModel {
    constructor(@Inject.Value("projectStorageDir") private storageDir: string) {
        fs.mkdirSync(this.storageDir, {
            recursive: true,
        });
    }

    public async getArtifactSettings(): Promise<IArtifactSettings[]> {
        const filePath = this.getFilePath();
        try {
            await fsp.stat(filePath);
        } catch {
            return [];
        }
        const content = await fsp.readFile(filePath, { encoding: "utf8" });
        if (!content) {
            console.error(`Project settings data are empty`);
            return [];
        }
        return JSON.parse(content);
    }

    public async setArtifactSettings(artifactSettings: IArtifactSettings[]): Promise<void> {
        const filePath = this.getFilePath();
        const content = JSON.stringify(artifactSettings, null, 2);
        await fsp.writeFile(filePath, content, {
            encoding: "utf8",
        });
    }

    private getFilePath(): string {
        return join(this.storageDir, "project-settings.data");
    }
}
