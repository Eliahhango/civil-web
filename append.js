const fs = require('fs');

const appendCode = \
/* --- User Management Tab Logic (Serverless API) --- */
document.addEventListener("DOMContentLoaded", function () {
  const usersTabBtn = document.querySelector('[data-tab="tab-users"]');
  const addAdminBtn = document.getElementById("add-admin-user");
  const modal = document.getElementById("add-user-modal");
  const saveBtn = document.getElementById("save-new-user");
  const cancelBtn = document.getElementById("cancel-new-user");
  const listContainer = document.getElementById("admin-users-list");

  if (!usersTabBtn || !addAdminBtn) return;

  function fetchUsers() {
    firebase.auth().currentUser.getIdToken().then(token => {
      fetch("/api/admin/users", {
        headers: { "Authorization": "Bearer " + token }
      }).then(r => r.json()).then(data => {
        if (data.users) {
          listContainer.innerHTML = data.users.map(u => 
            \\\<div style="padding: 10px; border-bottom: 1px solid #333; display: flex; justify-content: space-between;">
              <div><strong>\\\</strong><br><small style="color:#aaa;">Role: \\\</small></div>
            </div>\\\
          ).join("");
        } else if (data.error) {
           listContainer.innerHTML = \\\<p style="color: red; padding: 20px;">\\\</p>\\\;
        }
      }).catch(err => {
         listContainer.innerHTML = \\\<p style="color: red; padding: 20px;">Error loading users.</p>\\\;
      });
    });
  }

  usersTabBtn.addEventListener("click", () => {
    fetchUsers();
  });

  addAdminBtn.addEventListener("click", () => {
    modal.style.display = "block";
  });

  cancelBtn.addEventListener("click", () => {
    modal.style.display = "none";
  });

  saveBtn.addEventListener("click", () => {
    const email = document.getElementById("new-user-email").value;
    const password = document.getElementById("new-user-password").value;
    const role = document.getElementById("new-user-role").value;

    if (!email || !password) {
      alert("Email and password required.");
      return;
    }

    saveBtn.innerText = "Creating...";
    firebase.auth().currentUser.getIdToken().then(token => {
      fetch("/api/admin/users", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": "Bearer " + token 
        },
        body: JSON.stringify({ email, password, role })
      }).then(r => r.json()).then(res => {
        saveBtn.innerText = "Create User";
        if (res.success) {
          alert("User created successfully!");
          modal.style.display = "none";
          document.getElementById("new-user-email").value = "";
          document.getElementById("new-user-password").value = "";
          fetchUsers();
        } else {
          alert("Error: " + res.error);
        }
      }).catch(err => {
        saveBtn.innerText = "Create User";
        alert("Server error.");
      });
    });
  });
});
\;
fs.appendFileSync('elitech/admin/admin.js', appendCode, 'utf8');
