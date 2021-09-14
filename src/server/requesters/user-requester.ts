import { Request, Response } from "express";
import { ILoginRequest, ILoginResponse, IUserDataResponse } from "../../common/ajax-interfaces";
import { IUserData } from "../../common/interfaces";
import { UserController } from "../controllers/user-controller";
import { Crypt } from "../helpers/crypt";

export class UserRequester {
    constructor(private userController: UserController, private crypt: Crypt) {}

    public async login(req: Request): Promise<ILoginResponse> {
        const request = req.body as ILoginRequest;
        const response: ILoginResponse = {
            loginToken: null,
        };
        const uid = await this.userController.getUserUid(request.accessCode1, request.accessCode2);
        if (!uid) {
            throw new Error("Wrong credentials");
        }
        response.loginToken = this.crypt.encrypt(uid);
        return response;
    }

    public async getUserData(_req: Request, res: Response): Promise<IUserDataResponse> {
        if (!res.locals?.uid) {
            throw new Error("UID not set");
        }
        const userData = await this.userController.getUserData(res.locals.uid);
        return { ...userData };
    }

    public async setUserData(req: Request, res: Response): Promise<string> {
        const request = req.body as IUserData;
        if (!res.locals?.uid) {
            throw new Error("UID not set");
        }
        await this.userController.setUserData(res.locals.uid, request);
        return "ok";
    }
}
