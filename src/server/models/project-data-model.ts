import fs from "fs";
import { join } from "path";
import { IProjectSettings } from "../../common/interfaces";
const fsp = fs.promises;

export class ProjectDataModel {
    constructor(private storageDir: string) {
        fs.mkdirSync(this.storageDir, {
            recursive: true,
        });
    }

    public async getProjectSettings(): Promise<IProjectSettings[]> {
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

    public async setProjectSettings(projectSettings: IProjectSettings[]): Promise<void> {
        const filePath = this.getFilePath();
        const content = JSON.stringify(projectSettings, null, 2);
        await fsp.writeFile(filePath, content, {
            encoding: "utf8",
        });
    }

    private getFilePath(): string {
        return join(this.storageDir, "project-settings.data");
    }
}