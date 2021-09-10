import React = require("react");
import { useHistory } from "react-router-dom";
import loginProvider from "./login-provider";

interface ILoggedUserProps {
    children: any;
}

export const LoggedUser = (props: ILoggedUserProps) => {
    const history = useHistory();
    const isLogged = loginProvider.isLogged();
    if (!isLogged) {
        history.push("/");
    }
    return <div>{isLogged ? props.children : null}</div>;
};
