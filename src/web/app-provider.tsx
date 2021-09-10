import React = require("react");
import { IAlertProps, Alert } from "./components/alert";
import { useState } from "react";

interface IAppProviderProps {
    children: any;
}

export interface IThisApp {
    alert(error: IAlertProps | string): void;
}

const firstRun = true;

export const AppProvider = (props: IAppProviderProps) => {
    const [alert, setAlert] = useState<IAlertProps>({});
    if (firstRun) {
        (window as any).thisApp = {
            alert(error: IAlertProps | string) {
                if (typeof error === "object") {
                    setAlert(error);
                } else {
                    setAlert({ message: error });
                }
            },
        };
    }

    return (
        <div>
            {props.children}
            <Alert {...alert} />
        </div>
    );
};
