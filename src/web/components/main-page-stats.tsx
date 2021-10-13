import React = require("react");
import { useContext } from "react";
import { DataContext, IDataContextValue } from "../data-context";
import dateUtils from "../../common/date-utils";
import { Typography } from "@material-ui/core";

export const MainPageStats = () => {
    const { userData } = useContext<IDataContextValue>(DataContext);

    return (
        <Typography align="center">
            {userData?.lastSynchronization ? dateUtils.formatDateTime(userData.lastSynchronization) : "zatím nesynchronizováno"}
        </Typography>
    );
};
