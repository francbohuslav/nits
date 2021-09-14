import crypto from "crypto";

export class Crypt {
    private algorithm = "aes-192-cbc";
    private iv = Buffer.from("gdfgsd1gsfd1fgda"); // do not change

    constructor(private salt: string) {}

    public encrypt(text: string, password: string = "unused"): string {
        const cipher = crypto.createCipheriv(this.algorithm, this.getKey(password), this.iv);
        return cipher.update(text, "utf8", "hex") + cipher.final("hex");
    }

    public decrypt(encrypted: string, password: string = "unused"): string {
        const decipher = crypto.createDecipheriv(this.algorithm, this.getKey(password), this.iv);
        return decipher.update(encrypted, "hex", "utf8") + decipher.final("utf8");
    }

    private getKey(password: string) {
        return crypto.scryptSync(password, this.salt, 24);
    }
}
