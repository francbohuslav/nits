import { Request } from "express";

export abstract class BaseRequester {
    protected getSession(req: Request): ISession {
        return req.session as any;
    }

    protected getUid(req: Request): string {
        const uid = this.getSession(req).uid;
        if (!uid) {
            throw new Error("UID není nastaveno");
        }
        return uid;
    }
}

export interface ISession {
    uid: string;
}
