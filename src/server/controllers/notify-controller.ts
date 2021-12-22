import { Inject } from "injector";
import nodemailer from "nodemailer";
import dateUtils from "../../common/date-utils";
import { ISystemConfig } from "../../common/interfaces";
import { SystemDataModel } from "../models/system-data-model";
import { UserDataModel } from "../models/user-data-model";
import { IProjectConfig } from "../project-config";
import { StatsController } from "./stats-controller";
import { UserController } from "./user-controller";

@Inject.Singleton
export class NotifyController {
    constructor(
        private userController: UserController,
        private systemDataModel: SystemDataModel,
        private statsController: StatsController,
        private userDataModel: UserDataModel,
        @Inject.Value("projectConfig") private projectConfig: IProjectConfig
    ) {}

    public async sendTestEmail(email: string): Promise<void> {
        await this.sendEmail(email, "testovací zpráva", "Toto je testovací zpráva z NITS. Zdá se, že vše funguje.");
    }

    public async monthNotification(): Promise<string[]> {
        const systemConfig = await this.systemDataModel.getSystemConfig();
        if (!systemConfig.statsUserUid) {
            return ["User for stats is not set. Notifications are skipped."];
        }
        const users = await this.userDataModel.getAllUserData();
        const actualMonth = dateUtils.getStartOfMonth();
        const actualMonthStr = dateUtils.toIsoFormat(actualMonth);
        const report = [];
        const stats = await this.statsController.getAdminStats(systemConfig.statsUserUid, dateUtils.toIsoFormat(actualMonth));
        for (const stat of stats) {
            const user = users.find((u) => u.uid == stat.uid);
            if (!user) {
                report.push(`User ${stat.uid} ${stat.name} can not be found in valid users. Skipped.`);
                continue;
            }
            const userData = await this.userDataModel.getUserData(stat.uid);
            userData.notitificationStatuses = userData.notitificationStatuses || {};
            const notifyStat = userData.notitificationStatuses;
            let ms = notifyStat[actualMonthStr];
            if (ms && ms.time && !ms.error && ms.emailIsSet) {
                report.push(`User ${stat.uid} ${stat.name} has been sent in some previous run. Skipped.`);
                continue;
            }
            notifyStat[actualMonthStr] = {
                time: new Date(),
                emailIsSet: false,
                error: null,
                stack: null,
            };
            ms = notifyStat[actualMonthStr];
            if (!user.notificationEmail) {
                report.push(`User ${stat.uid} ${stat.name} has not filled notification e-mail address.`);
            } else {
                ms.emailIsSet = true;
                report.push(`Sending to ${stat.uid} ${stat.name}.`);
                try {
                    await this.sendMonthUserEmail(user.notificationEmail, systemConfig, stat.wtmHours);
                } catch (ex) {
                    const error = ex as Error;
                    ms.error = error.message;
                    ms.stack = error.stack;
                }
            }
            await this.userDataModel.setUserData(userData.uid, userData);
            console.log(ms);
        }
        return report;
    }

    public async syncError(): Promise<void> {
        const admins = await this.userController.getAdmins();
        for (const adminUid of admins) {
            const userData = await this.userController.getUserData(adminUid);
            if (userData.notificationEmail) {
                await this.sendEmail(
                    userData.notificationEmail,
                    "chyba synchronizace",
                    "Došlo k chybě synchronizace. Více info na stránce " + this.projectConfig.serverAddress + "/page/users/."
                );
            }
        }
    }

    private async sendMonthUserEmail(email: string, systemConfig: ISystemConfig, wtmHours: number): Promise<void> {
        const today = new Date();
        await this.sendEmail(
            email,
            `výkazy za ${today.getMonth() + 1}/${today.getFullYear()}`,
            "Ahoj,\n" +
                "\n" +
                "je poslední den v měsíci a chceme Ti připomenout, že je dnes potřeba mít nejpozději do 22:00 vykázané všechny odpracované hodiny za tento měsíc. \n" +
                "\n" +
                "Pro info - ke včerejšímu dni k " +
                systemConfig.syncHour +
                ":00 bylo do WTM přeneseno " +
                dateUtils.formatHours(wtmHours) +
                " Tvých vykázaných hodin.\n" +
                "\n" +
                "Děkujeme Ti za spolupráci,\n" +
                "\n" +
                "NITS tým"
        );
    }

    private async sendEmail(email: string, subject: string, text: string): Promise<void> {
        if (!this.projectConfig.email.user || !this.projectConfig.email.password) {
            throw new Error("E-mailing is not active. Credentials must be set.");
        }
        subject = `NITS - ${subject}`;
        return new Promise((resolve, reject) => {
            console.log(`Sending ${subject} to ${email}`);
            const transporter = nodemailer.createTransport({
                // service: "gmail",
                host: this.projectConfig.email.host,
                port: this.projectConfig.email.port,
                secure: this.projectConfig.email.secure,
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
                if (error) {
                    console.log("error", error);
                    reject(error);
                } else {
                    console.log("info", info);
                    resolve(info);
                }
            });
        });
    }
}
