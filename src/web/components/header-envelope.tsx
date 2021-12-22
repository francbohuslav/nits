import { Tooltip } from "@material-ui/core";
import EmailIcon from "@material-ui/icons/Email";
import React = require("react");

export const HeaderEnvelope = ({ tooltip }: { tooltip: string }) => {
    return (
        <Tooltip title={tooltip}>
            <EmailIcon
                style={{
                    color: "rgb(124,124,124)",
                }}
            />
        </Tooltip>
    );
};
