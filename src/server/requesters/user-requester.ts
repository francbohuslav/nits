import { Request } from "express";
import { Inject } from "injector";
import { IAllUsersResponse, ILoginRequest, IUserSetStateRequest } from "../../common/ajax-interfaces";
import { assert } from "../../common/core";
import dateUtils from "../../common/date-utils";
import { IUserPublicData } from "../../common/interfaces";
import { UserController } from "../controllers/user-controller";
import { Crypt } from "../helpers/crypt";
import { BaseRequester } from "./base-requester";

@Inject.Singleton
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
        return this.userController.convertToPublicData(userData);
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

    public async getAllUsers(): Promise<IAllUsersResponse> {
        const users = await this.userController.getAllUsers();
        const result = {
            users: users.map((u) => this.userController.convertToPublicData(u)),
        };
        return result;
    }

    public async setUserState(req: Request): Promise<IAllUsersResponse> {
        const request: IUserSetStateRequest = req.body;
        assert(request.uid);
        assert(request.state);
        const userData = await this.userController.getUserData(request.uid);
        userData.state = request.state;
        await this.userController.setUserData(request.uid, userData);
        return await this.getAllUsers();
    }
}
