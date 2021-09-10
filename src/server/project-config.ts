import fs from "fs";

export interface IProjectConfig {
    cryptoSalt: string;
}
export class ProjectConfigurer {
    public getProjectConfig(path: string): IProjectConfig {
        try {
            const projectConfig: IProjectConfig = JSON.parse(fs.readFileSync(path, { encoding: "utf-8" }));
            if (!projectConfig.cryptoSalt) {
                throw Error("Set cryptoSalt in project-config.json");
            }
            return projectConfig;
        } catch (err) {
            console.error(err);
            process.exit(1);
        }
    }
}
