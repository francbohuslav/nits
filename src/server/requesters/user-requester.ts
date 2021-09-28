import { Request } from "express";
import { ILoginRequest, IUserPublicData } from "../../common/ajax-interfaces";
import dateUtils from "../../common/date-utils";
import { UserController } from "../controllers/user-controller";
import { Crypt } from "../helpers/crypt";
import { BaseRequester } from "./base-requester";

export class UserRequester extends BaseRequester {
    constructor(private userController: UserController, private crypt: Crypt) {
        super();
    }

    public async login(req: Request): Promise<boolean> {
        const request = req.body as ILoginRequest;
        const uid = await this.userController.login(request.accessCode1, request.accessCode2);
        if (!uid) {
            throw new Error("Nesprávné přihlašovací údaje");
        }
        this.getSession(req).uid = uid;
        return true;
    }

    public async logout(req: Request): Promise<boolean> {
        this.getSession(req).uid = null;
        return true;
    }

    public async getUserPublicData(req: Request): Promise<IUserPublicData> {
        const uid = this.getUid(req);
        const userData = await this.userController.getUserData(uid);
        return {
            jiraAccountId: userData.jiraAccountId,
            jiraName: userData.jiraName,
            name: userData.name,
            uid: userData.uid,
            isAdmin: this.userController.isAdmin(uid),
        };
    }

    public async logoutJira(req: Request): Promise<void> {
        const uid = this.getUid(req);
        const userData = await this.userController.getUserData(uid);
        userData.jiraAccountId = null;
        await this.userController.setUserData(uid, userData);
    }

    public async getUserSession(req: Request): Promise<string> {
        const uid = this.getUid(req);
        const pattern = uid + "|" + dateUtils.toIsoFormat();
        return this.crypt.encrypt(pattern);
    }
}
