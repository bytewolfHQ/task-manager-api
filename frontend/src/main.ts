import './style.css';
import { LoginForm, TaskDashboard } from './components';
import { auth } from './auth';

class App {
    private container: HTMLElement;

    constructor() {
        this.container = document.getElementById('app')!;
        this.init();
    }

    private async init(): Promise<void> {
        // Show loading state
        this.container.innerHTML = '<div class="loading">Loading...</div>';

        // Check if user is already authenticated
        try {
            const user = await auth.getCurrentUser();

            if (user) {
                this.showDashboard();
            } else {
                this.showLogin();
            }
        } catch (error) {
            console.error('Failed to check authentication:', error);
            this.showLogin();
        }
    }

    private showLogin(): void {
        const loginForm = new LoginForm(() => {
            this.showDashboard();
        });

        this.container.innerHTML = '';
        this.container.appendChild(loginForm.getElement());
    }

    private showDashboard(): void {
        const dashboard = new TaskDashboard(() => {
            this.showLogin();
        });

        this.container.innerHTML = '';
        this.container.appendChild(dashboard.getElement());
    }
}

// Start the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new App();
});
