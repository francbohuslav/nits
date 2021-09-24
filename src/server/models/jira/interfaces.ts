export class Worklog {
    public author: IAccount;
    public created: string; // "2021-09-16T12:19:36.231+0200",
    public updated: string; // "2021-09-16T12:19:36.231+0200",
    public started: string; // "2021-09-16T11:18:54.349+0200",
    public timeSpent: string; // "1h",
    public timeSpentSeconds: number; // 3600,
    public id: string; // "193590",
    public issueId: string; //"51146",
    public comment: IComment;
    // own
    public commentAsText: string;
    public commentAsTextErrors: string[];
    public startedDate: Date;

    public toString(): string {
        return `JIRA Worklog ${this.author.displayName} ${this.started}`;
    }
}

export interface IAccount {
    accountId: string; // "6138a0763912120070668f1b";
    emailAddress: string; // "bohuslav.franc@unicorn.com";
    displayName: string; // "Bohuslav Franc";
    active: boolean;
    timeZone: string; // "Europe/Berlin";
    locale: string; // "cs_CZ";
}

export interface IComment {
    version: 1; // 1,
    type: "doc"; // "doc",
    content: IContent[];
}
export interface IContent {
    type: "paragraph";
    content: ISegments[];
}

export interface ISegments {
    type: "text";
    text: string;
}
