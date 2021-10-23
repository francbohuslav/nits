import crypto from "crypto";
import { Inject } from "injector";
import { IProjectConfig } from "../project-config";

@Inject.Singleton
export class Crypt {
    private algorithm = "aes-192-cbc";
    private iv = Buffer.from("gdfgsd1gsfd1fgda"); // do not change

    constructor(@Inject.Value("projectConfig") private projectConfig: IProjectConfig) {}

    public encrypt(text: string, password: string = "unused"): string {
        const cipher = crypto.createCipheriv(this.algorithm, this.getKey(password), this.iv);
        return cipher.update(text, "utf8", "hex") + cipher.final("hex");
    }

    public decrypt(encrypted: string, password: string = "unused"): string {
        const decipher = crypto.createDecipheriv(this.algorithm, this.getKey(password), this.iv);
        return decipher.update(encrypted, "hex", "utf8") + decipher.final("utf8");
    }

    private getKey(password: string) {
        return crypto.scryptSync(password, this.projectConfig.cryptoSalt, 24);
    }
}
