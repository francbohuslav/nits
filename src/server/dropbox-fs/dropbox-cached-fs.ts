import { DropboxClient } from "./dropbox-client";
import fs from "fs";
import path from "path";
const fsp = fs.promises;

export class DropboxCachedFs {
    private client: DropboxClient;

    constructor(dropboxClientToken: string, private remoteDir: string, private localDir: string) {
        this.client = new DropboxClient();
        this.client.connect(dropboxClientToken);
        fs.mkdirSync(localDir, { recursive: true });
    }

    public async readFile(filePath: string): Promise<string> {
        const localFilePath = path.join(this.localDir, filePath);
        const remoteFilePath = path.join(this.remoteDir, filePath);
        if (!fs.existsSync(localFilePath)) {
            await this.client.downloadFile(remoteFilePath, localFilePath);
        }
        return fsp.readFile(localFilePath, { encoding: "utf-8" });
    }
}
