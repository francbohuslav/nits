class LoginProvider {
    public login(loginToken: string) {
        localStorage.setItem("nits-loginToken", loginToken);
    }

    public getToken(): string {
        return localStorage.getItem("nits-loginToken");
    }

    public logout() {
        localStorage.removeItem("nits-loginToken");
    }

    public isLogged(): boolean {
        return !!localStorage.getItem("nits-loginToken");
    }
}

export default new LoginProvider();
