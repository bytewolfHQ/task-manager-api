import axios, { AxiosInstance, AxiosResponse } from 'axios';
import { User, Task, TaskCreateRequest, LoginRequest, RegisterRequest, ApiResponse, PaginatedResponse } from './types';

declare const __API_BASE_URL__: string;

class ApiClient {
    private client: AxiosInstance;

    constructor() {
        this.client = axios.create({
            baseURL: __API_BASE_URL__,
            headers: {
                'Content-Type': 'application/json'
            }
        });

        // Add token to requests if available
        this.client.interceptors.request.use((config) => {
            const token = localStorage.getItem('jwt_token');
            if (token) {
                config.headers.Authorization = `Bearer ${token}`;
            }
            return config;
        });

        // Handle 401 responses (token expired)
        this.client.interceptors.response.use(
            (response) => response,
            (error) => {
                if (error.response?.status === 401) {
                    this.logout();
                    window.location.reload();
                }
                return Promise.reject(error);
            }
        );
    }

    // Auth methods
    async login(credentials: LoginRequest): Promise<{ user: User; token: string }> {
        const response: AxiosResponse<any> =
            await this.client.post('/login', credentials);

        const user = response.data.user;
        const token = response.data.token;

        if (token && user) {
            localStorage.setItem('jwt_token', token);
            return { user, token };
        }
        throw new Error('Invalid login response');
    }

    async register(data: RegisterRequest): Promise<{ user: User; token: string }> {
        const response: AxiosResponse<any> =
            await this.client.post('/register', data);

        const user = response.data.user;
        const token = response.data.token;

        if (token && user) {
            localStorage.setItem('jwt_token', token);
            return { user, token };
        }
        throw new Error('Invalid registration response');
    }

    async getProfile(): Promise<User> {
        const response: AxiosResponse<ApiResponse<User>> =
            await this.client.get('/profile');

        if (response.data.user) {
            return response.data.user;
        }
        throw new Error('Invalid profile response');
    }

    logout(): void {
        localStorage.removeItem('jwt_token');
    }

    isAuthenticated(): boolean {
        return !!localStorage.getItem('jwt_token');
    }

    // Task methods
    async getTasks(params?: {
        page?: number;
        limit?: number;
        status?: string;
        priority?: string;
    }): Promise<PaginatedResponse<Task>> {
        const response: AxiosResponse<PaginatedResponse<Task>> =
            await this.client.get('/tasks', { params });
        return response.data;
    }

    async getTask(id: number): Promise<Task> {
        const response: AxiosResponse<ApiResponse<Task>> =
            await this.client.get(`/tasks/${id}`);

        if (response.data.data) {
            return response.data.data;
        }
        throw new Error('Task not found');
    }

    async createTask(task: TaskCreateRequest): Promise<Task> {
        const response: AxiosResponse<ApiResponse<Task>> =
            await this.client.post('/tasks', task);

        if (response.data.data) {
            return response.data.data;
        }
        throw new Error('Failed to create task');
    }

    async updateTask(id: number, updates: Partial<TaskCreateRequest>): Promise<Task> {
        const response: AxiosResponse<ApiResponse<Task>> =
            await this.client.put(`/tasks/${id}`, updates);

        if (response.data.data) {
            return response.data.data;
        }
        throw new Error('Failed to update task');
    }

    async deleteTask(id: number): Promise<void> {
        await this.client.delete(`/tasks/${id}`);
    }
}

export const api = new ApiClient();