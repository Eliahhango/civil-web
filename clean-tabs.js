
const fs = require("fs");
let html = fs.readFileSync("elitech/admin/index.html", "utf8");

// Log occurrences of Users & Admins
const matches = [...html.matchAll(/<button class="nav-btn"[^>]*data-tab="users"[^>]*>[\s\S]*?<\/button>/gi)];
console.log(`Found ${matches.length} user tabs`);

if (matches.length > 1) {
    // Replace all with a single standard one
    const tabHTML = `<button class="nav-btn" data-tab="users">\n            <i class="fas fa-users-cog"></i> Users & Admins\n          </button>`;
    
    // remove all occurrences
    html = html.replace(/<button class="nav-btn"[^>]*data-tab="users"[^>]*>[\s\S]*?<\/button>\s*/gi, "");
    
    // add it back after Services
    html = html.replace(/(<button class="nav-btn" data-tab="services">[\s\S]*?<\/button>)\s*/i, `$1\n          ${tabHTML}\n          `);
}

// Find users panel
const panelMatches = [...html.matchAll(/<section id="tab-users" class="tab-panel">/gi)];
console.log(`Found ${panelMatches.length} user panels`);

fs.writeFileSync("elitech/admin/index.html", html, "utf8");
console.log("Cleaned tabs");
