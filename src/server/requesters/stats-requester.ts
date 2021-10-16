import { Request } from "express";
import { IStats, IUserStats } from "../../common/interfaces";
import { StatsController } from "../controllers/stats-controller";
import { BaseRequester } from "./base-requester";

export class StatsRequester extends BaseRequester {
    constructor(private statsController: StatsController) {
        super();
    }

    public async getAdminStats(req: Request): Promise<IStats[]> {
        const uid = this.getUid(req);
        return this.statsController.getAdminStats(uid, req.query.month as string);
    }

    public async getUserStats(req: Request): Promise<IUserStats> {
        const uid = this.getUid(req);

        return this.statsController.getUserStats(uid);
    }
}
