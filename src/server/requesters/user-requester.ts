import { Request } from "express";
import { ILoginRequest } from "../../common/ajax-interfaces";
import { IUserData } from "../../common/interfaces";
import { UserController } from "../controllers/user-controller";
import { BaseRequester } from "./base-requester";

export class UserRequester extends BaseRequester {
    constructor(private userController: UserController) {
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

    public async getUserData(req: Request): Promise<IUserData> {
        const uid = this.getSession(req).uid;
        if (!uid) {
            throw new Error("UID není nastaveno");
        }
        const userData = await this.userController.getUserData(uid);
        return userData;
    }

    public async setUserData(req: Request): Promise<boolean> {
        const uid = this.getSession(req).uid;
        const request = req.body as IUserData;
        if (!uid) {
            throw new Error("UID není nastaveno");
        }
        return await this.userController.setUserData(uid, request);
    }
}
