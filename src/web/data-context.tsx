import React = require("react");
import { useState } from "react";

interface IDataContextProps {
    children: any;
}
export interface IDataContextValue {
    isLoading: boolean;
}

export const DataContext = React.createContext<IDataContextValue>(null);

export const DataProvider = (props: IDataContextProps) => {
   // const router = new Router<ITicketTableQueryParams>(Router.PageMain, useHistory(), useLocation());
    const [isLoading, setLoading] = useState<boolean>(false);

  /*  const loadSomething = async () => {
        setLoading(true);
       
        setLoading(false);
    };*/
/*
    if (!isLoading && !ticketsData.tickets) {
        console.log("First load");
        loadTickets();
    }
*/
    //console.log("DataProvider");
    return (
        <DataContext.Provider value={{  isLoading }}>
            {props.children}
        </DataContext.Provider>
    );
};

