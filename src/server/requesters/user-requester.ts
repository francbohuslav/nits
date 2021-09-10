import { Request } from "express";
import { ILoginRequest, ILoginResponse } from "../../common/ajax-interfaces";
import { Crypt } from "../modules/crypt";
import { Authentication } from "../modules/uu/authentication";

export class UserRequester {
    constructor(private auth: Authentication, private crypt: Crypt) {}

    public async login(req: Request): Promise<ILoginResponse> {
        const request = req.body as ILoginRequest;
        const response: ILoginResponse = {
            loginToken: null,
        };
        const uid = await this.auth.getUserUid(request.accessCode1, request.accessCode2);
        if (uid) {
            response.loginToken = this.crypt.encrypt(uid);
        } else {
            response.message = "Wrong credentials";
        }
        return response;
    }
}
