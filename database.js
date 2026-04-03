const DB = {

    saveUser(username, data) {
        localStorage.setItem("user_" + username, JSON.stringify(data));
    },

    getUser(username) {
        const data = localStorage.getItem("user_" + username);
        return data ? JSON.parse(data) : null;
    },

    userExists(username) {
        return localStorage.getItem("user_" + username) !== null;
    },

    startSession(username) {
        sessionStorage.setItem("loggedIn", "true");
        sessionStorage.setItem("currentUser", username);
    },

    isLoggedIn() {
        return sessionStorage.getItem("loggedIn") === "true";
    },

    getCurrentUser() {
        return sessionStorage.getItem("currentUser");
    },

    logout() {
        sessionStorage.removeItem("loggedIn");
        sessionStorage.removeItem("currentUser");
        window.location.href = "login.html";
    },

    saveReport(data) {
        const reports = this.getReports();
        reports.push({
            timestamp: new Date().toLocaleString(),
            user: this.getCurrentUser(),
            data: data
        });
        localStorage.setItem("fragmap_reports", JSON.stringify(reports));
    },

    getReports() {
        const data = localStorage.getItem("fragmap_reports");
        return data ? JSON.parse(data) : [];
    }
};
