import { IThisApp } from "./app-provider";
import loginProvider from "./login-provider";

class Ajax {
    public async post<T>(url: string, data = {}, throwException: boolean = false): Promise<T> {
        const response = await fetch(url, {
            method: "POST",
            cache: "no-cache",
            headers: {
                "Content-Type": "application/json",
                LoginToken: loginProvider.getToken(),
            },
            body: JSON.stringify(data),
        });
        return await this.processResult<T>(response, throwException);
    }

    public async postFormData<T>(url: string, formData: FormData): Promise<T> {
        return new Promise((resolve) => {
            const request = new XMLHttpRequest();
            request.open("POST", url);
            request.setRequestHeader("LoginToken", loginProvider.getToken());
            request.onreadystatechange = function () {
                if (request.readyState === 4) {
                    resolve(request.response);
                }
            };
            request.send(formData);
        });
    }

    public async get<T>(url: string): Promise<T> {
        const response = await fetch(url, {
            method: "GET",
            cache: "no-cache",
            headers: {
                "Content-Type": "application/json",
                LoginToken: loginProvider.getToken(),
            },
        });
        return await this.processResult<T>(response, false);
    }

    private goToLogin() {
        loginProvider.logout();
        location.reload();
    }

    private async processResult<T>(response: any, throwException: boolean) {
        const thisApp: IThisApp = (window as any).thisApp;
        if (!response.ok) {
            if (response.status == 401) {
                this.goToLogin();
                return null;
            }
            thisApp.alert(response.statusText);
            if (throwException) {
                throw response.statusText;
            }
            return null;
        }
        const json = await response.json();
        if (json.result === "error") {
            thisApp.alert(json);
            if (throwException) {
                throw json;
            }
            return null;
        }
        return json as T;
    }
}

export default new Ajax();
