export interface IProjectConfig {
    nitsCustomField: string;
    cryptoSalt: string;
    userDataEncrypted: boolean;
}
export class ProjectConfigurer {
    public getProjectConfig(): IProjectConfig {
        try {
            if (!process.env.NITS_CRYPTO_SALT) {
                throw new Error("Set NITS_CRYPTO_SALT in in env");
            }
            const projectConfig: IProjectConfig = {
                cryptoSalt: process.env.NITS_CRYPTO_SALT,
                userDataEncrypted: false,
                nitsCustomField: "customfield_10067",
            };

            return projectConfig;
        } catch (err) {
            console.error(err);
            process.exit(1);
        }
    }
}
