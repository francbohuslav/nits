import { useHistory, useLocation } from "react-router";

export class Router<TQueryParams> {
    public static PageMain = "/";
    public static PageLogin = "/page/login/";
    public static PageJiraSettings = "/page/jira-settings/";
    public static PageNotification = "/page/notification/";
    public static PageArtifactSettings = "/page/project-settings/";
    public static PageStats = "/page/stats/";
    public static PageUsers = "/page/users/";
    public static PageSynchronization = "/server/sync";
    public static PageMonthNotification = "/server/month-notification";
    public static PageLogout = "/server/logout/";

    constructor(public route: string, public history: any, public location: any) {}

    public getQuery(): TQueryParams {
        const params = new URLSearchParams(this.location.search);
        const obj: any = {};
        Array.from(params.entries()).forEach((value) => (obj[value[0]] = value[1]));
        return obj as TQueryParams;
    }

    public setQuery(newParams: TQueryParams) {
        const newQuery: any = { ...this.getQuery(), ...newParams };
        Object.keys(newQuery)
            .filter((key) => newQuery[key] === null || newQuery[key] === "")
            .forEach((key) => delete newQuery[key]);
        const newUrl = this.route + "?" + new URLSearchParams(newQuery as any).toString();
        this.history.push(newUrl);
    }
}

export function useRouter<TQueryParams>(route: string): Router<TQueryParams> {
    return new Router<TQueryParams>(route, useHistory(), useLocation());
}
