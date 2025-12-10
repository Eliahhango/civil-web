// Admin Panel - Runs on Port 5000
const API_BASE = window.location.origin;

let currentUser = null;
let authToken = null;

// Check if already logged in
window.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('admin_token');
    const user = localStorage.getItem('admin_user');
    
    if (token && user) {
        try {
            authToken = token;
            currentUser = JSON.parse(user);
            if (currentUser.role === 'admin') {
                showAdminPanel();
            } else {
                showLogin();
            }
        } catch (e) {
            showLogin();
        }
    } else {
        showLogin();
    }
});

function showLogin() {
    document.body.innerHTML = `
        <div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-white dark:from-gray-900 dark:to-gray-800">
            <div class="max-w-md w-full bg-white dark:bg-gray-800 p-8 rounded-xl shadow-lg">
                <div class="text-center mb-8">
                    <div class="w-20 h-20 bg-orange-600 rounded-lg flex items-center justify-center mx-auto mb-4">
                        <span class="text-white font-bold text-4xl">A</span>
                    </div>
                    <h2 class="text-3xl font-bold text-gray-900 dark:text-white">Admin Login</h2>
                    <p class="text-gray-600 dark:text-gray-400 mt-2">Access the admin panel</p>
                </div>
                <form id="loginForm" class="space-y-6">
                    <div id="errorMessage" class="hidden bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg"></div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Email</label>
                        <input type="email" id="email" required
                            class="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                            placeholder="admin@nexusengineering.co.tz">
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Password</label>
                        <input type="password" id="password" required
                            class="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                            placeholder="••••••••">
                    </div>
                    <button type="submit"
                        class="w-full bg-orange-600 hover:bg-orange-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors">
                        Login
                    </button>
                </form>
            </div>
        </div>
    `;
    
    document.getElementById('loginForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        const errorDiv = document.getElementById('errorMessage');
        
        try {
            const response = await fetch(`${API_BASE}/api/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });
            
            const data = await response.json();
            
            if (response.ok && data.user.role === 'admin') {
                authToken = data.token;
                currentUser = data.user;
                localStorage.setItem('admin_token', data.token);
                localStorage.setItem('admin_user', JSON.stringify(data.user));
                showAdminPanel();
            } else {
                errorDiv.textContent = data.error || 'Invalid credentials or not an admin';
                errorDiv.classList.remove('hidden');
            }
        } catch (error) {
            errorDiv.textContent = 'Login failed. Please try again.';
            errorDiv.classList.remove('hidden');
        }
    });
}

function logout() {
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_user');
    authToken = null;
    currentUser = null;
    showLogin();
}

async function apiCall(endpoint, options = {}) {
    const response = await fetch(`${API_BASE}${endpoint}`, {
        ...options,
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`,
            ...options.headers
        }
    });
    
    if (response.status === 401) {
        logout();
        return null;
    }
    
    return response.json();
}

function showAdminPanel() {
    document.body.innerHTML = `
        <div class="min-h-screen bg-gray-50 dark:bg-gray-900">
            <nav class="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div class="flex justify-between items-center py-4">
                        <div class="flex items-center space-x-3">
                            <div class="w-10 h-10 bg-orange-600 rounded-lg flex items-center justify-center">
                                <span class="text-white font-bold">A</span>
                            </div>
                            <h1 class="text-xl font-bold text-gray-900 dark:text-white">Admin Panel</h1>
                        </div>
                        <div class="flex items-center space-x-4">
                            <span class="text-sm text-gray-600 dark:text-gray-400">${currentUser.email}</span>
                            <button onclick="logout()" class="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-semibold">
                                Logout
                            </button>
                        </div>
                    </div>
                </div>
            </nav>
            <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div id="adminContent" class="space-y-6">
                    <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div class="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
                            <h3 class="text-sm font-medium text-gray-600 dark:text-gray-400">Total Projects</h3>
                            <p id="totalProjects" class="text-3xl font-bold text-gray-900 dark:text-white mt-2">-</p>
                        </div>
                        <div class="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
                            <h3 class="text-sm font-medium text-gray-600 dark:text-gray-400">Total Contacts</h3>
                            <p id="totalContacts" class="text-3xl font-bold text-gray-900 dark:text-white mt-2">-</p>
                        </div>
                        <div class="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
                            <h3 class="text-sm font-medium text-gray-600 dark:text-gray-400">Total Users</h3>
                            <p id="totalUsers" class="text-3xl font-bold text-gray-900 dark:text-white mt-2">-</p>
                        </div>
                        <div class="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
                            <h3 class="text-sm font-medium text-gray-600 dark:text-gray-400">Security Events</h3>
                            <p id="securityEvents" class="text-3xl font-bold text-gray-900 dark:text-white mt-2">-</p>
                        </div>
                    </div>
                    <div class="bg-white dark:bg-gray-800 rounded-lg shadow">
                        <div class="p-6 border-b border-gray-200 dark:border-gray-700">
                            <h2 class="text-xl font-bold text-gray-900 dark:text-white">Quick Actions</h2>
                        </div>
                        <div class="p-6">
                            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <a href="/admin/projects" class="block p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                                    <h3 class="font-semibold text-gray-900 dark:text-white">Manage Projects</h3>
                                    <p class="text-sm text-gray-600 dark:text-gray-400 mt-1">View and edit projects</p>
                                </a>
                                <a href="/admin/contacts" class="block p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                                    <h3 class="font-semibold text-gray-900 dark:text-white">View Contacts</h3>
                                    <p class="text-sm text-gray-600 dark:text-gray-400 mt-1">Manage contact submissions</p>
                                </a>
                                <a href="/admin/security" class="block p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                                    <h3 class="font-semibold text-gray-900 dark:text-white">Security Logs</h3>
                                    <p class="text-sm text-gray-600 dark:text-gray-400 mt-1">Monitor security events</p>
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    loadDashboardStats();
}

async function loadDashboardStats() {
    try {
        const [projects, contacts, users, security] = await Promise.all([
            apiCall('/api/projects'),
            apiCall('/api/contacts'),
            apiCall('/api/users'),
            apiCall('/api/security/stats')
        ]);
        
        if (projects) document.getElementById('totalProjects').textContent = projects.length || 0;
        if (contacts) document.getElementById('totalContacts').textContent = contacts.length || 0;
        if (users) document.getElementById('totalUsers').textContent = users.length || 0;
        if (security) document.getElementById('securityEvents').textContent = security.total || 0;
    } catch (error) {
        console.error('Error loading stats:', error);
    }
}

// Make logout available globally
window.logout = logout;

