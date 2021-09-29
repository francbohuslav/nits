import React = require("react");
import { useState } from "react";
import { useAjax } from "./ajax";
import { IUserPublicData } from "../common/ajax-interfaces";

interface IDataContextProps {
    children: any;
}
export interface IDataContextValue {
    isLoading: boolean;
    name: string;
    isJiraOk: boolean;
    isAdmin: boolean;
    notificationEmail: string;
}

export const DataContext = React.createContext<IDataContextValue>(null);

export const DataProvider = (props: IDataContextProps) => {
    const [isLoading, setLoading] = useState<boolean>(false);
    const [userData, setUserData] = useState<IUserPublicData>(null);
    const ajax = useAjax();

    const loadUserData = async () => {
        setLoading(true);
        const res = await ajax.get<IUserPublicData>("/server/get-user-public-data");
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
        <DataContext.Provider
            value={{
                isLoading,
                name: userData?.name,
                isJiraOk: !!userData?.jiraAccountId,
                isAdmin: userData?.isAdmin,
                notificationEmail: userData?.notificationEmail,
            }}
        >
            {props.children}
        </DataContext.Provider>
    );
};
