import { IProjectSettings, IStats, IUserPublicData, IUserState } from "./interfaces";

export interface IBaseResponse<T> {
    message?: string;
    stack?: string;
    statusText?: string;
    /**
     * Is set in ajax
     */
    isOk?: boolean;
    data: T;
}

export interface ILoginRequest {
    accessCode1: string;
    accessCode2: string;
}

export interface IProjectSettingsResponse {
    records: IProjectSettings[];
    nitsFiledValues: { [key: string]: string };
    projects: { [key: string]: string };
}

export interface IStatsResponse {
    users: IStats[];
}

export interface IJiraProcessRequest {
    code: string;
    state: string; //8088418f6756b9c5dd499e01b93596f9cc21a47f35f0da78a7a0e1f6bfca6f41
    error: string; //access_denied
    error_description: string; //User%20did%20not%20authorize%20the%20request
}

export interface IAllUsersResponse {
    users: IUserPublicData[];
}
export interface IUserSetStateRequest {
    uid: string;
    state: IUserState;
}
