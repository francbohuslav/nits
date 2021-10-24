export interface IProjectConfig {
    cryptoSalt: string;
    userDataEncrypted: boolean;
    admins: string[];
    syncDaysCount: number;
    serverAddress: string;
    /** If true, no changes are made. All is readonly. Default is true */
    jira: {
        nitsCustomField: string;
        clientId: string;
        clientSecret: string;
        cloudId: string;
    };
    email: {
        user: string;
        password: string;
        sender: string;
    };
}

export class ProjectConfigurer {
    public getProjectConfig(): IProjectConfig {
        try {
            if (!process.env.NITS_CRYPTO_SALT) {
                throw new Error("Set NITS_CRYPTO_SALT in in env");
            }
            const projectConfig: IProjectConfig = {
                cryptoSalt: process.env.NITS_CRYPTO_SALT,
                userDataEncrypted: true,
                admins: process.env.NITS_ADMIN_UIDS.trim().split(/\s*,\s*/),
                syncDaysCount: parseInt(process.env.NITS_SYNC_DAYS_COUNT || "7"),
                serverAddress: process.env.NITS_SERVER_ADDRESS,
                jira: {
                    nitsCustomField: process.env.NITS_JIRA_CUSTOM_FIELD,
                    clientId: process.env.NITS_JIRA_CLIENT_ID,
                    clientSecret: process.env.NITS_JIRA_SECRET,
                    cloudId: process.env.NITS_JIRA_CLOUD_ID,
                },
                email: {
                    user: process.env.NITS_EMAIL_USER,
                    password: process.env.NITS_EMAIL_PASS,
                    sender: process.env.NITS_EMAIL_SENDER,
                },
            };

            return projectConfig;
        } catch (err) {
            console.error(err);
            process.exit(1);
        }
    }
}
