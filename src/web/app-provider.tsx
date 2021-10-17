import React = require("react");
import { IAlertProps, Alert } from "./components/alert";
import { IToastProps, IToastSeverity, Toast } from "./components/toast";
import { useEffect, useState } from "react";
import { useHistory } from "react-router";
import { Router } from "./router";

interface IAppProviderProps {
    children: any;
}

export interface IThisApp {
    alert(error: IAlertProps | string): void;
    toast(message: string, severity?: IToastSeverity): void;
}

const firstRun = true;

export const AppProvider = (props: IAppProviderProps) => {
    const history = useHistory();
    const [alert, setAlert] = useState<IAlertProps>({ time: new Date() });
    const [toast, setToast] = useState<IToastProps>({ time: new Date() });
    if (firstRun) {
        (window as any).thisApp = {
            alert(error: IAlertProps | string) {
                if (typeof error === "object") {
                    setAlert({ ...error, time: new Date() });
                } else {
                    setAlert({ message: error, time: new Date() });
                }
            },
            toast(message: string, severity: IToastSeverity) {
                setToast({ message, severity, time: new Date() });
            },
        };
    }

    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const obj: any = {};
        Array.from(params.entries()).forEach((value) => (obj[value[0]] = value[1]));
        if (obj.error) {
            setAlert({
                ...obj,
                time: new Date(),
                onClose: () => {
                    history.push(Router.PageMain);
                },
            });
        }
    }, []);

    return (
        <div>
            {props.children}
            <Alert {...alert} />
            <Toast {...toast} />
        </div>
    );
};

export const thisApp: () => IThisApp = () => (window as any).thisApp;
