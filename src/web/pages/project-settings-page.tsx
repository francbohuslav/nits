import {
    Box,
    Button,
    Card,
    CardContent,
    FormControl,
    FormHelperText,
    Grid,
    IconButton,
    InputLabel,
    LinearProgress,
    MenuItem,
    Select,
    TextField,
    Tooltip,
    Typography,
} from "@material-ui/core";
import { DataGrid, GridCellEditCommitParams, GridColumns } from "@material-ui/data-grid";
import AddIcon from "@material-ui/icons/AddCircleRounded";
import CloseIcon from "@material-ui/icons/Close";
import React, { ChangeEvent, useEffect, useState } from "react";
import { useHistory } from "react-router";
import { IAllUsersResponse, IArtifactSettingsResponse } from "../../common/ajax-interfaces";
import { IArtifactSettings, ISystemConfig, IUserPublicData } from "../../common/interfaces";
import { useAjax } from "../ajax";
import { thisApp } from "../app-provider";
import { Header } from "../components/header";
import { Router } from "../router";

export const ProjectSettingsPage = () => {
    const [artifactSettings, setArtifactSettings] = useState<IArtifactSettings[]>(null);
    const [nitsFieldValues, setNitsFieldValues] = useState<{ [id: string]: string }>({});
    const [users, setUsers] = useState<IUserPublicData[]>([]);
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
        const res3 = await ajax.get<IAllUsersResponse>("/server/admin-users/get");
        if (res.isOk) {
            setArtifactSettings(res.data.records);
            setNitsFieldValues(res.data.nitsFiledValues);
            setProjects(res.data.projects);
        }
        if (res2.isOk) {
            setSystemConfig(res2.data);
            setAdminUidsAsStr(res2.data.adminUids.join(", "));
        }
        if (res3.isOk) {
            setUsers(res3.data.users);
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
    const onSyncHour = (e: ChangeEvent<HTMLInputElement>) => setSystemConfig({ ...systemConfig, syncHour: parseInt(e.target.value) });
    const onNotifyHour = (e: ChangeEvent<HTMLInputElement>) => setSystemConfig({ ...systemConfig, notifyHour: parseInt(e.target.value) });
    const onStatsUserUid = (e: any) => setSystemConfig({ ...systemConfig, statsUserUid: e.target.value });

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
                                            <Box flexGrow={1}></Box>
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
                                        <form noValidate onSubmit={onSystemConfigSubmit}>
                                            <Typography variant="h6" paragraph>
                                                Synchronizace
                                            </Typography>
                                            <Grid container spacing={2}>
                                                <Grid item xs={12} sm={6}>
                                                    <TextField
                                                        id="syncDaysCount"
                                                        label="Sync dní"
                                                        value={systemConfig?.syncDaysCount || 1}
                                                        helperText="počet dnů k synchronizaci"
                                                        fullWidth
                                                        required
                                                        type="number"
                                                        onChange={onSyncDaysCount}
                                                    />
                                                </Grid>
                                                <Grid item xs={12} sm={6}>
                                                    <TextField
                                                        id="syncHour"
                                                        label="Sync hodina"
                                                        value={systemConfig?.syncHour || 23}
                                                        helperText="hodina, ve které dojde k synchronizaci"
                                                        fullWidth
                                                        required
                                                        type="number"
                                                        onChange={onSyncHour}
                                                    />
                                                </Grid>
                                            </Grid>
                                            <Box mt={4}>
                                                <Typography variant="h6">Notifikace</Typography>
                                            </Box>
                                            <Grid container spacing={2}>
                                                <Grid item xs={12} sm={6}>
                                                    <TextField
                                                        id="notifyHour"
                                                        label="Hodina notifikace"
                                                        value={systemConfig?.notifyHour || 6}
                                                        helperText="hodina, ve které dojde na konci měsíce odeslání e-mailu uživatelům"
                                                        fullWidth
                                                        required
                                                        type="number"
                                                        onChange={onNotifyHour}
                                                    />
                                                </Grid>
                                                <Grid item xs={12} sm={6}>
                                                    <FormControl fullWidth required>
                                                        <InputLabel id="statsUserUid-label">Uživatel statistik</InputLabel>
                                                        <Select
                                                            labelId="statsUserUid-label"
                                                            id="statsUserUid"
                                                            value={systemConfig?.statsUserUid || 6}
                                                            onChange={onStatsUserUid}
                                                        >
                                                            {users.map((u) => (
                                                                <MenuItem key={u.uid} value={u.uid}>
                                                                    {u.name}
                                                                </MenuItem>
                                                            ))}
                                                        </Select>
                                                        <FormHelperText>uživatel, pod kterým se stáhnou statistiky pro měsíční notifikaci</FormHelperText>
                                                    </FormControl>
                                                </Grid>
                                            </Grid>
                                            <Box mt={4}>
                                                <Typography variant="h6" paragraph>
                                                    Obecná nastavení
                                                </Typography>
                                            </Box>
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
