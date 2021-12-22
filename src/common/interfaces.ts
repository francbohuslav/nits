interface IUserDataBase {
    jiraAccountId: string;
    jiraName: string;
    uid: string;
    name: string;
    notificationEmail: string;
    lastSynchronization: string;
    state: IUserState;
    lastError: ILastError;
    notitificationStatuses: INotificationStatuses;
}

export interface IUserPublicData extends IUserDataBase {
    isAdmin: boolean;
}

export interface IUserData extends IUserDataBase {
    uuAccessCode1: string;
    uuAccessCode2: string;
}

export interface ILastError {
    message: string;
    stack: string;
    response: ILastErrorResponse;
    additionalData: any;
}

export interface ILastErrorResponse {
    uuAppErrorMap: any;
    status: number;
    statusText: string;
}

export interface IArtifactSettings {
    jiraProjectKey: string;
    jiraNitsField: string;
    wtmArtifact: string;
}

export interface IStats {
    uid: string;
    name: string;
    jiraHours: number;
    wtmHours: number;
    days: IStatsDays;
    lastSynchronization: string;
    notitificationStatuses: INotificationStatuses;
}
export type IStatsDays = { [date: string]: IStatsDay };
export type INotificationStatuses = { [startOfMonth: string]: INotificationStatus };

export interface INotificationStatus {
    /** Set even for error */
    time: Date;
    error: string;
    stack: string;
    emailIsSet: boolean;
}
export interface IStatsDay {
    date: string;
    jiraHours: number;
    wtmHours: number;
    artifacts: IStatsArts;
}

export type IStatsArts = { [art: string]: IStatsArt };

export interface IStatsArt {
    artifact: string;
    wtmHours: number;
}

export interface IUserStats {
    wtmHours: number;
    lastSynchronization: string;
}

export interface IProjectConfigPublic {
    /** If true, no changes are made. All is readonly. Default is true */
    jiraClientId: string;
    serverAddress: string;
    /** Email settings are set and can use emailing */
    emailIsActive: boolean;
}
export type IUserState = "disabled" | "readonly" | "active";

export interface ISystemConfig {
    adminUids: string[];
    syncDaysCount: number;
    syncHour: number;
    notifyHour: number;
    statsUserUid: string;
}
export interface IJiraAccount {
    name: string;
    id: string;
}
