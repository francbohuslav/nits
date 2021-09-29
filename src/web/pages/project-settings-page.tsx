import { Box, Button, IconButton, LinearProgress, Tooltip, Typography } from "@material-ui/core";
import CloseIcon from "@material-ui/icons/Close";
import AddIcon from "@material-ui/icons/AddCircleRounded";
import { useEffect, useState } from "react";
import React = require("react");
import { IProjectSettings } from "../../common/interfaces";
import { useAjax } from "../ajax";
import { DataGrid, GridCellEditCommitParams, GridColumns } from "@material-ui/data-grid";
import { useHistory } from "react-router";
import { Router } from "../router";
import { thisApp } from "../app-provider";
import { IProjectSettingsResponse } from "../../common/ajax-interfaces";

export const ProjectSettingsPage = () => {
    const [projectSettings, setProjectSettings] = useState<IProjectSettings[]>(null);
    const [nitsFieldValues, setNitsFieldValues] = useState<{ [id: string]: string }>({});
    const [projects, setProjects] = useState<{ [id: string]: string }>({});
    projectSettings?.sort((p1, p2) => p1.jiraProjectCode.localeCompare(p2.jiraProjectCode) || p1.jiraNitsField.localeCompare(p2.jiraNitsField));
    const rows = projectSettings?.map((p, index) => ({ ...p, id: index }));

    const [isLoading, setIsLoading] = useState(false);
    const ajax = useAjax();
    const history = useHistory();

    const handleCellEditCommit = React.useCallback(
        ({ id, field, value }: GridCellEditCommitParams) => {
            const updatedRows = rows.map((row) => (row.id === id ? { ...row, [field]: value } : row));
            setProjectSettings(updatedRows);
        },
        [projectSettings]
    );

    const loadData = async () => {
        setIsLoading(true);
        const res = await ajax.get<IProjectSettingsResponse>("/server/project-settings/get");
        if (res.isOk) {
            setProjectSettings(res.data.records);
            setNitsFieldValues(res.data.nitsFiledValues);
            setProjects(res.data.projects);
        }
        setIsLoading(false);
    };

    const onSave = async () => {
        setIsLoading(true);
        const res = await ajax.post<boolean>("/server/project-settings/set", projectSettings);
        setIsLoading(false);
        if (res.isOk) {
            thisApp().toast("Uloženo");
            // history.push(Router.PageMain);
        } else {
            thisApp().toast("Data nebyla uložena", "error");
        }
    };

    const onAdd = () => setProjectSettings([...projectSettings, { jiraNitsField: "", jiraProjectCode: "", uuArtifact: "" }]);
    const onDelete = (index: number) => {
        if (confirm("Opravdu smazat tento záznam?")) {
            setProjectSettings(projectSettings.filter((_v, i) => index != i));
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const columns: GridColumns = [
        {
            field: "jiraProjectCode",
            headerName: "JIRA project code",
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
        { field: "uuArtifact", headerName: "UU artefakt" },
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

    return isLoading ? (
        <LinearProgress />
    ) : (
        <>
            {rows && (
                <>
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
                            </Button>{" "}
                            <Button variant="contained" onClick={() => history.push(Router.PageMain)}>
                                Zpět
                            </Button>
                        </Box>
                    </Box>
                </>
            )}
        </>
    );
};
