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
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    const revalidate = useCallback(async () => {
        try {
            const currentUser = await authService.getMe();
            setUser(currentUser);
            setIsAuthenticated(true);
        } catch (error) {
            // User is not authenticated or token is invalid, clear state
            logout();
        }
        setIsLoading(false);
    }, []);

    useEffect(() => {
        revalidate();
    }, [revalidate]);

    const login = async (email: string, password: string):Promise<void> => {
        const { user: loggedInUser } = await authService.login(email, password);
        setUser(loggedInUser);
        setIsAuthenticated(true);
    };

    const signup = async (name: string, email: string, password: string):Promise<void> => {
        const { user: newUser } = await authService.signup(name, email, password);
        setUser(newUser);
        setIsAuthenticated(true);
    };

    const logout = () => {
        authService.logout();
        setUser(null);
        setIsAuthenticated(false);
    };

    const value = {
        user,
        isAuthenticated,
        isLoading,
        login,
        signup,
        logout,
        revalidate,
        token: null,
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};
