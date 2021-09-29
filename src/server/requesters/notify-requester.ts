import { Request } from "express";
import { UserController } from "../controllers/user-controller";
import { BaseRequester } from "./base-requester";

export class NotifyRequester extends BaseRequester {
    constructor(private userController: UserController) {
        super();
    }

    public async setNotificationEmail(req: Request): Promise<void> {
        const uid = this.getUid(req);
        await this.userController.setNotificationEmail(uid, req.body.email);
    }
}
