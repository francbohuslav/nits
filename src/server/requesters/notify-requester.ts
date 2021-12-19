import { Request, Response } from "express";
import { Inject } from "injector";
import { NotifyController } from "../controllers/notify-controller";
import { UserController } from "../controllers/user-controller";
import { BaseRequester } from "./base-requester";

@Inject.Singleton
export class NotifyRequester extends BaseRequester {
    constructor(private userController: UserController, private notifyController: NotifyController) {
        super();
    }

    public monthNotification(_req: Request, res: Response): Promise<string[]> {
        res.setTimeout(10 * 60 * 1000);
        res.setHeader("Content-Type", "application/json");
        return this.notifyController.monthNotification();
    }

    public async setNotificationEmail(req: Request): Promise<void> {
        const uid = this.getUid(req);
        await this.userController.setNotificationEmail(uid, req.body.email);
    }

    public async sendTestEmail(req: Request): Promise<void> {
        await this.notifyController.sendTestEmail(req.body.email as string);
    }
}
