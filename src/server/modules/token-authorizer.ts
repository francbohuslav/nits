import { Request, Response } from "express";
import { Crypt } from "./crypt";

export class TokenAuthorizer {
    constructor(private crypt: Crypt) {}

    public tokenAuthorize = (req: Request, res: Response, next: () => void) => {
        let loginToken = req.headers.logintoken as string;
        if (req.query && req.query.loginToken) {
            loginToken = req.query.loginToken as string;
        }
        try {
            if (!loginToken) {
                throw new Error("Empty login token");
            }
            const uid = this.crypt.decrypt(loginToken);
            if (!uid.match(/^[0-9-]+$/)) {
                console.log(uid);
                throw new Error("Login token does not contains valid uid");
            }
            res.locals.uid = uid;
            next();
        } catch (err) {
            console.error(err);
            return res.status(401).json({
                status: 401,
                message: "UNAUTHORIZED",
            });
        }
    };
}
