import {
    Accordion,
    AccordionDetails,
    AccordionSummary,
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogContentText,
    DialogTitle,
    Typography,
} from "@material-ui/core";
import ExpandMoreIcon from "@material-ui/icons/ExpandMore";
import React, { useEffect, useState } from "react";

export interface IAlertProps {
    message?: string;
    stack?: string;
    additional?: any;
    time?: Date;
    onClose?: () => void;
}

export const Alert = (props: IAlertProps) => {
    const [open, setOpen] = useState(false);
    const [lastViewTime, setLastViewTime] = useState(new Date());
    useEffect(() => {
        if (props.message && lastViewTime.getTime() != props.time.getTime()) {
            setOpen(true);
            setLastViewTime(props.time);
        }
    }, [props]);

    const handleClose = () => {
        props.onClose && props.onClose();
        setOpen(false);
    };
    const stack = typeof props.stack === "string" ? props.stack : JSON.stringify(props.stack, null, 2);

    return (
        <Dialog open={open}>
            <DialogTitle id="alert-dialog-title">Chyba</DialogTitle>
            <DialogContent>
                <DialogContentText id="alert-dialog-description">
                    {(() => {
                        return (
                            <Accordion>
                                <AccordionSummary expandIcon={stack && <ExpandMoreIcon />} aria-controls="panel1a-content" id="panel1a-header">
                                    <Typography>{props.message}</Typography>
                                </AccordionSummary>
                                {stack && (
                                    <AccordionDetails>
                                        <Typography>
                                            <pre>{stack}</pre>
                                            {props.additional && <pre>{JSON.stringify(props.additional, null, 2)}</pre>}
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
                    Zavřít
                </Button>
            </DialogActions>
        </Dialog>
    );
};
