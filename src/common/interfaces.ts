interface IUserDataBase {
    jiraAccountId: string;
    jiraName: string;
    uid: string;
    name: string;
    notificationEmail: string;
    lastSynchronization: string;
    state: IUserState;
}

export interface IUserPublicData extends IUserDataBase {
    isAdmin: boolean;
}

export interface IUserData extends IUserDataBase {
    uuAccessCode1: string;
    uuAccessCode2: string;
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
}

export type IStatsDays = { [date: string]: IStatsDay };

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
}
export type IUserState = "disabled" | "readonly" | "active";

export interface ISystemConfig {
    adminUids: string[];
    syncDaysCount: number;
}
export interface IJiraAccount {
    name: string;
    id: string;
}
