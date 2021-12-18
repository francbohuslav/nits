import { CachedFs } from "dropbox-fs";
import { Inject } from "injector";
import { join } from "path";
import { ISystemConfig } from "../../common/interfaces";

@Inject.Singleton
export class SystemDataModel {
    constructor(@Inject.Value("projectStorageDir") private storageDir: string, private dropboxCachedFs: CachedFs) {}

    public async getSystemConfig(): Promise<ISystemConfig> {
        const filePath = this.getFilePath();
        const defaultSystemConfig: ISystemConfig = {
            adminUids: ["12-8835-1", "1017-1", "7062-822-1"],
            syncDaysCount: 1,
            syncHour: 5,
        };
        if (!(await this.dropboxCachedFs.fileExists(filePath))) {
            return defaultSystemConfig;
        }
        const content = await this.dropboxCachedFs.readFile(filePath);
        if (!content) {
            return defaultSystemConfig;
        }
        const json: ISystemConfig = JSON.parse(content);
        return json;
    }

    public async setSystemConfig(systemConfig: ISystemConfig): Promise<void> {
        const filePath = this.getFilePath();
        const content = JSON.stringify(systemConfig, null, 2);
        await this.dropboxCachedFs.writeFile(filePath, content);
    }

    private getFilePath(): string {
        return join(this.storageDir, "system-settings.data");
    }
}
