
import { Task, TaskCreateRequest } from './types';
import { api } from './api';
import { auth } from './auth';

export class LoginForm {
    private element: HTMLElement;

    constructor(private onLogin: () => void) {
        this.element = this.createElement();
    }

    private createElement(): HTMLElement {
        const form = document.createElement('div');
        form.className = 'login-form';
        form.innerHTML = `
      <div class="form-container">
        <h2>Login to Task Manager</h2>
        <form id="loginForm">
          <div class="form-group">
            <label for="username">Username</label>
            <input type="text" id="username" required>
          </div>
          <div class="form-group">
            <label for="password">Password</label>
            <input type="password" id="password" required>
          </div>
          <button type="submit" class="btn primary">Login</button>
          <div class="error-message" id="loginError"></div>
        </form>
        <p>
          Don't have an account? 
          <a href="#" id="showRegister">Register here</a>
        </p>
      </div>
    `;

        const loginForm = form.querySelector('#loginForm') as HTMLFormElement;
        const errorDiv = form.querySelector('#loginError') as HTMLElement;
        const showRegisterLink = form.querySelector('#showRegister') as HTMLElement;

        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const username = (form.querySelector('#username') as HTMLInputElement).value;
            const password = (form.querySelector('#password') as HTMLInputElement).value;

            try {
                await auth.login(username, password);
                console.log('Login successful, calling onLogin callback');
                this.onLogin();
            } catch (error: any) {
                console.error('Login error:', error);
                console.log('Error response:', error.response);
                errorDiv.textContent = error.response?.data?.error || 'Login failed';
                errorDiv.style.display = 'block';
            }
        });

        showRegisterLink.addEventListener('click', (e) => {
            e.preventDefault();
            this.showRegisterForm();
        });

        return form;
    }

    private showRegisterForm(): void {
        const registerForm = new RegisterForm(() => this.onLogin());
        this.element.replaceWith(registerForm.getElement());
    }

    getElement(): HTMLElement {
        return this.element;
    }
}

export class RegisterForm {
    private element: HTMLElement;

    constructor(private onRegister: () => void) {
        this.element = this.createElement();
    }

    private createElement(): HTMLElement {
        const form = document.createElement('div');
        form.className = 'register-form';
        form.innerHTML = `
      <div class="form-container">
        <h2>Register for Task Manager</h2>
        <form id="registerForm">
          <div class="form-group">
            <label for="regUsername">Username</label>
            <input type="text" id="regUsername" required>
          </div>
          <div class="form-group">
            <label for="regEmail">Email</label>
            <input type="email" id="regEmail" required>
          </div>
          <div class="form-group">
            <label for="regPassword">Password</label>
            <input type="password" id="regPassword" required>
          </div>
          <div class="form-group">
            <label for="regFirstName">First Name</label>
            <input type="text" id="regFirstName">
          </div>
          <div class="form-group">
            <label for="regLastName">Last Name</label>
            <input type="text" id="regLastName">
          </div>
          <button type="submit" class="btn primary">Register</button>
          <div class="error-message" id="registerError"></div>
        </form>
        <p>
          Already have an account? 
          <a href="#" id="showLogin">Login here</a>
        </p>
      </div>
    `;

        const registerForm = form.querySelector('#registerForm') as HTMLFormElement;
        const errorDiv = form.querySelector('#registerError') as HTMLElement;
        const showLoginLink = form.querySelector('#showLogin') as HTMLElement;

        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const username = (form.querySelector('#regUsername') as HTMLInputElement).value;
            const email = (form.querySelector('#regEmail') as HTMLInputElement).value;
            const password = (form.querySelector('#regPassword') as HTMLInputElement).value;
            const firstName = (form.querySelector('#regFirstName') as HTMLInputElement).value;
            const lastName = (form.querySelector('#regLastName') as HTMLInputElement).value;

            try {
                await auth.register(username, email, password, firstName || undefined, lastName || undefined);
                this.onRegister();
            } catch (error: any) {
                errorDiv.textContent = error.response?.data?.error || 'Registration failed';
                errorDiv.style.display = 'block';
            }
        });

        showLoginLink.addEventListener('click', (e) => {
            e.preventDefault();
            const loginForm = new LoginForm(() => this.onRegister());
            this.element.replaceWith(loginForm.getElement());
        });

        return form;
    }

    getElement(): HTMLElement {
        return this.element;
    }
}

