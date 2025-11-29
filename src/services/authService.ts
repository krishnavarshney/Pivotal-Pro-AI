import { User } from '../utils/types';

const API_BASE_URL = 'http://localhost:3000'; // Your NestJS backend URL
// const TOKEN_KEY = 'pivotalPro_jwtToken'; // No longer needed as token is in HTTP-only cookie

// Helper to store and retrieve JWT token - no longer needed as token is in HTTP-only cookie
// const saveToken = (token: string) => {
//     localStorage.setItem(TOKEN_KEY, token);
// };

export const getToken = (): string | null => {
    // Token is now in HTTP-only cookie, so frontend cannot directly access it
    return null;
};

export const removeToken = (): void => {
    // Token is in HTTP-only cookie, so no need to remove from localStorage
    // localStorage.removeItem(TOKEN_KEY);
    // We will rely on the backend to clear the cookie on logout
};

// --- API FUNCTIONS ---

export const login = async (email: string, password: string): Promise<{ user: User }> => {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
        credentials: 'include',
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Login failed');
    }

    // Token is now set as an HTTP-only cookie by the backend, so no need to save it here
    // For now, we'll return a placeholder user
    return { user: { id: 'temp', email, name: 'User', role: 'USER', initials: 'U' } };
};

export const signup = async (name: string, email: string, password: string): Promise<{ user: User }> => {
    const response = await fetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name, email, password }),
        credentials: 'include',
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Signup failed');
    }

    // Token is now set as an HTTP-only cookie by the backend, so no need to save it here
    return { user: { id: 'temp', email, name, role: 'USER', initials: name.split(' ').map(n => n[0]).join('').toUpperCase() } };
};

export const logout = async (): Promise<void> => {
    // Invalidate the cookie on the backend
    await fetch(`${API_BASE_URL}/auth/logout`, {
        method: 'POST',
        credentials: 'include',
    });
    // No need to remove token from localStorage as it's in HTTP-only cookie
    // localStorage.removeItem('pivotalProActivePageId'); // This should be handled elsewhere if still needed
};

export const getMe = async (): Promise<User> => {
    // No need to get token from localStorage as it's in HTTP-only cookie
    // The backend will automatically read the cookie

    const response = await fetch(`${API_BASE_URL}/auth/profile`, {
        method: 'GET',
        headers: {
            // No Authorization header needed as token is sent via HTTP-only cookie
        },
        credentials: 'include',
    });

    if (!response.ok) {
        const errorData = await response.json();
        console.error("Failed to fetch user profile:", errorData);
        throw new Error(errorData.message || 'Failed to fetch user profile');
    }

    const user = await response.json();
    return user;
};

// Placeholder for other user management functions, will be implemented as needed
export const getUsers = async (): Promise<User[]> => {
    // This would typically be an admin-only endpoint
    return [];
};

export const updateUser = async (userId: string, updates: Partial<User>): Promise<User> => {
    // Implementation for updating user details
    throw new Error("Not implemented");
};

export const deleteUser = async (userId: string): Promise<void> => {
    // Implementation for deleting a user
    throw new Error("Not implemented");
};
