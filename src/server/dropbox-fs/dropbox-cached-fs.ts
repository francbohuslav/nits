import fs from "fs";
import path from "path";
import { DropboxClient } from "./dropbox-client";
const fsp = fs.promises;

export class DropboxCachedFs {
    private client: DropboxClient;
    private cache: { [directory: string]: string[] } = {};

    constructor(dropboxClientToken: string, private remoteDir: string, private localDir: string) {
        if (dropboxClientToken) {
            this.client = new DropboxClient();
            this.client.connect(dropboxClientToken);
        } else {
            console.log("Dropobx token not specified, only local filesystem is used");
        }
        fs.mkdirSync(localDir, { recursive: true });
    }

    public async readFile(filePath: string): Promise<string> {
        const localFilePath = path.join(this.localDir, filePath);
        fs.mkdirSync(path.dirname(localFilePath), { recursive: true });
        const remoteFilePath = path.join(this.remoteDir, filePath);
        if (this.client && !fs.existsSync(localFilePath)) {
            await this.client.downloadFile(remoteFilePath, localFilePath);
        }
        return fsp.readFile(localFilePath, { encoding: "utf-8" });
    }

    public async writeFile(filePath: string, content: string): Promise<void> {
        const localFilePath = path.join(this.localDir, filePath);
        fs.mkdirSync(path.dirname(localFilePath), { recursive: true });
        await fsp.writeFile(localFilePath, content, { encoding: "utf-8" });
        if (this.client) {
            const remoteFilePath = path.join(this.remoteDir, filePath);
            await this.client.uploadFile(localFilePath, remoteFilePath);
            const remotedir = path.dirname(filePath);
            console.log(`Invalidate cache ${remotedir}`);
            delete this.cache[remotedir];
        }
    }

    public async readdir(dir: string): Promise<string[]> {
        if (this.client) {
            const remoteFilePath = path.join(this.remoteDir, dir);
            if (this.cache[remoteFilePath]) {
                console.log(`From cache ${remoteFilePath}`);
                return this.cache[remoteFilePath];
            }
            try {
                const files = await this.client.listFiles(remoteFilePath);
                this.cache[remoteFilePath] = files;
                return files;
            } catch (err) {
                if ((err.error_summary + "").startsWith("path/not_found")) {
                    this.cache[remoteFilePath] = [];
                    return [];
                }
                throw err;
            }
        } else {
            const localFilePath = path.join(this.localDir, dir);
            return await fsp.readdir(localFilePath);
        }
    }

    public async fileExists(filePath: string): Promise<boolean> {
        const localFilePath = path.join(this.localDir, filePath);
        if (fs.existsSync(localFilePath)) {
            return true;
        }
        const files = await this.readdir(path.dirname(filePath));
        return files.includes(path.basename(filePath));
    }
}