export class TaskDashboard {
    private element: HTMLElement;
    private tasks: Task[] = [];

    constructor(private onLogout: () => void) {
        this.element = this.createElement();
        this.setupEventListeners();
        this.loadTasks();
    }

    private createElement(): HTMLElement {
        const dashboard = document.createElement('div');
        dashboard.className = 'task-dashboard';
        dashboard.innerHTML = `
      <header class="dashboard-header">
        <h1>Task Manager</h1>
        <div class="header-actions">
          <button id="logoutBtn" class="btn secondary">Logout</button>
        </div>
      </header>

      <div class="dashboard-content">
        <div class="task-controls">
          <button id="addTaskBtn" class="btn primary">Add Task</button>
          <div class="filters">
            <select id="statusFilter">
              <option value="">All Status</option>
              <option value="todo">Todo</option>
              <option value="in-progress">In Progress</option>
              <option value="done">Done</option>
            </select>
            <select id="priorityFilter">
              <option value="">All Priority</option>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>
        </div>

        <div id="tasksList" class="tasks-list">
          <div class="loading">Loading tasks...</div>
        </div>
      </div>

      <div id="taskModal" class="modal" style="display: none;">
        <div class="modal-content">
          <span class="close">&times;</span>
          <h3 id="modalTitle">Add Task</h3>
          <form id="taskForm">
            <div class="form-group">
              <label for="taskTitle">Title</label>
              <input type="text" id="taskTitle" required>
            </div>
            <div class="form-group">
              <label for="taskDescription">Description</label>
              <textarea id="taskDescription"></textarea>
            </div>
            <div class="form-group">
              <label for="taskStatus">Status</label>
              <select id="taskStatus" required>
                <option value="todo">Todo</option>
                <option value="in-progress">In Progress</option>
                <option value="done">Done</option>
              </select>
            </div>
            <div class="form-group">
              <label for="taskPriority">Priority</label>
              <select id="taskPriority" required>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
            <div class="form-group">
              <label for="taskDueDate">Due Date</label>
              <input type="datetime-local" id="taskDueDate">
            </div>
            <div class="form-actions">
              <button type="submit" class="btn primary">Save Task</button>
              <button type="button" class="btn secondary" id="cancelTask">Cancel</button>
            </div>
          </form>
        </div>
      </div>
    `;

        return dashboard;
    }

