import axios from "axios";
import dateUtils from "../../../common/date-utils";
import { IProjectConfig } from "../../project-config";

//TODO: BF: clean/verify
export class Authentication {
    private lastToken: string;
    private expirationTimestamp: number;

    private authenticatedUsers: IUserCredentials[] = [];

    constructor(private projectConfig: IProjectConfig) {}

    public async getToken(): Promise<string> {
        const now = dateUtils.getActualTimestamp();
        if (this.lastToken && now < this.expirationTimestamp) {
            return this.lastToken;
        }
        const response = await axios.post<ITokenResponse>("https://uuidentity.plus4u.net/uu-oidc-maing02/bb977a99f4cc4c37a2afce3fd599d0a7/oidc/grantToken", {
            grant_type: "password",
            accessCode1: this.projectConfig.serviceAccessCode1,
            accessCode2: this.projectConfig.serviceAccessCode2,
            scope: "openid https://",
        });
        this.lastToken = response.data.id_token;
        this.expirationTimestamp = now + response.data.expires_in - 3 * 60;
        console.log("Token loaded, will expire at", dateUtils.formatDateTime(this.expirationTimestamp));
        return this.lastToken;
    }

    public async getUserUid(accessCode1: string, accessCode2: string): Promise<string> {
        const userRecord = this.authenticatedUsers.filter((a) => a.accessCode1 == accessCode1 && a.accessCode2 == accessCode2)[0];
        if (userRecord) {
            return userRecord.uid;
        }
        try {
            console.log("Auth: request");
            const response = await axios.post<ITokenResponse>(
                "https://uuidentity.plus4u.net/uu-oidc-maing02/bb977a99f4cc4c37a2afce3fd599d0a7/oidc/grantToken",
                {
                    grant_type: "password",
                    accessCode1: accessCode1,
                    accessCode2: accessCode2,
                    scope: "openid https://",
                }
            );
            if (!response.data.id_token) {
                return null;
            }

            const responseP = await axios.request<any>({
                url: "https://uuidentity.plus4u.net/uu-identitymanagement-maing01/a9b105aff2744771be4daa8361954677/getIdentityByPerson",
                headers: { Authorization: "Bearer " + response.data.id_token },
                method: "get",
            });
            const uid = responseP.data.identity.uuIdentity;

            this.authenticatedUsers.push({
                accessCode1,
                accessCode2,
                uid,
                identity: responseP.data.identity,
            });
            return uid;
        } catch (err) {
            console.log("Auth: not worthy");
            return null;
        }
    }
}
interface ITokenResponse {
    id_token: string;
    expires_in: number; // e.g.1800
}

interface IUserCredentials {
    accessCode1: string;
    accessCode2: string;
    uid: string;
    identity: any;
}
