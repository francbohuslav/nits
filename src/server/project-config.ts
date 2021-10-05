export interface IProjectConfig {
    cryptoSalt: string;
    userDataEncrypted: boolean;
    admins: string[];
    jira: {
        nitsCustomField: string;
        clientId: string;
        clientSecret: string;
        cloudId: string;
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
                jira: {
                    nitsCustomField: process.env.NITS_JIRA_CUSTOM_FIELD,
                    clientId: process.env.NITS_JIRA_CLIENT_ID,
                    clientSecret: process.env.NITS_JIRA_SECRET,
                    cloudId: process.env.NITS_JIRA_CLOUD_ID,
                },
            };

            return projectConfig;
        } catch (err) {
            console.error(err);
            process.exit(1);
        }
    }
}
