import fs from "fs";
import { join } from "path";
import { IUserData } from "../../common/interfaces";
import { Crypt } from "../helpers/crypt";
const fsp = fs.promises;

export class UserDataModel {
    constructor(private storageDir: string, private crypt: Crypt) {
        fs.mkdirSync(this.storageDir, {
            recursive: true,
        });
    }

    public async getUserData(uid: string): Promise<IUserData> {
        const filePath = this.getUserFilePath(uid);
        try {
            await fsp.stat(filePath);
        } catch {
            return null;
        }
        const encryptedContent = await fsp.readFile(filePath, { encoding: "utf8" });
        if (!encryptedContent) {
            console.error(`Crypted content is empty for user ${uid}`);
        }
        const decryptedContent = this.crypt.decrypt(encryptedContent);
        return JSON.parse(decryptedContent);
    }

    public async setUserData(uid: string, userData: IUserData): Promise<void> {
        const filePath = this.getUserFilePath(uid);
        const decryptedContent = JSON.stringify(userData);
        const encryptedContent = this.crypt.encrypt(decryptedContent);
        await fsp.writeFile(filePath, encryptedContent, {
            encoding: "utf8",
        });
    }

    private getUserFilePath(uid: string): string {
        return join(this.storageDir, uid + ".data");
    }
}
