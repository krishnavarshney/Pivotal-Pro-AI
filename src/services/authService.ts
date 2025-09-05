import { User } from '../utils/types';

// --- MOCK DATABASE ---
const MOCK_USERS_KEY = 'pivotalPro_mockUsers';
const MOCK_TOKEN_KEY = 'pivotalPro_mockToken';

const getMockUsers = (): User[] => {
    try {
        const users = localStorage.getItem(MOCK_USERS_KEY);
        return users ? JSON.parse(users) : [];
    } catch {
        return [];
    }
};

const saveMockUsers = (users: User[]) => {
    localStorage.setItem(MOCK_USERS_KEY, JSON.stringify(users));
};

// Helper to generate a random date in the last N days
const randomDate = (daysAgo: number): Date => {
    const now = new Date();
    const past = new Date(now.getTime() - Math.floor(Math.random() * daysAgo * 24 * 60 * 60 * 1000));
    return past;
};

// Initialize with a default admin user if none exist
if (getMockUsers().length === 0) {
    const now = new Date();
    const yesterday = new Date(new Date().setDate(now.getDate() - 1));

    const initialUsers: User[] = [
        { id: 'user_1', name: 'Admin User', email: 'admin@pivotalpro.ai', password: 'admin', role: 'ADMIN', initials: 'AU', createdAt: new Date(new Date().setDate(now.getDate() - 35)).toISOString(), lastLogin: now.toISOString() },
        { id: 'user_2', name: 'Demo User', email: 'krishna@pivotalpro.ai', password: 'krishna', role: 'USER', initials: 'DU', createdAt: yesterday.toISOString(), lastLogin: yesterday.toISOString() }
    ];
    
    // Add more mock users for better dashboard visuals
    const sampleNames = ["Olivia Martin", "Jackson Lee", "Isabella Nguyen", "William Kim", "Sofia Davis", "Liam Rodriguez", "Ava Garcia", "Noah Martinez", "Emma Brown", "Lucas Miller", "Chloe Wilson", "Mason Moore", "Harper Taylor", "Ethan Anderson", "Evelyn Thomas"];
    
    for (let i = 0; i < 15; i++) {
        const name = sampleNames[i];
        const email = `${name.toLowerCase().replace(' ', '.')}@example.com`;
        const initials = name.split(' ').map(n => n[0]).join('').toUpperCase();
        const createdAtDate = randomDate(30);
        const lastLoginDate = new Date(createdAtDate.getTime() + Math.random() * (new Date().getTime() - createdAtDate.getTime()));
        
        initialUsers.push({
            id: `user_${i + 3}`,
            name,
            email,
            password: 'password123',
            role: i % 5 === 0 ? 'ADMIN' : 'USER', // Add a few more admins
            initials,
            createdAt: createdAtDate.toISOString(),
            lastLogin: lastLoginDate.toISOString()
        });
    }

    saveMockUsers(initialUsers);
}

// --- MOCK JWT ---
const createToken = (user: User): string => {
    const payload = { userId: user.id, email: user.email, role: user.role, name: user.name, initials: user.initials };
    return `mock-jwt-token.${btoa(JSON.stringify(payload))}`;
};

const decodeToken = (token: string): User | null => {
    try {
        const payloadB64 = token.split('.')[1];
        if (!payloadB64) return null;
        const payload = JSON.parse(atob(payloadB64));
        return {
            id: payload.userId,
            email: payload.email,
            role: payload.role,
            name: payload.name,
            initials: payload.initials,
            password: '' // Don't expose password
        };
    } catch (e) {
        return null;
    }
};

// --- MOCK API FUNCTIONS ---
const simulateDelay = (ms: number) => new Promise(res => setTimeout(res, ms));

export const login = async (email: string, password: string): Promise<{ user: User, token: string }> => {
    await simulateDelay(500);
    const users = getMockUsers();
    const userIndex = users.findIndex(u => u.email === email && u.password === password);
    if (userIndex > -1) {
        const user = users[userIndex];
        users[userIndex].lastLogin = new Date().toISOString();
        saveMockUsers(users);
        const token = createToken(user);
        localStorage.setItem(MOCK_TOKEN_KEY, token);
        return { user, token };
    }
    throw new Error("Invalid email or password");
};

export const signup = async (name: string, email: string, password: string): Promise<{ user: User, token: string }> => {
    await simulateDelay(500);
    const users = getMockUsers();
    if (users.some(u => u.email === email)) {
        throw new Error("An account with this email already exists.");
    }
    const initials = name.split(' ').map(n => n[0]).join('').toUpperCase();
    const now = new Date().toISOString();
    const newUser: User = {
        id: `user_${Date.now()}`,
        name,
        email,
        password,
        role: 'USER',
        initials,
        createdAt: now,
        lastLogin: now,
    };
    users.push(newUser);
    saveMockUsers(users);
    const token = createToken(newUser);
    localStorage.setItem(MOCK_TOKEN_KEY, token);
    return { user: newUser, token };
};

export const logout = (): void => {
    localStorage.removeItem(MOCK_TOKEN_KEY);
    localStorage.removeItem('pivotalProActivePageId');
};

export const getToken = (): string | null => {
    return localStorage.getItem(MOCK_TOKEN_KEY);
};

export const getMe = async (): Promise<User> => {
    await simulateDelay(100);
    const token = getToken();
    if (token) {
        const decodedUser = decodeToken(token);
        const users = getMockUsers();
        const fullUser = users.find(u => u.id === decodedUser?.id);
        if (fullUser) {
            return { ...fullUser, password: '' }; // Ensure password is not returned
        }
    }
    throw new Error("Not authenticated");
};

export const getUsers = async (): Promise<User[]> => {
    await simulateDelay(300);
    const users = getMockUsers();
    return users.map(u => ({ ...u, password: '' })); // Exclude passwords
};

export const updateUser = async (userId: string, updates: Partial<User>): Promise<User> => {
    await simulateDelay(300);
    const users = getMockUsers();
    const userIndex = users.findIndex(u => u.id === userId);
    if (userIndex === -1) throw new Error("User not found");
    
    // Prevent password from being updated this way
    const { password, ...safeUpdates } = updates;
    
    const updatedUser = { ...users[userIndex], ...safeUpdates };
    users[userIndex] = updatedUser;
    saveMockUsers(users);
    return { ...updatedUser, password: '' };
};

export const deleteUser = async (userId: string): Promise<void> => {
    await simulateDelay(300);
    let users = getMockUsers();
    const initialLength = users.length;
    users = users.filter(u => u.id !== userId);
    if (users.length === initialLength) throw new Error("User not found");
    saveMockUsers(users);
};
