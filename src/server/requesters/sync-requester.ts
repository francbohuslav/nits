import { Request } from "express";
import { SyncController } from "../controllers/sync-controller";

export class SyncRequester {
    constructor(private syncController: SyncController) {}

    public sync(_req: Request): Promise<void> {
        return this.syncController.sync();
    }
}
