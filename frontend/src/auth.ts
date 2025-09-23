import { api } from './api';
import { User } from './types';

export class AuthManager {
    private currentUser: User | null = null;

    async getCurrentUser(): Promise<User | null> {
        if (!api.isAuthenticated()) {
            return null;
        }

        if (!this.currentUser) {
            try {
                this.currentUser = await api.getProfile();
            } catch (error) {
                console.error('Failed to get current user:', error);
                api.logout();
                return null;
            }
        }

        return this.currentUser;
    }

    async login(username: string, password: string): Promise<User> {
        const { user } = await api.login({ username, password });
        this.currentUser = user;
        return user;
    }

    async register(username: string, email: string, password: string, firstName?: string, lastName?: string): Promise<User> {
        const { user } = await api.register({ username, email, password, firstName, lastName });
        this.currentUser = user;
        return user;
    }

    logout(): void {
        api.logout();
        this.currentUser = null;
    }

    isAuthenticated(): boolean {
        return api.isAuthenticated();
    }
}

export const auth = new AuthManager();