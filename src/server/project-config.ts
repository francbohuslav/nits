import fs from "fs";
import { Crypt } from "./modules/crypt";

export interface IProjectConfig {
    cryptoSalt: string;
    serviceAccessCode1: string;
    serviceAccessCode2: string;
    serviceAccessCodesAreCrypted: boolean;
    enabledUsers: { [uid: string]: string };
}
//TODO: BF: clean/verify
export class ProjectConfigurer {
    public getProjectConfig(path: string): IProjectConfig {
        try {
            const projectConfig: IProjectConfig = JSON.parse(fs.readFileSync(path, { encoding: "utf-8" }));
            projectConfig.enabledUsers = projectConfig.enabledUsers || {};
            if (!projectConfig.cryptoSalt) {
                throw Error("Set cryptoSalt in project-config.json");
            }
            if (!projectConfig.serviceAccessCode1) {
                throw Error("Set serviceAccessCode1 and serviceAccessCode2 in project-config.json");
            }
            const crypt = new Crypt(projectConfig.cryptoSalt);
            if (!projectConfig.serviceAccessCodesAreCrypted) {
                console.log("serviceAccessCode1:", crypt.encrypt(projectConfig.serviceAccessCode1));
                console.log("serviceAccessCode2:", crypt.encrypt(projectConfig.serviceAccessCode2));
                throw Error("Modify serviceAccessCode1 and serviceAccessCode2 in project-config.json to text above and set serviceAccessCodesAreCrypted: true");
            } else {
                projectConfig.serviceAccessCode1 = crypt.decrypt(projectConfig.serviceAccessCode1);
                projectConfig.serviceAccessCode2 = crypt.decrypt(projectConfig.serviceAccessCode2);
            }
            return projectConfig;
        } catch (err) {
            console.error(err.message);
            process.exit(1);
        }
    }
}
