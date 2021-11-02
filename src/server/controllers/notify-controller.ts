import { Inject } from "injector";
import nodemailer from "nodemailer";
import { IProjectConfig } from "../project-config";
import { UserController } from "./user-controller";

@Inject.Singleton
export class NotifyController {
    constructor(private userController: UserController, @Inject.Value("projectConfig") private projectConfig: IProjectConfig) {}

    public async testEmail(email: string): Promise<void> {
        await this.sendEmail(email, "NITS: testovací zpráva", "Toto je testovací zpráva z NITS. Zdá se, že vše funguje.");
    }

    public async syncError(): Promise<void> {
        const admins = await this.userController.getAdmins();
        for (const adminUid of admins) {
            const userData = await this.userController.getUserData(adminUid);
            if (userData.notificationEmail) {
                await this.sendEmail(
                    userData.notificationEmail,
                    "NITS: chyba synchronizace",
                    "Došlo k chybě synchronizace. Více info na stránce " + this.projectConfig.serverAddress + "/page/users/."
                );
            }
        }
    }

    private async sendEmail(email: string, subject: string, text: string): Promise<void> {
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
                subject,
                text,
            };

            transporter.sendMail(mailOptions, function (error: any, info: any) {
                resolve(error || info.response);
            });
        });
    }
}
