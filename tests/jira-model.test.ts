import { ISyncReport } from "../src/server/models/interfaces";
import { IIssue, Worklog } from "../src/server/models/jira/interfaces";
import { IWtmTsConfigPerIssueKey, JiraModel } from "../src/server/models/jira/jira-model";

test("filterWorklogsAndAssignWtmConfig", async () => {
    const NITS_FIELD_VALUE_1 = "1";
    const NITS_FIELD_VALUE_2 = "2";
    const NITS_FIELD_UNKNOWN_VALUE = "3";
    const artifactSetting = [
        {
            jiraProjectKey: "CET",
            jiraNitsField: "",
            wtmArtifact: "CET-WITHOUT-FIELD",
        },
        {
            jiraProjectKey: "CET",
            jiraNitsField: NITS_FIELD_VALUE_1,
            wtmArtifact: "CET-WITH-NITS-1",
        },
        {
            jiraProjectKey: "CET",
            jiraNitsField: NITS_FIELD_VALUE_2,
            wtmArtifact: "CET-WITH-NITS-2",
        },
        {
            jiraProjectKey: "SUP",
            jiraNitsField: NITS_FIELD_VALUE_1,
            wtmArtifact: "CET-WITH-NITS-3",
        },
    ];

    const issuesById: { [id: string]: IIssue } = {
        "1": {
            id: "1",
            fields: {
                project: {
                    id: "100",
                    key: "CET",
                    name: "CET",
                },
            },
            key: "CET-1",
        },
        "2": {
            id: "2",
            fields: {
                project: {
                    id: "100",
                    key: "CET",
                    name: "CET",
                },
                nitsCustomFiled: {
                    id: NITS_FIELD_VALUE_1,
                    value: "NITS_FIELD_VALUE_1",
                },
            },
            key: "CET-2",
        },
        "3": {
            id: "3",
            fields: {
                project: {
                    id: "100",
                    key: "CET",
                    name: "CET",
                },
                nitsCustomFiled: {
                    id: NITS_FIELD_VALUE_2,
                    value: "NITS_FIELD_VALUE_2",
                },
            },
            key: "CET-3",
        },
        "4": {
            id: "4",
            fields: {
                project: {
                    id: "100",
                    key: "CET",
                    name: "CET",
                },
                nitsCustomFiled: {
                    id: NITS_FIELD_UNKNOWN_VALUE,
                    value: "NITS_FIELD_UNKNOWN_VALUE",
                },
            },
            key: "CET-4",
        },
        // will not be used
        "5": {
            id: "5",
            fields: {
                project: {
                    id: "200",
                    key: "OUT",
                    name: "OUT",
                },
            },
            key: "OUT-4",
        },
        // configuration not fit
        "6": {
            id: "6",
            fields: {
                project: {
                    id: "300",
                    key: "SUP",
                    name: "SUP",
                },
            },
            key: "SUP-6",
        },
    };

    const jiraModel = new JiraModel(null, {
        cryptoSalt: "test",
        serverAddress: "",
        wtmProjectCode: "TEST",
        email: {
            password: "",
            sender: "",
            user: "",
            host: "",
            port: 0,
            secure: false,
        },
        jira: {
            clientId: "",
            clientSecret: "",
            cloudId: "",
            nitsCustomField: "nitsCustomFiled",
            nitsCustomFieldIsArtifact: false,
        },
        userDataEncrypted: false,
    });

    const inputWorklogs: Partial<Worklog>[] = [
        {
            id: "10",
            issueId: "1",
        },
        {
            id: "20",
            issueId: "2",
        },
        {
            id: "30",
            issueId: "3",
        },
        {
            id: "40",
            issueId: "4",
        },
        {
            id: "50",
            issueId: "5",
        },
        {
            id: "60",
            issueId: "6",
        },
    ];
    const wtmTsConfigPerIssueId: IWtmTsConfigPerIssueKey = {};
    const report: ISyncReport = { log: [], users: [], startedAt: null, timeZone: null };
    const workLog = jiraModel.filterWorklogsByRulesAndAssignWtmConfig(inputWorklogs as Worklog[], issuesById, wtmTsConfigPerIssueId, artifactSetting, report);
    expect(workLog).toHaveLength(4);
    expect(wtmTsConfigPerIssueId).toBeTruthy();
    expect(wtmTsConfigPerIssueId["CET-1"].wtmArtifact).toBe("CET-WITHOUT-FIELD");
    expect(wtmTsConfigPerIssueId["CET-2"].wtmArtifact).toBe("CET-WITH-NITS-1");
    expect(wtmTsConfigPerIssueId["CET-3"].wtmArtifact).toBe("CET-WITH-NITS-2");
    expect(wtmTsConfigPerIssueId["CET-4"].wtmArtifact).toBe("CET-WITHOUT-FIELD");
    expect(wtmTsConfigPerIssueId["5"]).toBeUndefined();
    expect(wtmTsConfigPerIssueId["6"]).toBeUndefined();
    expect(report.log[3]).toContain("WARNING");
    expect(report.log[4]).toContain("skipped. Project OUT is not configured.");
    expect(report.log[5]).toContain("nor parent has no valid configuration");
});
