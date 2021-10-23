import { Inject } from "injector";
import nodemailer from "nodemailer";
import { IProjectConfig } from "../project-config";

@Inject.Singleton
export class NotifyController {
    constructor(@Inject.Value("projectConfig") private projectConfig: IProjectConfig) {}

    public async testEmail(email: string): Promise<void> {
        if (!this.projectConfig.email.user || !this.projectConfig.email.password) {
            throw new Error("E-mailing is not active. Credentials must be set.");
        }
        return new Promise((resolve) => {
            console.log(`Sending to ${email}`);
            const transporter = nodemailer.createTransport({
                service: "gmail",
                auth: {
                    user: this.projectConfig.email.user,
                    pass: this.projectConfig.email.password,
                },
            });
            const mailOptions = {
                from: this.projectConfig.email.sender || this.projectConfig.email.user,
                to: email,
                subject: "NITS: testovací zpráva",
                text: "Toto je testovací zpráva z NITS. Zdá se, že vše funguje.",
            };

            transporter.sendMail(mailOptions, function (error: any, info: any) {
                resolve(error || info.response);
            });
        });
    }
}
