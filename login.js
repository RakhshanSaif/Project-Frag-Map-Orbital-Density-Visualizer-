function showTab(tab) {
    if (tab === 'login') {
        document.getElementById("loginForm").style.display = "block";
        document.getElementById("signupForm").style.display = "none";
        document.getElementById("loginTab").classList.add("tab-active");
        document.getElementById("signupTab").classList.remove("tab-active");
    } else {
        document.getElementById("loginForm").style.display = "none";
        document.getElementById("signupForm").style.display = "block";
        document.getElementById("signupTab").classList.add("tab-active");
        document.getElementById("loginTab").classList.remove("tab-active");
    }
}

function signup() {
    const username = document.getElementById("signupUser").value.trim();
    const email = document.getElementById("signupEmail").value.trim();
    const password = document.getElementById("signupPass").value.trim();
    const type = document.getElementById("signupType").value;

    if (!username || !email || !password || !type) {
        document.getElementById("signupMsg").style.color = "red";
        document.getElementById("signupMsg").innerText = 
            "❌ Please fill all fields";
        return;
    }

    const existing = localStorage.getItem("user_" + username);
    if (existing) {
        document.getElementById("signupMsg").style.color = "red";
        document.getElementById("signupMsg").innerText = 
            "❌ Username already exists";
        return;
    }

    const userData = {
        username: username,
        email: email,
        password: password,
        type: type,
        createdAt: new Date().toLocaleString()
    };

    localStorage.setItem("user_" + username, JSON.stringify(userData));

    document.getElementById("signupMsg").style.color = "lime";
    document.getElementById("signupMsg").innerText = 
        "✅ Account created! Please login.";

    setTimeout(() => showTab('login'), 1000);
}

function login() {
    const username = document.getElementById("loginUser").value.trim();
    const password = document.getElementById("loginPass").value.trim();

    if (!username || !password) {
        document.getElementById("loginMsg").style.color = "red";
        document.getElementById("loginMsg").innerText = 
            "❌ Please fill all fields";
        return;
    }

    const stored = localStorage.getItem("user_" + username);

    if (!stored) {
        document.getElementById("loginMsg").style.color = "red";
        document.getElementById("loginMsg").innerText = 
            "❌ User not found";
        return;
    }

    const userData = JSON.parse(stored);

    if (userData.password !== password) {
        document.getElementById("loginMsg").style.color = "red";
        document.getElementById("loginMsg").innerText = 
            "❌ Wrong password";
        return;
    }

    sessionStorage.setItem("loggedIn", "true");
    sessionStorage.setItem("currentUser", username);

    window.location.href = "index.html";
}
