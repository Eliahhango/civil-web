const fs = require('fs');

const txt = fs.readFileSync('elitech/admin/firebase-email-auth.js', 'utf8');

const search = \    if (user) {
      if (typeof window.CMSAdmin.enterDashboard === "function") {
        window.CMSAdmin.enterDashboard();
      }
        setStatus("Sign-in active. Syncing admin permissions...", false);
        user.getIdToken().then(function(token) {
          fetch("/api/admin/auth-sync", {
            method: "POST",
            headers: { "Authorization": "Bearer " + token }
          }).then(res => res.json()).then(data => {
              console.log("Auth sync complete", data);
              if(data.success) {
                 setStatus("Sign-in active. Super Admin synced.", false);
              }
          }).catch(err => console.error("Sync error", err));
        });
      window.CMSAdmin.showLoginView();
    }\;

const replace = \    if (user) {
      if (typeof window.CMSAdmin.enterDashboard === "function") {
        window.CMSAdmin.enterDashboard();
      }
      setStatus("Sign-in active. Syncing admin permissions...", false);
      user.getIdToken().then(function(token) {
        fetch("/api/admin/auth-sync", {
          method: "POST",
          headers: { "Authorization": "Bearer " + token }
        }).then(res => res.json()).then(data => {
            console.log("Auth sync complete", data);
            if(data.success) {
               setStatus("Sign-in active. Super Admin synced.", false);
            }
        }).catch(err => console.error("Sync error", err));
      });
      return;
    }

    if (typeof window.CMSAdmin.showLoginView === "function") {
      window.CMSAdmin.showLoginView();
    }\;

let nextTxt = txt.replace(search, replace).replace(search.replace(/\\n/g, '\\r\\n'), replace);

fs.writeFileSync('elitech/admin/firebase-email-auth.js', nextTxt, 'utf8');
