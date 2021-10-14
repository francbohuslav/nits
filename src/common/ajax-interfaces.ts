import { IProjectSettings, IStats } from "./interfaces";

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
