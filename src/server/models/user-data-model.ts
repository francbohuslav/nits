import fs from "fs";
import { join } from "path";
import { IUserData } from "../../common/interfaces";
import { Crypt } from "../helpers/crypt";
import { IProjectConfig } from "../project-config";
const fsp = fs.promises;

export class UserDataModel {
    constructor(private storageDir: string, private crypt: Crypt, private projectConfig: IProjectConfig) {
        fs.mkdirSync(this.storageDir, {
            recursive: true,
        });
    }

    public async getUserData(uid: string): Promise<IUserData> {
        const emptyUserData: IUserData = {
            uid,
            name: "",
            uuAccessCode1: "",
            uuAccessCode2: "",
            jiraAccountId: "",
            jiraName: "",
            notificationEmail: "",
        };
        const filePath = this.getUserFilePath(uid);
        try {
            await fsp.stat(filePath);
        } catch {
            return emptyUserData;
        }
        const encryptedContent = await fsp.readFile(filePath, { encoding: "utf8" });
        if (!encryptedContent) {
            console.error(`Crypted content is empty for user ${uid}`);
            return emptyUserData;
        }
        const decryptedContent = this.projectConfig.userDataEncrypted ? this.crypt.decrypt(encryptedContent) : encryptedContent;
        return JSON.parse(decryptedContent);
    }

    public async setUserData(uid: string, userData: IUserData): Promise<void> {
        const filePath = this.getUserFilePath(uid);
        const decryptedContent = JSON.stringify(userData, null, 2);
        const encryptedContent = this.projectConfig.userDataEncrypted ? this.crypt.encrypt(decryptedContent) : decryptedContent;
        await fsp.writeFile(filePath, encryptedContent, {
            encoding: "utf8",
        });
    }

    public async getAllValidUserData(): Promise<IUserData[]> {
        const fileList = await fsp.readdir(this.storageDir);
        const userUidList = fileList.filter((f) => f.match(/^[\d-]+\.data$/)).map((f) => f.match(/^([\d-]+)\.data$/)[1]);
        const userDataList: IUserData[] = [];
        for (const uid of userUidList) {
            const userData = await this.getUserData(uid);
            if (userData.jiraAccountId) {
                userDataList.push(userData);
            }
        }
        return userDataList;
    }

    private getUserFilePath(uid: string): string {
        return join(this.storageDir, uid + ".data");
    }
}
