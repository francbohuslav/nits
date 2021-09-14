import { IUserData } from "../server/controllers/user-controller";

interface IBaseResponse {
    result?: null | "error";
    message?: string;
    stack?: string;
}

export interface ILoginRequest {
    accessCode1: string;
    accessCode2: string;
}

export interface ILoginResponse extends IBaseResponse {
    loginToken: string;
}

export interface IUserDataResponse extends IBaseResponse, IUserData {}
