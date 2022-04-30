import { Snackbar } from "@material-ui/core";
import MuiAlert from "@material-ui/lab/Alert";
import React, { useEffect, useState } from "react";

export type IToastSeverity = "success" | "warning" | "error";
export interface IToastProps {
    message?: string;
    severity?: IToastSeverity;
    time: Date;
}

export const Toast = (props: IToastProps) => {
    const [open, setOpen] = useState(false);
    const [lastViewTime, setLastViewTime] = useState(new Date());
    useEffect(() => {
        if (props.message && lastViewTime.getTime() != props.time.getTime()) {
            setOpen(true);
            setLastViewTime(props.time);
        }
    }, [props]);

    const handleClose = () => setOpen(false);

    return (
        <Snackbar open={open} autoHideDuration={3000} anchorOrigin={{ horizontal: "center", vertical: "top" }} onClose={handleClose}>
            <MuiAlert elevation={3} variant="filled" severity={props.severity}>
                {props.message}
            </MuiAlert>
        </Snackbar>
    );
};
