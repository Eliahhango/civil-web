
const fs = require("fs");
let html = fs.readFileSync("elitech/admin/index.html", "utf8");

const startIdx = html.indexOf(`<section id="tab-users" class="tab-panel">`);
const endIdx = html.indexOf(`</section>`, startIdx) + `</section>`.length;

const newHTML = `<section id="tab-users" class="tab-panel">
    <div class="panel-head mb-6 flex justify-between items-center">
        <div>
            <h2 class="text-xl font-semibold m-0 text-gray-900">User Management</h2>
            <p class="text-sm text-gray-500 mt-1">Manage administrators and their roles.</p>
        </div>
    </div>
    
    <div class="kibaha-container space-y-6">
        <div id="admin-invite" class="card-outline rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <h3 class="text-lg font-semibold text-gray-900 m-0">Add Admin User</h3>
            <p class="mt-1 text-sm text-gray-500">
                Create new administrator accounts here. They will receive an email to sign in.
            </p>

            <div class="mt-5 flex flex-wrap items-end gap-4" id="add-user-modal">
                <div class="form-group flex-1 min-w-[200px]">
                    <label class="block text-sm font-medium text-gray-700 mb-1">Email</label>
                    <input type="email" id="new-user-email" class="admin-input block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none" placeholder="admin@example.com">
                </div>
                
                <div class="form-group flex-1 min-w-[200px]">
                    <label class="block text-sm font-medium text-gray-700 mb-1">Temporary Password</label>
                    <input type="password" id="new-user-password" class="admin-input block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none" placeholder="Min 6 characters">
                </div>

                <div class="form-group min-w-[150px]">
                    <label class="block text-sm font-medium text-gray-700 mb-1">Role</label>
                    <select id="new-user-role" class="admin-input block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none">
                        <option value="admin">Content Admin</option>
                        <option value="super_admin">Super Admin</option>
                    </select>
                </div>

                <button id="add-admin-user" class="btn-primary rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:ring-offset-2">
                    Save Admin
                </button>
            </div>
            <div id="add-user-error" class="hidden mt-3 text-sm text-red-600 bg-red-50 p-2 rounded"></div>
        </div>

        <div class="card-outline rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
            <div class="overflow-x-auto">
                <table class="w-full text-left text-sm whitespace-nowrap">
                    <thead class="bg-gray-50 text-gray-600 border-b border-gray-200">
                        <tr>
                            <th scope="col" class="px-6 py-3 font-medium">Email</th>
                            <th scope="col" class="px-6 py-3 font-medium">Role</th>
                            <th scope="col" class="px-6 py-3 font-medium">Status</th>
                            <th scope="col" class="px-6 py-3 font-medium">Actions</th>
                        </tr>
                    </thead>
                    <tbody id="admin-users-list" class="divide-y divide-gray-200 bg-white">
                        <tr>
                            <td colspan="4" class="px-6 py-8 text-center text-gray-500">
                                <div class="inline-flex items-center justify-center">
                                    <i class="fas fa-circle-notch fa-spin mr-2"></i> Loading users...
                                </div>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
            <div class="bg-gray-50 px-6 py-4 border-t border-gray-200">
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                        <h4 class="font-semibold text-gray-900 mb-1"><i class="fas fa-shield-alt text-gray-500 mr-1"></i> Super Admin</h4>
                        <p class="text-gray-600 mb-0 mt-0">Full database structural control, global settings, & user management.</p>
                    </div>
                    <div>
                        <h4 class="font-semibold text-gray-900 mb-1"><i class="fas fa-edit text-gray-500 mr-1"></i> Content Admin</h4>
                        <p class="text-gray-600 mb-0 mt-0">Manage projects, blogs, services, media, and general content.</p>
                    </div>
                </div>
            </div>
        </div>
    </div>
</section>`;

if (startIdx !== -1 && endIdx > startIdx) {
    html = html.substring(0, startIdx) + newHTML + html.substring(endIdx);
    fs.writeFileSync("elitech/admin/index.html", html, "utf8");
    console.log("HTML replaced.");
}
