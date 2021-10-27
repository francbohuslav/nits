import { Box, Button, Card, CardContent, Grid, IconButton, LinearProgress, TextField, Tooltip, Typography } from "@material-ui/core";
import { DataGrid, GridCellEditCommitParams, GridColumns } from "@material-ui/data-grid";
import AddIcon from "@material-ui/icons/AddCircleRounded";
import CloseIcon from "@material-ui/icons/Close";
import { ChangeEvent, useEffect, useState } from "react";
import { useHistory } from "react-router";
import { IArtifactSettingsResponse } from "../../common/ajax-interfaces";
import { IArtifactSettings, ISystemConfig } from "../../common/interfaces";
import { useAjax } from "../ajax";
import { thisApp } from "../app-provider";
import { Header } from "../components/header";
import { Router } from "../router";
import React = require("react");

export const ProjectSettingsPage = () => {
    const [artifactSettings, setArtifactSettings] = useState<IArtifactSettings[]>(null);
    const [nitsFieldValues, setNitsFieldValues] = useState<{ [id: string]: string }>({});
    const [projects, setProjects] = useState<{ [id: string]: string }>({});
    const [systemConfig, setSystemConfig] = useState<ISystemConfig>(null);
    const [adminUidsAsStr, setAdminUidsAsStr] = useState<string>("");
    artifactSettings?.sort(
        (p1, p2) => (p1.jiraProjectKey || "").localeCompare(p2.jiraProjectKey || "") || (p1.jiraNitsField || "").localeCompare(p2.jiraNitsField || "")
    );
    const rows = artifactSettings?.map((p, index) => ({ ...p, id: index }));

    const [isLoading, setIsLoading] = useState(false);
    const ajax = useAjax();
    const history = useHistory();

    const handleCellEditCommit = React.useCallback(
        ({ id, field, value }: GridCellEditCommitParams) => {
            const updatedRows = rows.map((row) => (row.id === id ? { ...row, [field]: value } : row));
            setArtifactSettings(updatedRows);
        },
        [artifactSettings]
    );

    const loadData = async () => {
        setIsLoading(true);
        const res = await ajax.get<IArtifactSettingsResponse>("/server/project-settings/get-artifacts");
        const res2 = await ajax.get<ISystemConfig>("/server/project-settings/get-config");
        if (res.isOk) {
            setArtifactSettings(res.data.records);
            setNitsFieldValues(res.data.nitsFiledValues);
            setProjects(res.data.projects);
        }
        if (res2.isOk) {
            setSystemConfig(res2.data);
            setAdminUidsAsStr(res2.data.adminUids.join(", "));
        }
        setIsLoading(false);
    };

    const onSave = async () => {
        setIsLoading(true);
        const res = await ajax.post<boolean>("/server/project-settings/set-artifacts", artifactSettings);
        setIsLoading(false);
        if (res.isOk) {
            thisApp().toast("Uloženo");
        } else {
            thisApp().toast("Data nebyla uložena", "error");
        }
    };

    const onAdd = () => setArtifactSettings([...artifactSettings, { jiraNitsField: "", jiraProjectKey: "", wtmArtifact: "" }]);
    const onDelete = (index: number) => {
        if (confirm("Opravdu smazat tento záznam?")) {
            setArtifactSettings(artifactSettings.filter((_v, i) => index != i));
        }
    };

    const onAdminUids = (e: ChangeEvent<HTMLInputElement>) => setAdminUidsAsStr(e.target.value);
    const onSyncDaysCount = (e: ChangeEvent<HTMLInputElement>) => setSystemConfig({ ...systemConfig, syncDaysCount: parseInt(e.target.value) });

    const onSystemConfigSubmit = async () => {
        setIsLoading(true);
        const systemConfigToSave = { ...systemConfig };
        systemConfigToSave.adminUids = adminUidsAsStr.trim().split(/\s*,\s*/);
        const res = await ajax.post<void>("/server/project-settings/set-config", systemConfigToSave);
        setIsLoading(false);
        if (res.isOk) {
            thisApp().toast("Uloženo");
        } else {
            thisApp().toast("Data nebyla uložena", "error");
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const columns: GridColumns = [
        {
            field: "jiraProjectKey",
            headerName: "JIRA project key",
            type: "singleSelect",
            valueOptions: Object.entries(projects).map(([k, v]) => ({
                value: k,
                label: v,
            })),
            renderCell: (params) => (params.value ? projects[params.value.toString()] || "neznámá hodnota " + params.value : "nevyplněno"),
        },
        {
            field: "jiraNitsField",
            headerName: "JIRA NITS",
            type: "singleSelect",
            valueOptions: Object.entries(nitsFieldValues).map(([k, v]) => ({
                value: k,
                label: v,
            })),
            renderCell: (params) => (params.value ? nitsFieldValues[params.value.toString()] || "neznámá hodnota " + params.value : "nevyplněno"),
        },
        { field: "wtmArtifact", headerName: "WTM artefakt" },
        {
            field: "action",
            headerName: " ",
            renderHeader: (_params) => (
                <Tooltip title="Přidat záznam">
                    <IconButton color="primary" size="small" onClick={onAdd}>
                        <AddIcon />
                    </IconButton>
                </Tooltip>
            ),
            renderCell: (params) => (
                <Tooltip title="Smazat záznam">
                    <IconButton size="small" onClick={() => onDelete(params.row.id)}>
                        <CloseIcon />
                    </IconButton>
                </Tooltip>
            ),
            flex: 0.2,
        },
    ];

    columns.forEach((c) => {
        c.editable = true;
        c.flex = c.flex || 1;
        c.sortable = false;
    });

    return (
        <Header header="Nastavení">
            {isLoading ? (
                <LinearProgress />
            ) : (
                <>
                    {rows && (
                        <>
                            <Box mb={3}>
                                <Card>
                                    <CardContent>
                                        <Typography variant="h6" paragraph>
                                            Artefakty
                                        </Typography>
                                        <Typography paragraph>
                                            <DataGrid
                                                columns={columns}
                                                rows={rows}
                                                density="compact"
                                                autoHeight
                                                disableColumnMenu
                                                hideFooterPagination
                                                hideFooter
                                                onCellEditCommit={handleCellEditCommit}
                                            />
                                        </Typography>
                                        <Box display="flex">
                                            <Box flexGrow={1}>
                                                <Button variant="contained" color="secondary" href={Router.PageSynchronization} target="_blank">
                                                    Spustit synchronizaci
                                                </Button>
                                            </Box>
                                            <Box>
                                                <Button variant="contained" color="primary" onClick={onSave}>
                                                    Uložit
                                                </Button>
                                            </Box>
                                        </Box>
                                    </CardContent>
                                </Card>
                            </Box>
                            <Box mb={3}>
                                <Card>
                                    <CardContent>
                                        <Typography variant="h6" paragraph>
                                            Obecná nastavení
                                        </Typography>
                                        <form noValidate onSubmit={onSystemConfigSubmit}>
                                            <Grid container spacing={2}>
                                                <Grid item xs={12} sm={6}>
                                                    <TextField
                                                        id="adminUids"
                                                        label="UID administrátorů"
                                                        helperText="oddělené čárkou"
                                                        value={adminUidsAsStr}
                                                        fullWidth
                                                        required
                                                        onChange={onAdminUids}
                                                    />
                                                </Grid>
                                                <Grid item xs={12} sm={6}>
                                                    <TextField
                                                        id="syncDaysCount"
                                                        label="Počet dnů k synchronizaci"
                                                        value={systemConfig?.syncDaysCount || 1}
                                                        fullWidth
                                                        required
                                                        type="number"
                                                        onChange={onSyncDaysCount}
                                                    />
                                                </Grid>
                                            </Grid>
                                            <Box display="flex" mt={1}>
                                                <Box flexGrow={1}></Box>
                                                <Box>
                                                    <Button variant="contained" color="primary" type="submit">
                                                        Uložit
                                                    </Button>
                                                </Box>
                                            </Box>
                                        </form>
                                    </CardContent>
                                </Card>
                            </Box>
                            <Box display="flex">
                                <Box flexGrow={1}></Box>
                                <Box>
                                    <Button variant="contained" onClick={() => history.push(Router.PageMain)}>
                                        Zpět
                                    </Button>
                                </Box>
                            </Box>
                        </>
                    )}
                </>
            )}
        </Header>
    );
};