    private setupEventListeners(): void {
        const logoutBtn = this.element.querySelector('#logoutBtn') as HTMLElement;
        const addTaskBtn = this.element.querySelector('#addTaskBtn') as HTMLElement;
        const modal = this.element.querySelector('#taskModal') as HTMLElement;
        const closeModal = this.element.querySelector('.close') as HTMLElement;
        const cancelBtn = this.element.querySelector('#cancelTask') as HTMLElement;
        const taskForm = this.element.querySelector('#taskForm') as HTMLFormElement;
        const statusFilter = this.element.querySelector('#statusFilter') as HTMLSelectElement;
        const priorityFilter = this.element.querySelector('#priorityFilter') as HTMLSelectElement;

        if (!logoutBtn || !addTaskBtn || !modal || !closeModal || !cancelBtn || !taskForm || !statusFilter || !priorityFilter) {
            console.error('Missing required DOM elements, aborting event listeners');
            return;
        }

        logoutBtn.addEventListener('click', () => {
            auth.logout();
            this.onLogout();
        });

        addTaskBtn.addEventListener('click', () => {
            this.showTaskModal();
        });

        closeModal.addEventListener('click', () => {
            modal.style.display = 'none';
        });

        cancelBtn.addEventListener('click', () => {
            modal.style.display = 'none';
        });

        taskForm.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleTaskSubmit();
        });

        statusFilter.addEventListener('change', () => this.loadTasks());
        priorityFilter.addEventListener('change', () => this.loadTasks());
    }

    private async loadTasks(): Promise<void> {
        const tasksList = this.element.querySelector('#tasksList') as HTMLElement;
        const statusFilter = this.element.querySelector('#statusFilter') as HTMLSelectElement;
        const priorityFilter = this.element.querySelector('#priorityFilter') as HTMLSelectElement;

        try {
            const params: any = {};
            if (statusFilter.value) params.status = statusFilter.value;
            if (priorityFilter.value) params.priority = priorityFilter.value;

            const response = await api.getTasks(params);
            this.tasks = response.data;
            this.renderTasks();
        } catch (error) {
            tasksList.innerHTML = '<div class="error">Failed to load tasks</div>';
        }
    }

    private renderTasks(): void {
        const tasksList = this.element.querySelector('#tasksList') as HTMLElement;

        if (this.tasks.length === 0) {
            tasksList.innerHTML = '<div class="no-tasks">No tasks found</div>';
            return;
        }

        const tasksHTML = this.tasks.map(task => `
      <div class="task-card ${task.status}" data-task-id="${task.id}">
        <div class="task-header">
          <h4>${task.title}</h4>
          <div class="task-priority priority-${task.priority}">${task.priority}</div>
        </div>
        ${task.description ? `<p class="task-description">${task.description}</p>` : ''}
        <div class="task-meta">
          <span class="task-status">${task.status}</span>
          ${task.dueDate ? `<span class="task-due">Due: ${new Date(task.dueDate).toLocaleDateString()}</span>` : ''}
        </div>
        <div class="task-actions">
          <button class="btn small" onclick="window.editTask(${task.id})">Edit</button>
          <button class="btn small danger" onclick="window.deleteTask(${task.id})">Delete</button>
        </div>
      </div>
    `).join('');

        tasksList.innerHTML = tasksHTML;

        // Add global functions for task actions
        (window as any).editTask = (id: number) => this.editTask(id);
        (window as any).deleteTask = (id: number) => this.deleteTask(id);
    }

    private showTaskModal(task?: Task): void {
        const modal = this.element.querySelector('#taskModal') as HTMLElement;
        const modalTitle = this.element.querySelector('#modalTitle') as HTMLElement;
        const form = this.element.querySelector('#taskForm') as HTMLFormElement;

        modalTitle.textContent = task ? 'Edit Task' : 'Add Task';

        if (task) {
            (this.element.querySelector('#taskTitle') as HTMLInputElement).value = task.title;
            (this.element.querySelector('#taskDescription') as HTMLTextAreaElement).value = task.description || '';
            (this.element.querySelector('#taskStatus') as HTMLSelectElement).value = task.status;
            (this.element.querySelector('#taskPriority') as HTMLSelectElement).value = task.priority;
            if (task.dueDate) {
                const dueDateInput = this.element.querySelector('#taskDueDate') as HTMLInputElement;
                const date = new Date(task.dueDate);
                dueDateInput.value = date.toISOString().slice(0, 16);
            }
            form.dataset.taskId = task.id.toString();
        } else {
            form.reset();
            delete form.dataset.taskId;
        }

        modal.style.display = 'block';
    }

    private async handleTaskSubmit(): Promise<void> {
        const form = this.element.querySelector('#taskForm') as HTMLFormElement;
        const modal = this.element.querySelector('#taskModal') as HTMLElement;

        const taskData: TaskCreateRequest = {
            title: (this.element.querySelector('#taskTitle') as HTMLInputElement).value,
            description: (this.element.querySelector('#taskDescription') as HTMLTextAreaElement).value || undefined,
            status: (this.element.querySelector('#taskStatus') as HTMLSelectElement).value,
            priority: (this.element.querySelector('#taskPriority') as HTMLSelectElement).value,
        };

        const dueDateInput = this.element.querySelector('#taskDueDate') as HTMLInputElement;
        if (dueDateInput.value) {
            taskData.dueDate = new Date(dueDateInput.value).toISOString();
        }

        try {
            if (form.dataset.taskId) {
                await api.updateTask(parseInt(form.dataset.taskId), taskData);
            } else {
                await api.createTask(taskData);
            }

            modal.style.display = 'none';
            await this.loadTasks();
        } catch (error: any) {
            alert(error.response?.data?.error || 'Failed to save task');
        }
    }

    private async editTask(id: number): Promise<void> {
        try {
            const task = await api.getTask(id);
            this.showTaskModal(task);
        } catch (error) {
            alert('Failed to load task');
        }
    }

    private async deleteTask(id: number): Promise<void> {
        if (confirm('Are you sure you want to delete this task?')) {
            try {
                await api.deleteTask(id);
                await this.loadTasks();
            } catch (error) {
                alert('Failed to delete task');
            }
        }
    }

    getElement(): HTMLElement {
        return this.element;
    }
}