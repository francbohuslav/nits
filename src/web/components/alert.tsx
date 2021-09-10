import React = require("react");
import { useEffect, useState } from "react";
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogContentText,
    DialogActions,
    Button,
    Accordion,
    AccordionSummary,
    Typography,
    AccordionDetails,
} from "@material-ui/core";
import ExpandMoreIcon from "@material-ui/icons/ExpandMore";

export interface IAlertProps {
    message?: string;
    stack?: string;
    type?: string;
}
interface IAlertState {
    open: boolean;
    message?: string;
    stack?: string;
    type?: string;
}

export const Alert = (props: IAlertProps) => {
    const [state, setState] = useState<IAlertState>({
        open: false,
        message: "",
        stack: "",
    });
    useEffect(() => {
        if (props.message) {
            setState({ ...props, open: true });
        }
    }, [props]);

    const handleClose = () => setState({ open: false });
    const stack = typeof state.stack === "string" ? state.stack : JSON.stringify(state.stack, null, 2);

    return (
        <Dialog open={state.open}>
            <DialogTitle id="alert-dialog-title">Error</DialogTitle>
            <DialogContent>
                <DialogContentText id="alert-dialog-description">
                    {(() => {
                        return (
                            <Accordion>
                                <AccordionSummary expandIcon={stack && <ExpandMoreIcon />} aria-controls="panel1a-content" id="panel1a-header">
                                    <Typography>{state.message}</Typography>
                                </AccordionSummary>
                                {stack && (
                                    <AccordionDetails>
                                        <Typography>
                                            <pre>{stack}</pre>
                                        </Typography>
                                    </AccordionDetails>
                                )}
                            </Accordion>
                        );
                    })()}
                </DialogContentText>
            </DialogContent>
            <DialogActions>
                <Button onClick={handleClose} color="secondary" autoFocus>
                    Close
                </Button>
            </DialogActions>
        </Dialog>
    );
};
