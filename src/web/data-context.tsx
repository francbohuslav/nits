import React = require("react");
import { useState } from "react";
import ajax from "./ajax";
import { IUserDataResponse } from "../common/ajax-interfaces";

interface IDataContextProps {
    children: any;
}
export interface IDataContextValue {
    isLoading: boolean;
    name: string;
}

export const DataContext = React.createContext<IDataContextValue>(null);

export const DataProvider = (props: IDataContextProps) => {
    const [isLoading, setLoading] = useState<boolean>(false);
    const [name, setName] = useState<string>(null);

    const loadName = async () => {
        setLoading(true);
        const userData = await ajax.get<IUserDataResponse>("/server/get-user-data");
        setName(userData.name);
        setLoading(false);
    };

    if (!isLoading && name === null) {
        console.log("First load");
        loadName();
    }

    //console.log("DataProvider");
    return <DataContext.Provider value={{ isLoading, name }}>{props.children}</DataContext.Provider>;
};
