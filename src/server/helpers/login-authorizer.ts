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

    public adminAuthorize = async (req: Request, res: Response, next: () => void) => {
        const session: ISession = req.session as any;
        if (process.env.NITS_DEVEL_ACCOUNT) {
            session.uid = process.env.NITS_DEVEL_ACCOUNT;
        }
        const admins = session.uid ? await this.userController.getAdmins() : [];
        if (!session.uid || !admins.includes(session.uid)) {
            return res.status(401).json({
                status: 401,
                message: "UNAUTHORIZED",
            });
        }
        next();
    };
}
