// Full Admin Panel - Complete functionality
const API_BASE = window.location.origin;
let authToken = null;
let currentUser = null;
let currentTab = 'dashboard';

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    checkAuth();
});

function checkAuth() {
    const token = localStorage.getItem('admin_token');
    const user = localStorage.getItem('admin_user');
    
    if (token && user) {
        try {
            authToken = token;
            currentUser = JSON.parse(user);
            if (currentUser.role === 'admin') {
                renderAdminPanel();
            } else {
                showLogin();
            }
        } catch (e) {
            showLogin();
        }
    } else {
        showLogin();
    }
}

function showLogin() {
    document.getElementById('app').innerHTML = `
        <div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-white dark:from-gray-900 dark:to-gray-800">
            <div class="max-w-md w-full bg-white dark:bg-gray-800 p-8 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
                <div class="text-center mb-8">
                    <div class="w-20 h-20 bg-orange-600 rounded-lg flex items-center justify-center mx-auto mb-4 shadow-lg">
                        <span class="text-white font-bold text-4xl">A</span>
                    </div>
                    <h2 class="text-3xl font-bold text-gray-900 dark:text-white">Admin Login</h2>
                    <p class="text-gray-600 dark:text-gray-400 mt-2">Access the admin control panel</p>
                </div>
                <form id="loginForm" class="space-y-6">
                    <div id="errorMessage" class="hidden bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-300 px-4 py-3 rounded-lg text-sm"></div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Email Address</label>
                        <input type="email" id="email" required
                            class="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                            placeholder="admin@nexusengineering.co.tz" value="admin@nexusengineering.co.tz">
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Password</label>
                        <input type="password" id="password" required
                            class="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                            placeholder="••••••••">
                    </div>
                    <button type="submit"
                        class="w-full bg-orange-600 hover:bg-orange-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors shadow-md">
                        Login to Admin Panel
                    </button>
                </form>
                <p class="mt-4 text-center text-xs text-gray-500 dark:text-gray-400">
                    Admin access only. Use port 5000 for admin panel.
                </p>
            </div>
        </div>
    `;
    
    document.getElementById('loginForm').addEventListener('submit', handleLogin);
}

