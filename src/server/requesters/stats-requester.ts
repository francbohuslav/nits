import { Request } from "express";
import { IStats } from "../../common/interfaces";
import { StatsController } from "../controllers/stats-controller";
import { BaseRequester } from "./base-requester";

export class StatsRequester extends BaseRequester {
    constructor(private statsController: StatsController) {
        super();
    }

    public async getStats(req: Request): Promise<IStats[]> {
        const uid = this.getUid(req);
        return this.statsController.getStats(uid);
    }
}
