export interface AuthProvider {
    signUp(email: string, password: string): Promise<void>;

    verifyEmail(code: string): Promise<void>;

    resendCode(): Promise<void>;

    login(email: string, password: string): Promise<void>;

    logout(): Promise<void>;
}