async function handleLogin(e) {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const errorDiv = document.getElementById('errorMessage');
    errorDiv.classList.add('hidden');
    
    try {
        const response = await fetch(`${API_BASE}/api/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        
        const data = await response.json();
        
        if (response.ok && data.user && data.user.role === 'admin') {
            authToken = data.token;
            currentUser = data.user;
            localStorage.setItem('admin_token', data.token);
            localStorage.setItem('admin_user', JSON.stringify(data.user));
            renderAdminPanel();
        } else {
            errorDiv.textContent = data.error || 'Invalid credentials or not an admin account';
            errorDiv.classList.remove('hidden');
        }
    } catch (error) {
        errorDiv.textContent = 'Login failed. Please check your connection.';
        errorDiv.classList.remove('hidden');
    }
}

function logout() {
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_user');
    authToken = null;
    currentUser = null;
    showLogin();
}

async function apiCall(endpoint, options = {}) {
    try {
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
        
        return await response.json();
    } catch (error) {
        console.error('API call failed:', error);
        return null;
    }
}

function renderAdminPanel() {
    document.getElementById('app').innerHTML = `
        <div class="min-h-screen bg-gray-50 dark:bg-gray-900">
            <!-- Navbar -->
            <nav class="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm">
                <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div class="flex justify-between items-center py-4">
                        <div class="flex items-center space-x-3">
                            <div class="w-10 h-10 bg-orange-600 rounded-lg flex items-center justify-center shadow-md">
                                <span class="text-white font-bold text-lg">A</span>
                            </div>
                            <div>
                                <h1 class="text-xl font-bold text-gray-900 dark:text-white">Admin Panel</h1>
                                <p class="text-xs text-gray-500 dark:text-gray-400">Nexus Engineering Partners</p>
                            </div>
                        </div>
                        <div class="flex items-center space-x-4">
                            <span class="text-sm text-gray-600 dark:text-gray-400">${currentUser.email}</span>
                            <button onclick="logout()" class="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors">
                                Logout
                            </button>
                        </div>
                    </div>
                </div>
            </nav>
            
            <!-- Tabs -->
            <div class="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div class="flex space-x-4 overflow-x-auto">
                        <button onclick="switchTab('dashboard')" class="tab-btn px-6 py-4 font-medium border-b-2 transition-colors whitespace-nowrap" data-tab="dashboard">
                            Dashboard
                        </button>
                        <button onclick="switchTab('projects')" class="tab-btn px-6 py-4 font-medium border-b-2 transition-colors whitespace-nowrap" data-tab="projects">
                            Projects
                        </button>
                        <button onclick="switchTab('contacts')" class="tab-btn px-6 py-4 font-medium border-b-2 transition-colors whitespace-nowrap" data-tab="contacts">
                            Contacts
                        </button>
                        <button onclick="switchTab('users')" class="tab-btn px-6 py-4 font-medium border-b-2 transition-colors whitespace-nowrap" data-tab="users">
                            Users
                        </button>
                        <button onclick="switchTab('security')" class="tab-btn px-6 py-4 font-medium border-b-2 transition-colors whitespace-nowrap" data-tab="security">
                            Security
                        </button>
                    </div>
                </div>
            </div>
            
            <!-- Content -->
            <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div id="content"></div>
            </div>
        </div>
    `;
    
    updateTabStyles();
    loadContent();
}

function switchTab(tab) {
    currentTab = tab;
    updateTabStyles();
    loadContent();
}

function updateTabStyles() {
    document.querySelectorAll('.tab-btn').forEach(btn => {
        const tab = btn.getAttribute('data-tab');
        if (tab === currentTab) {
            btn.className = 'tab-btn px-6 py-4 font-medium border-b-2 border-orange-600 text-orange-600 transition-colors whitespace-nowrap';
        } else {
            btn.className = 'tab-btn px-6 py-4 font-medium border-b-2 border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 transition-colors whitespace-nowrap';
        }
    });
}

async function loadContent() {
    const contentDiv = document.getElementById('content');
    contentDiv.innerHTML = '<div class="text-center py-12"><div class="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div><p class="mt-4 text-gray-600 dark:text-gray-400">Loading...</p></div>';
    
    switch(currentTab) {
        case 'dashboard':
            await loadDashboard();
            break;
        case 'projects':
            await loadProjects();
            break;
        case 'contacts':
            await loadContacts();
            break;
        case 'users':
            await loadUsers();
            break;
        case 'security':
            await loadSecurity();
            break;
    }
}

async function loadDashboard() {
    try {
        const [projects, contacts, users, security] = await Promise.all([
            apiCall('/api/projects'),
            apiCall('/api/contacts'),
            apiCall('/api/users'),
            apiCall('/api/security/stats')
        ]);
        
        document.getElementById('content').innerHTML = `
            <div class="space-y-6">
                <h2 class="text-2xl font-bold text-gray-900 dark:text-white">Dashboard Overview</h2>
                <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div class="bg-white dark:bg-gray-800 p-6 rounded-lg shadow border border-gray-200 dark:border-gray-700">
                        <h3 class="text-sm font-medium text-gray-600 dark:text-gray-400">Total Projects</h3>
                        <p class="text-3xl font-bold text-gray-900 dark:text-white mt-2">${projects?.length || 0}</p>
                    </div>
                    <div class="bg-white dark:bg-gray-800 p-6 rounded-lg shadow border border-gray-200 dark:border-gray-700">
                        <h3 class="text-sm font-medium text-gray-600 dark:text-gray-400">Contact Messages</h3>
                        <p class="text-3xl font-bold text-gray-900 dark:text-white mt-2">${contacts?.length || 0}</p>
                    </div>
                    <div class="bg-white dark:bg-gray-800 p-6 rounded-lg shadow border border-gray-200 dark:border-gray-700">
                        <h3 class="text-sm font-medium text-gray-600 dark:text-gray-400">Total Users</h3>
                        <p class="text-3xl font-bold text-gray-900 dark:text-white mt-2">${users?.length || 0}</p>
                    </div>
                    <div class="bg-white dark:bg-gray-800 p-6 rounded-lg shadow border border-gray-200 dark:border-gray-700">
                        <h3 class="text-sm font-medium text-gray-600 dark:text-gray-400">Security Events</h3>
                        <p class="text-3xl font-bold text-gray-900 dark:text-white mt-2">${security?.total || 0}</p>
                    </div>
                </div>
            </div>
        `;
    } catch (error) {
        document.getElementById('content').innerHTML = '<div class="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-300 px-4 py-3 rounded-lg">Error loading dashboard</div>';
    }
}

async function loadProjects() {
    const projects = await apiCall('/api/projects');
    
    if (!projects) return;
    
    let html = `
        <div class="space-y-6">
            <div class="flex justify-between items-center">
                <h2 class="text-2xl font-bold text-gray-900 dark:text-white">Projects Management</h2>
                <button onclick="showAddProjectForm()" class="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg text-sm font-semibold">
                    Add Project
                </button>
            </div>
            <div id="projectsList" class="space-y-4">
    `;
    
    projects.forEach(project => {
        html += `
            <div class="bg-white dark:bg-gray-800 p-6 rounded-lg shadow border border-gray-200 dark:border-gray-700">
                <div class="flex justify-between items-start">
                    <div class="flex-1">
                        <h3 class="text-xl font-bold text-gray-900 dark:text-white">${project.title || 'Untitled'}</h3>
                        ${project.category ? `<span class="inline-block bg-orange-100 dark:bg-orange-900 text-orange-700 dark:text-orange-300 text-xs px-3 py-1 rounded-full mt-2">${project.category}</span>` : ''}
                        <p class="text-gray-600 dark:text-gray-400 mt-2 text-sm">${(project.description || '').substring(0, 150)}...</p>
                    </div>
                    <div class="flex space-x-2 ml-4">
                        <button onclick="editProject(${project.id})" class="text-orange-600 hover:text-orange-700 px-3 py-1 rounded text-sm font-medium">Edit</button>
                        <button onclick="deleteProject(${project.id})" class="text-red-600 hover:text-red-700 px-3 py-1 rounded text-sm font-medium">Delete</button>
                    </div>
                </div>
            </div>
        `;
    });
    
    html += '</div></div>';
    document.getElementById('content').innerHTML = html;
}

async function loadContacts() {
    const contacts = await apiCall('/api/contacts');
    
    if (!contacts) return;
    
    let html = `
        <div class="space-y-6">
            <h2 class="text-2xl font-bold text-gray-900 dark:text-white">Contact Messages</h2>
            <div class="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 overflow-hidden">
                <div class="overflow-x-auto">
                    <table class="w-full">
                        <thead class="bg-gray-50 dark:bg-gray-700">
                            <tr>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Name</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Email</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Date</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Status</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Actions</th>
                            </tr>
                        </thead>
                        <tbody class="divide-y divide-gray-200 dark:divide-gray-700">
    `;
    
    contacts.forEach(contact => {
        html += `
            <tr class="hover:bg-gray-50 dark:hover:bg-gray-700">
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">${contact.name || 'N/A'}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">${contact.email || 'N/A'}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">${new Date(contact.date || contact.createdAt).toLocaleDateString()}</td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <span class="px-2 py-1 text-xs font-semibold rounded-full ${contact.read ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300'}">
                        ${contact.read ? 'Read' : 'New'}
                    </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm">
                    <button onclick="viewContact('${contact.id}')" class="text-orange-600 hover:text-orange-700">View</button>
                </td>
            </tr>
        `;
    });
    
    html += '</tbody></table></div></div></div>';
    document.getElementById('content').innerHTML = html;
}

async function loadUsers() {
    const users = await apiCall('/api/users');
    
    if (!users) return;
    
    const clients = users.filter(u => u.role === 'client');
    
    let html = `
        <div class="space-y-6">
            <h2 class="text-2xl font-bold text-gray-900 dark:text-white">User Management</h2>
            <div class="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 overflow-hidden">
                <div class="overflow-x-auto">
                    <table class="w-full">
                        <thead class="bg-gray-50 dark:bg-gray-700">
                            <tr>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Username</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Email</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Role</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Created</th>
                            </tr>
                        </thead>
                        <tbody class="divide-y divide-gray-200 dark:divide-gray-700">
    `;
    
    users.forEach(user => {
        html += `
            <tr class="hover:bg-gray-50 dark:hover:bg-gray-700">
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">${user.username || 'N/A'}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">${user.email || 'N/A'}</td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <span class="px-2 py-1 text-xs font-semibold rounded-full ${user.role === 'admin' ? 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300' : 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300'}">
                        ${user.role || 'client'}
                    </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">${user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}</td>
            </tr>
        `;
    });
    
    html += '</tbody></table></div></div></div>';
    document.getElementById('content').innerHTML = html;
}

async function loadSecurity() {
    const [logs, stats] = await Promise.all([
        apiCall('/api/security/logs?limit=50'),
        apiCall('/api/security/stats')
    ]);
    
    if (!logs || !stats) return;
    
    let html = `
        <div class="space-y-6">
            <h2 class="text-2xl font-bold text-gray-900 dark:text-white">Security Monitoring</h2>
            <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div class="bg-white dark:bg-gray-800 p-6 rounded-lg shadow border border-gray-200 dark:border-gray-700">
                    <h3 class="text-sm font-medium text-gray-600 dark:text-gray-400">Total Events</h3>
                    <p class="text-3xl font-bold text-gray-900 dark:text-white mt-2">${stats.total || 0}</p>
                </div>
                <div class="bg-white dark:bg-gray-800 p-6 rounded-lg shadow border border-gray-200 dark:border-gray-700">
                    <h3 class="text-sm font-medium text-gray-600 dark:text-gray-400">Last 24h</h3>
                    <p class="text-3xl font-bold text-red-600 mt-2">${stats.last24Hours || 0}</p>
                </div>
                <div class="bg-white dark:bg-gray-800 p-6 rounded-lg shadow border border-gray-200 dark:border-gray-700">
                    <h3 class="text-sm font-medium text-gray-600 dark:text-gray-400">High Severity</h3>
                    <p class="text-3xl font-bold text-orange-600 mt-2">${stats.bySeverity?.high || 0}</p>
                </div>
                <div class="bg-white dark:bg-gray-800 p-6 rounded-lg shadow border border-gray-200 dark:border-gray-700">
                    <h3 class="text-sm font-medium text-gray-600 dark:text-gray-400">Attacks</h3>
                    <p class="text-3xl font-bold text-red-600 mt-2">${stats.recentAttacks?.length || 0}</p>
                </div>
            </div>
            <div class="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 overflow-hidden">
                <div class="p-6 border-b border-gray-200 dark:border-gray-700">
                    <h3 class="text-lg font-bold text-gray-900 dark:text-white">Recent Security Logs</h3>
                </div>
                <div class="overflow-x-auto">
                    <table class="w-full">
                        <thead class="bg-gray-50 dark:bg-gray-700">
                            <tr>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Time</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Type</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Severity</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">IP</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Path</th>
                            </tr>
                        </thead>
                        <tbody class="divide-y divide-gray-200 dark:divide-gray-700">
    `;
    
    (logs.logs || []).slice(0, 20).forEach(log => {
        const severityColor = log.severity === 'high' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300' :
                             log.severity === 'medium' ? 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300' :
                             'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
        
        html += `
            <tr class="hover:bg-gray-50 dark:hover:bg-gray-700">
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">${new Date(log.timestamp).toLocaleString()}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">${log.type || 'N/A'}</td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <span class="px-2 py-1 text-xs font-semibold rounded-full ${severityColor}">
                        ${(log.severity || 'low').toUpperCase()}
                    </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">${log.ip || 'N/A'}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">${log.method} ${log.path}</td>
            </tr>
        `;
    });
    
    html += '</tbody></table></div></div></div>';
    document.getElementById('content').innerHTML = html;
}

// Make functions globally available
window.logout = logout;
window.switchTab = switchTab;

