import { Request, Response } from "express";
import { SyncController } from "../controllers/sync-controller";
import { ISyncReport } from "../models/interfaces";

export class SyncRequester {
    constructor(private syncController: SyncController) {}

    public sync(_req: Request, res: Response): Promise<ISyncReport[]> {
        res.setHeader("Content-Type", "application/json");
        return this.syncController.sync();
    }
}
