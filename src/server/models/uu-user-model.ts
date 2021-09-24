import dateUtils from "../../common/date-utils";
import { IIdentityResponse_Identity, ITokenResponse, UuIdendtityApi } from "../apis/uu-identity-api";
const md5 = require("md5");

export class UuUserModel {
    constructor(private uuIdendtityApi: UuIdendtityApi, private tokenCache: ITokensMemory) {}

    public async getUuUserIdentity(accessCode1: string, accessCode2: string): Promise<IUserIdentity> {
        console.log("Auth: request");
        const tokenResponse = await this.getToken(accessCode1, accessCode2);
        if (!tokenResponse.id_token) {
            throw new Error("Token not obtained");
        }

        const identityResponse = await this.uuIdendtityApi.getIdentity(tokenResponse.id_token);
        const uid = identityResponse.identity.uuIdentity;
        return {
            accessCode1,
            accessCode2,
            uid,
            identity: identityResponse.identity,
        };
    }

    public async getToken(accessCode1: string, accessCode2: string): Promise<ITokenResponse> {
        const key = md5(accessCode1 + "|" + accessCode2);
        if (this.tokenCache[key] && dateUtils.toTimestamp() < this.tokenCache[key].expirationTimestamp) {
            return this.tokenCache[key];
        }
        const tokenResponse = await this.uuIdendtityApi.getToken(accessCode1, accessCode2);
        this.tokenCache[key] = tokenResponse;
        return tokenResponse;
    }
}

export interface IUserIdentity {
    accessCode1: string;
    accessCode2: string;
    uid: string;
    identity: IIdentityResponse_Identity;
}

export type ITokensMemory = { [accessCodesJoin: string]: ITokenResponse };
