import { Request } from "express";
import { ILoginRequest, ILoginResponse } from "../../common/ajax-interfaces";
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
        if (uid) {
            response.loginToken = this.crypt.encrypt(uid);
        } else {
            response.message = "Wrong credentials";
        }
        return response;
    }
}
