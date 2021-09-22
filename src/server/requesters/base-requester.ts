import { Request } from "express";

export abstract class BaseRequester {
    public getSession(req: Request): ISession {
        return req.session as any;
    }
}

export interface ISession {
    uid: string;
}
