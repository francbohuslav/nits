import React = require("react");
import { IAlertProps, Alert } from "./components/alert";
import { IToastProps, IToastSeverity, Toast } from "./components/toast";
import { useState } from "react";

interface IAppProviderProps {
    children: any;
}

export interface IThisApp {
    alert(error: IAlertProps | string): void;
    toast(message: string, severity?: IToastSeverity): void;
}

const firstRun = true;

export const AppProvider = (props: IAppProviderProps) => {
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

    return (
        <div>
            {props.children}
            <Alert {...alert} />
            <Toast {...toast} />
        </div>
    );
};

export const thisApp: () => IThisApp = () => (window as any).thisApp;
