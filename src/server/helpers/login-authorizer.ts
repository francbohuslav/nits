import { Request, Response } from "express";
import { Inject } from "injector";
import { UserController } from "../controllers/user-controller";
import { ISession } from "../requesters/base-requester";

@Inject.Singleton
export class LoginAuthorizer {
    constructor(private userController: UserController) {}

    public loginAuthorize = (req: Request, res: Response, next: () => void) => {
        const session: ISession = req.session as any;
        if (process.env.NITS_DEVEL_ACCOUNT) {
            session.uid = process.env.NITS_DEVEL_ACCOUNT;
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
        if (process.env.NITS_DEVEL_ACCOUNT) {
            session.uid = process.env.NITS_DEVEL_ACCOUNT;
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
