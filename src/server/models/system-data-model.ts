import fs from "fs";
import { Inject } from "injector";
import { join } from "path";
import { ISystemConfig } from "../../common/interfaces";
const fsp = fs.promises;

@Inject.Singleton
export class SystemDataModel {
    constructor(@Inject.Value("projectStorageDir") private storageDir: string) {
        fs.mkdirSync(this.storageDir, {
            recursive: true,
        });
    }

    public async getSystemConfig(): Promise<ISystemConfig> {
        const filePath = this.getFilePath();
        const defaultSystemConfig: ISystemConfig = {
            adminUids: ["12-8835-1", "1017-1", "7062-822-1"],
            syncDaysCount: 1,
        };
        try {
            await fsp.stat(filePath);
        } catch {
            return defaultSystemConfig;
        }
        const content = await fsp.readFile(filePath, { encoding: "utf8" });
        if (!content) {
            return defaultSystemConfig;
        }
        const json: ISystemConfig = JSON.parse(content);
        return json;
    }

    public async setSystemConfig(systemConfig: ISystemConfig): Promise<void> {
        const filePath = this.getFilePath();
        const content = JSON.stringify(systemConfig, null, 2);
        await fsp.writeFile(filePath, content, {
            encoding: "utf8",
        });
    }

    private getFilePath(): string {
        return join(this.storageDir, "system-settings.data");
    }
}
