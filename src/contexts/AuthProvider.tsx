import React, { createContext, useState, useContext, useEffect, useCallback, FC, ReactNode } from 'react';
import { User, AuthContextProps } from '../utils/types';
import * as authService from '../services/authService';

const AuthContext = createContext<AuthContextProps | null>(null);

export const useAuth = (): AuthContextProps => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

export const AuthProvider: FC<{ children: ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [token, setToken] = useState<string | null>(null);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    const revalidate = useCallback(async () => {
        const storedToken = authService.getToken();
        if (storedToken) {
            try {
                const currentUser = await authService.getMe();
                setUser(currentUser);
                setToken(storedToken);
                setIsAuthenticated(true);
            } catch (error) {
                // Token is invalid, clear state
                logout();
            }
        }
        setIsLoading(false);
    }, []);

    useEffect(() => {
        revalidate();
    }, [revalidate]);

    const login = async (email: string, password: string):Promise<void> => {
        const { user: loggedInUser, token: newToken } = await authService.login(email, password);
        setUser(loggedInUser);
        setToken(newToken);
        setIsAuthenticated(true);
    };

    const signup = async (name: string, email: string, password: string):Promise<void> => {
        const { user: newUser, token: newToken } = await authService.signup(name, email, password);
        setUser(newUser);
        setToken(newToken);
        setIsAuthenticated(true);
    };

    const logout = () => {
        authService.logout();
        setUser(null);
        setToken(null);
        setIsAuthenticated(false);
    };

    const value = {
        user,
        token,
        isAuthenticated,
        isLoading,
        login,
        signup,
        logout,
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};
