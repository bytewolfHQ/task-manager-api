export interface User {
    id: number;
    username: string;
    email: string;
    firstname?: string;
    lastname?: string;
    roles: string[];
    createdAt?: string;
    updatedAt?: string;
}

export interface Task {
    id: number;
    title: string;
    description?: string;
    status: string;
    dueDate?: string;
    createdAt: string;
    updatedAt?: string;
    owner: {
        id: number;
        username: string;
    };
}

export interface TaskCreateRequest {
    title: string;
    description?: string;
    status: string;
    priority: string;
    dueDate?: string;
}

export interface LoginRequest {
    username: string;
    password: string;
}

export interface RegisterRequest {
    username: string;
    email: string;
    password: string;
    firstName?: string;
    lastName?: string;
}

export interface ApiResponse<T> {
    message?: string;
    data?: T;
    error?: string;
    details?: string[];
}

export interface PaginatedResponse<T> {
    data: T[];
    meta: {
        total: number;
        page: number;
        limit: number;
        pages: number;
    };
}