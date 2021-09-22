import { Request, Response } from "express";
import { ISession } from "../requesters/base-requester";

export class LoginAuthorizer {
    constructor() {}

    public loginAuthorize = (req: Request, res: Response, next: () => void) => {
        const session: ISession = req.session as any;
        if (!session.uid) {
            return res.status(401).json({
                status: 401,
                message: "UNAUTHORIZED",
            });
        }
        next();
    };
}
