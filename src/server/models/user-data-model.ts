import fs from "fs";
import { Inject } from "injector";
import { join } from "path";
import { IUserData } from "../../common/interfaces";
import { DropboxCachedFs } from "../dropbox-fs/dropbox-cached-fs";
import { Crypt } from "../helpers/crypt";
import { IProjectConfig } from "../project-config";
const fsp = fs.promises;

@Inject.Singleton
export class UserDataModel {
    constructor(
        @Inject.Value("userStorageDir") private storageDir: string,
        private dropboxFs: DropboxCachedFs,
        private crypt: Crypt,
        @Inject.Value("projectConfig") private projectConfig: IProjectConfig
    ) {
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
            jiraAccountId: null,
            jiraName: null,
            notificationEmail: "",
            lastSynchronization: "",
            state: "disabled",
            lastError: null,
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
        const userData: IUserData = JSON.parse(decryptedContent);
        this.normalizeUserData(userData);
        return userData;
    }

    public async setUserData(uid: string, userData: IUserData): Promise<void> {
        const filePath = this.getUserFilePath(uid);
        const decryptedContent = JSON.stringify(userData, null, 2);
        const encryptedContent = this.projectConfig.userDataEncrypted ? this.crypt.encrypt(decryptedContent) : decryptedContent;
        await fsp.writeFile(filePath, encryptedContent, {
            encoding: "utf8",
        });
    }

    public async getAllUserData(): Promise<IUserData[]> {
        const fileList = await fsp.readdir(this.storageDir);
        const userUidList = fileList.filter((f) => f.match(/^[\d-]+\.data$/)).map((f) => f.match(/^([\d-]+)\.data$/)[1]);
        const userDataList: IUserData[] = [];
        for (const uid of userUidList) {
            const userData = await this.getUserData(uid);
            this.normalizeUserData(userData);
            userDataList.push(userData);
        }
        return userDataList;
    }

    public async getAllValidUserData(): Promise<IUserData[]> {
        return (await this.getAllUserData()).filter((u) => u.jiraAccountId);
    }

    private getUserFilePath(uid: string): string {
        return join(this.storageDir, uid + ".data");
    }

    private normalizeUserData(userData: IUserData) {
        userData.state = userData.state || "disabled";
        userData.jiraName = userData.jiraAccountId ? userData.jiraName : null;
    }
}
