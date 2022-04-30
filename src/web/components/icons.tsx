import { Tooltip } from "@material-ui/core";
import * as colors from "@material-ui/core/colors";
import BlockIcon from "@material-ui/icons/Block";
import CheckIconM from "@material-ui/icons/Check";
import CloseIcon from "@material-ui/icons/Close";
import ErrorIcon from "@material-ui/icons/Error";
import QueryBuilderIcon from "@material-ui/icons/QueryBuilder";
import React from "react";

export const CheckIcon = ({ tooltip, mt = 0, color = "green" }: { tooltip: string; mt?: number; color?: string }) => {
    return (
        <Tooltip title={tooltip}>
            <CheckIconM style={{ color: (colors as any)[color][500], marginTop: mt + "px" }} />
        </Tooltip>
    );
};

export const CrossIcon = ({ tooltip, mt = 0, color = "red" }: { tooltip: string; mt?: number; color?: string }) => {
    return (
        <Tooltip title={tooltip}>
            <CloseIcon style={{ color: (colors as any)[color][500], marginTop: mt + "px" }} />
        </Tooltip>
    );
};

export const PlannedIcon = ({ tooltip, color = "grey" }: { tooltip: string; color?: string }) => {
    return (
        <Tooltip title={tooltip}>
            <QueryBuilderIcon style={{ color: (colors as any)[color][500] }} />
        </Tooltip>
    );
};

export const NotAvailableIcon = ({ tooltip, color = "grey" }: { tooltip: string; color?: string }) => {
    return (
        <Tooltip title={tooltip}>
            <BlockIcon style={{ color: (colors as any)[color][500] }} />
        </Tooltip>
    );
};

export const FailedIcon = ({ tooltip, color = "red" }: { tooltip: React.ReactNode; color?: string }) => {
    return (
        <Tooltip title={tooltip}>
            <ErrorIcon style={{ color: (colors as any)[color][500] }} />
        </Tooltip>
    );
};
