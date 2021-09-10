import React = require("react");
import { Tooltip, Typography } from "@material-ui/core";

export const BigTooltip = (props: { title: NonNullable<React.ReactNode>; children: React.ReactElement }) => {
    return (
        <Tooltip placement="top" title={<Typography variant="body2">{props.title}</Typography>}>
            {props.children}
        </Tooltip>
    );
};
