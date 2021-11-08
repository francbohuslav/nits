import { Request, Response } from "express";
import { Inject } from "injector";
import { SyncController } from "../controllers/sync-controller";
import { ISyncReport } from "../models/interfaces";

@Inject.Singleton
export class SyncRequester {
    constructor(private syncController: SyncController) {}

    public sync(_req: Request, res: Response): Promise<ISyncReport> {
        res.setTimeout(10 * 60 * 1000);
        res.setHeader("Content-Type", "application/json");
        return this.syncController.sync();
    }
}
