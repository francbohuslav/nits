import { useHistory } from "react-router";
import { IBaseResponse } from "../common/ajax-interfaces";
import { thisApp } from "./app-provider";

class Ajax {
    constructor(private history: any) {}

    public async post<T>(url: string, data = {}, throwException: boolean = false): Promise<IBaseResponse<T>> {
        const response = await fetch(url, {
            method: "POST",
            cache: "no-cache",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(data),
        });
        return await this.processResult<T>(response, throwException);
    }

    public async postFormData<T>(url: string, formData: FormData): Promise<IBaseResponse<T>> {
        return new Promise((resolve) => {
            const request = new XMLHttpRequest();
            request.open("POST", url);
            request.onreadystatechange = function () {
                if (request.readyState === 4) {
                    resolve(request.response);
                }
            };
            request.send(formData);
        });
    }

    public async get<T>(url: string): Promise<IBaseResponse<T>> {
        const response = await fetch(url, {
            method: "GET",
            cache: "no-cache",
            headers: {
                "Content-Type": "application/json",
            },
        });
        return await this.processResult<T>(response, false);
    }

    private goToLogin() {
        this.history.push("/");
    }

    private async processResult<T>(response: any, throwException: boolean): Promise<IBaseResponse<T>> {
        if (!response.ok) {
            if (response.status == 401) {
                this.goToLogin();
                return null;
            }
        }
        const json: IBaseResponse<T> = await response.json();
        json.isOk = response.ok;
        if (!json.isOk) {
            thisApp().alert({ ...json, time: new Date() });
            if (throwException) {
                throw json;
            }
        }
        return json;
    }
}

export const useAjax = () => {
    const history = useHistory();
    return new Ajax(history);
};
