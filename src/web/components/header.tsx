import { Typography } from "@material-ui/core";
import React, { PropsWithChildren } from "react";

export interface IHeaderProps {
    header: string;
}

export const Header = (props: PropsWithChildren<IHeaderProps>) => {
    return (
        <>
            <Typography variant="h4" align="center" style={{ marginBottom: "1em" }}>
                {props.header}
            </Typography>
            {props.children}
        </>
    );
};
