import { Dialog, DialogTitle, DialogContent, DialogContentText, Typography, DialogActions, Button } from "@material-ui/core";
import { makeStyles } from "@material-ui/styles";
import React = require("react");

const useStyles = makeStyles({
    img: {
        maxWidth: "100%",
    },
});

interface IInfoProps {
    open: boolean;
    onClose(): void;
}

export const Info = (props: IInfoProps) => {
    const classes = useStyles();
    return (
        <Dialog open={props.open} onClose={() => props.onClose()}>
            <DialogTitle id="alert-dialog-title">Info</DialogTitle>
            <DialogContent>
                <DialogContentText id="alert-dialog-description">
                    <Typography variant="body1" paragraph>
                        <img className={classes.img} src="/images/main-page-image.png" />
                    </Typography>
                    <Typography variant="body1" align="left" paragraph>
                        Tato aplikace propojuje zajišťuje automatické propisy výkazů z JIRA do WTM. K propisu dochází každý den v noci, přičemž zpracovány jsou
                        výkazy vždy 7 dní zpětně.
                    </Typography>
                    <Typography variant="body1" align="left" paragraph>
                        Existující položky ve WTM jsou mazány a přepsány novými údaji, nejsou však ovlivněny výkazy, které jsou ve WTM zadané mimo projekty JIRA
                        (např. dovolené, pohovory apod).
                    </Typography>
                    <Typography variant="body1" align="left" paragraph>
                        Výkazy JIRA jsou ve WTM agregovány do 1-2 bloků a propojeny s definovaným artefaktem. V případě konfliktu výkazu nebo chyby je uživatel
                        notifikován e-mailem.
                    </Typography>
                </DialogContentText>
            </DialogContent>
            <DialogActions>
                <Button onClick={() => props.onClose()} color="primary" autoFocus>
                    Zavřít
                </Button>
            </DialogActions>
        </Dialog>
    );
};
