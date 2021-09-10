
export interface ILoginRequest {
    accessCode1: string;
    accessCode2: string;
}

export interface ILoginResponse {
    loginToken: string;
    message?: string;
}