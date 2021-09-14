import axios from "axios";
import dateUtils from "../../common/date-utils";

export class UuIdendtityApi {
    public async getToken(accessCode1: string, accessCode2: string): Promise<ITokenResponse> {
        const response = await axios.post<ITokenResponse>("https://uuidentity.plus4u.net/uu-oidc-maing02/bb977a99f4cc4c37a2afce3fd599d0a7/oidc/grantToken", {
            grant_type: "password",
            accessCode1,
            accessCode2,
            scope: "openid https://",
        });
        const now = dateUtils.getActualTimestamp();
        return { ...response.data, expirationTimestamp: now + response.data.expires_in - 3 * 60 };
    }

    public async getIdentity(token: string): Promise<IIdentityResponse> {
        const responseP = await axios.request<IIdentityResponse>({
            url: "https://uuidentity.plus4u.net/uu-identitymanagement-maing01/a9b105aff2744771be4daa8361954677/getIdentityByPerson",
            headers: { Authorization: "Bearer " + token },
            method: "get",
        });
        return responseP.data;
    }
}
export interface ITokenResponse {
    id_token: string;
    /**
     * e.g. 1800
     */
    expires_in: number;
    expirationTimestamp: number;
}
export interface IIdentityResponse {
    identity: IIdentityResponse_Identity;
}

export interface IIdentityResponse_Identity {
    uuIdentity: string;
}
