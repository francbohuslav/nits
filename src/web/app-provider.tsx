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
    const [alert, setAlert] = useState<IAlertProps>({});
    const [toast, setToast] = useState<IToastProps>({});
    if (firstRun) {
        (window as any).thisApp = {
            alert(error: IAlertProps | string) {
                if (typeof error === "object") {
                    setAlert(error);
                } else {
                    setAlert({ message: error });
                }
            },
            toast(message: string, severity: IToastSeverity) {
                setToast({ message, severity });
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
