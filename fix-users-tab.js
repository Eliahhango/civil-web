
const fs = require("fs");

let js = fs.readFileSync("elitech/admin/admin.js", "utf8");
js = js.replace(/const usersTabBtn = document\.querySelector\('\[data-tab="tab-users"\]'\);/, `const usersTabBtn = document.querySelector('[data-tab="users"]');`);
fs.writeFileSync("elitech/admin/admin.js", js, "utf8");
console.log("admin.js fixed");
