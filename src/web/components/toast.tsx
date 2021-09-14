import React = require("react");
import { useEffect, useState } from "react";
import { Snackbar } from "@material-ui/core";
import MuiAlert from "@material-ui/lab/Alert";

export type IToastSeverity = "success" | "warning" | "error";
export interface IToastProps {
    message?: string;
    severity?: IToastSeverity;
}
interface IToastState extends IToastProps {
    open: boolean;
    msToShow: number;
}

export const Toast = (props: IToastProps) => {
    const [state, setState] = useState<IToastState>({
        open: false,
        message: "",
        severity: "success",
        msToShow: 3000,
    });
    useEffect(() => {
        if (props.message) {
            setState({ ...state, ...props, open: true });
        }
    }, [props]);

    const handleClose = () => setState({ ...state, message: "", open: false });

    return (
        <Snackbar open={state.open} autoHideDuration={state.msToShow} anchorOrigin={{ horizontal: "center", vertical: "top" }} onClose={handleClose}>
            <MuiAlert elevation={3} variant="filled" severity={state.severity}>
                {state.message}
            </MuiAlert>
        </Snackbar>
    );
};
