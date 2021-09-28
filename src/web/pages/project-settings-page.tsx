import { Button, LinearProgress, Typography } from "@material-ui/core";
import { useEffect, useState } from "react";
import React = require("react");
import { IProjectSettings } from "../../common/interfaces";
import { useAjax } from "../ajax";
import { DataGrid, GridCellEditCommitParams, GridColumns, GridEditRowsModel, sortedGridRowsSelector } from "@material-ui/data-grid";
import { useHistory } from "react-router";
import { Router } from "../router";

export const ProjectSettingsPage = () => {
    const [projectSettings, setProjectSettings] = useState<IProjectSettings[]>([
        {
            jiraProjectCode: "CET",
            jiraNitsField: "",
            uuArtifact: "",
        },
        {
            jiraProjectCode: "SUP",
            jiraNitsField: "",
            uuArtifact: "",
        },
    ]);
    projectSettings.sort((p1, p2) => p1.jiraProjectCode.localeCompare(p2.jiraProjectCode) || p1.jiraNitsField.localeCompare(p2.jiraNitsField));
    const rows = projectSettings ? projectSettings.map((p, index) => ({ ...p, id: index })) : null;

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
        const res = await ajax.get<IProjectSettings[]>("/server/get-project-settings");
        if (res.isOk) {
            setProjectSettings(res.data);
        }
        setIsLoading(false);
    };

    const onSave = async () => {};

    useEffect(() => {
        //TODO: BF:   loadData();
    }, []);

    const columns: GridColumns = [
        { field: "jiraProjectCode", headerName: "JIRA project code" },
        { field: "jiraNitsField", headerName: "JIRA NITS" },
        { field: "uuArtifact", headerName: "UU artefakt" },
    ];
    columns.forEach((c) => {
        c.editable = true;
        c.flex = c.flex || 1;
        c.sortable = false;
        c.align = c.align || "center";
        c.headerAlign = "center";
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
                    <Typography paragraph align="right">
                        <Button variant="contained" color="primary" onClick={onSave}>
                            Uložit
                        </Button>{" "}
                        <Button variant="contained" onClick={() => history.push(Router.PageMain)}>
                            Zpět
                        </Button>
                    </Typography>
                </>
            )}
        </>
    );
};
