import { Request, Response } from "express";
import { UserController } from "../controllers/user-controller";
import { ISession } from "../requesters/base-requester";
import os from "os";

const isDevelopment = os.hostname().toLowerCase() == "msi";

export class LoginAuthorizer {
    constructor(private userController: UserController) {}

    public loginAuthorize = (req: Request, res: Response, next: () => void) => {
        const session: ISession = req.session as any;
        if (isDevelopment) {
            session.uid = "12-8835-1";
        }
        if (!session.uid) {
            return res.status(401).json({
                status: 401,
                message: "UNAUTHORIZED",
            });
        }
        next();
    };

    public adminAuthorize = (req: Request, res: Response, next: () => void) => {
        const session: ISession = req.session as any;
        if (isDevelopment) {
            session.uid = "12-8835-1";
        }
        if (!session.uid || !this.userController.isAdmin(session.uid)) {
            return res.status(401).json({
                status: 401,
                message: "UNAUTHORIZED",
            });
        }
        next();
    };
}
