import React, { useState } from "react";
import { IProjectConfigPublic, IUserPublicData } from "../common/interfaces";
import { useAjax } from "./ajax";

interface IDataContextProps {
    children: any;
}
export interface IDataContextValue {
    isLoading: boolean;
    userData: IUserPublicData;
    projectConfig: IProjectConfigPublic;
    isJiraOk: boolean;
}

export const DataContext = React.createContext<IDataContextValue>(null);

export const DataProvider = (props: IDataContextProps) => {
    const [isLoading, setLoading] = useState<boolean>(false);
    const [userData, setUserData] = useState<IUserPublicData>(null);
    const [projectConfig, setProjectConfig] = useState<IProjectConfigPublic>(null);
    const ajax = useAjax();

    const loadStartData = async () => {
        setLoading(true);
        const res = await ajax.get<IUserPublicData>("/server/get-user-public-data");
        const res2 = await ajax.get<IProjectConfigPublic>("/server/config");
        if (res.isOk) {
            setUserData(res.data);
        }
        if (res2.isOk) {
            setProjectConfig(res2.data);
        }
        setLoading(false);
    };

    if (!isLoading && userData === null) {
        console.log("First load");
        loadStartData();
    }

    //console.log("DataProvider");
    return (
        <DataContext.Provider
            value={{
                isLoading,
                userData,
                projectConfig,
                isJiraOk: !!userData?.jiraAccountId,
            }}
        >
            {props.children}
        </DataContext.Provider>
    );
};
