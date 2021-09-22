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
}

export const DataContext = React.createContext<IDataContextValue>(null);

export const DataProvider = (props: IDataContextProps) => {
    const [isLoading, setLoading] = useState<boolean>(false);
    const [name, setName] = useState<string>(null);
    const ajax = useAjax();

    const loadName = async () => {
        setLoading(true);
        const res = await ajax.get<IUserData>("/server/get-user-data");
        if (res.isOk) {
            setName(res.data.name);
        }
        setLoading(false);
    };

    if (!isLoading && name === null) {
        console.log("First load");
        loadName();
    }

    //console.log("DataProvider");
    return <DataContext.Provider value={{ isLoading, name }}>{props.children}</DataContext.Provider>;
};
