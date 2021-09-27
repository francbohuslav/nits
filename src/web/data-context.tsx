import React = require("react");
import { useState } from "react";
import { IUserData } from "../common/interfaces";
import { useAjax } from "./ajax";

interface IDataContextProps {
    children: any;
}
export interface IDataContextValue {
    isLoading: boolean;
    name: string;
    isJiraOk: boolean;
    isAdmin: boolean;
}

export const DataContext = React.createContext<IDataContextValue>(null);

export const DataProvider = (props: IDataContextProps) => {
    const [isLoading, setLoading] = useState<boolean>(false);
    const [userData, setUserData] = useState<IUserData>(null);
    const ajax = useAjax();

    const loadUserData = async () => {
        setLoading(true);
        const res = await ajax.get<IUserData>("/server/get-user-data");
        if (res.isOk) {
            setUserData(res.data);
        }
        setLoading(false);
    };

    if (!isLoading && userData === null) {
        console.log("First load");
        loadUserData();
    }

    //console.log("DataProvider");
    return (
        <DataContext.Provider value={{ isLoading, name: userData?.name, isJiraOk: !!userData?.jiraAccountId, isAdmin: userData?.uid == "12-8835-1" }}>
            {props.children}
        </DataContext.Provider>
    );
};
