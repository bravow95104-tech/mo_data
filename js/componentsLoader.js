// componentsLoader.js

function loadComponent(selector, url) {
    const el = document.querySelector(selector);
    if (!el) return Promise.resolve();

    console.log(`Loading component from: ${url}`);
    return fetch(url)
        .then((res) => {
            if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
            return res.text();
        })
        .then((html) => {
            el.innerHTML = html;
            console.log(`Successfully loaded: ${url}`);
        })
        .catch((err) => console.error(`Failed to load ${url}:`, err));
}

document.addEventListener("DOMContentLoaded", function () {
    // --- 主題切換初始化 ---
    const savedTheme = localStorage.getItem("theme") || "dark";
    document.documentElement.setAttribute("data-theme", savedTheme);
    console.log(`Initial theme set to: ${savedTheme}`);

    // 計算 baseURL - 更加魯棒的寫法
    const path = window.location.pathname;
    let baseURL = "";
    
    if (path.includes("/mo_data/")) {
        baseURL = path.substring(0, path.indexOf("/mo_data/")) + "/mo_data";
    } else {
        // 如果路徑中沒有 /mo_data/，嘗試根據當前路徑深度計算
        const depth = path.split("/").filter(Boolean).length;
        baseURL = depth > 0 ? ".." : ".";
        // 這裡如果是根目錄，維持空字串或點
    }
    
    // 如果是首頁且沒有子路徑，baseURL 可能是空
    if (!baseURL || baseURL === "/") baseURL = ".";
    
    console.log(`Detected baseURL: ${baseURL}`);

    loadComponent("#nav-container", baseURL + "/components/nav/nav.html").then(() => {
        initNavbarBehavior();
        initThemeSwitcher();
    });

    loadComponent("#footer-container", baseURL + "/components/footer/footer.html");

    const backToTopBtn = document.getElementById("backToTop");
    if (backToTopBtn) {
        window.addEventListener("scroll", () => {
            backToTopBtn.style.display = window.scrollY > 200 ? "block" : "none";
        });

        backToTopBtn.addEventListener("click", () => {
            window.scrollTo({ top: 0, behavior: "smooth" });
        });
    }
});

function initNavbarBehavior() {
    const navbar = document.querySelector("#nav-container nav");
    if (!navbar) return;

    const hamburgerBtn = document.getElementById("hamburger-btn");
    const navMenu = document.getElementById("nav-menu");
    if (!hamburgerBtn || !navMenu) return;

    function updateNavOffset() {
        const height = navbar.offsetHeight;
        document.documentElement.style.setProperty("--nav-offset", height + "px");
        document.documentElement.style.setProperty("--nav-height", height + "px");
    }

    function closeDropdowns() {
        navMenu.querySelectorAll(".dropdown.open").forEach((dropdown) => {
            dropdown.classList.remove("open");
            const toggle = dropdown.querySelector(".dropdown-toggle");
            if (toggle && toggle.tagName === "BUTTON") {
                toggle.setAttribute("aria-expanded", "false");
            }
        });
    }

    function setMenuState(isOpen) {
        navMenu.classList.toggle("active", isOpen);
        hamburgerBtn.setAttribute("aria-expanded", String(isOpen));
        if (!isOpen) closeDropdowns();
        window.setTimeout(updateNavOffset, 50);
    }

    navbar.classList.add("visible");
    updateNavOffset();
    window.addEventListener("resize", updateNavOffset);

    hamburgerBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        setMenuState(!navMenu.classList.contains("active"));
        navbar.classList.add("visible");
    });

    navMenu.addEventListener("click", (e) => {
        const toggle = e.target.closest(".dropdown-toggle");
        if (toggle && toggle.tagName === "BUTTON") {
            e.preventDefault();
            e.stopPropagation();

            const dropdown = toggle.closest(".dropdown");
            if (!dropdown) return;

            const willOpen = !dropdown.classList.contains("open");
            closeDropdowns();
            dropdown.classList.toggle("open", willOpen);
            toggle.setAttribute("aria-expanded", String(willOpen));
            window.setTimeout(updateNavOffset, 50);
            return;
        }

        if (e.target.tagName === "A") {
            setMenuState(false);
        }
    });

    document.addEventListener("click", (e) => {
        if (navMenu.classList.contains("active") && !navMenu.contains(e.target) && !hamburgerBtn.contains(e.target)) {
            setMenuState(false);
        }
    });
}

function initThemeSwitcher() {
    const toggleBtn = document.getElementById("theme-toggle");
    if (!toggleBtn) {
        console.error("Theme toggle button not found!");
        return;
    }

    const themeIcon = document.getElementById("theme-icon");
    console.log("Theme switcher initialized.");

    const updateIcon = (theme) => {
        if (themeIcon) {
            themeIcon.textContent = theme === "light" ? "☀️" : "🌙";
        }
    };

    updateIcon(document.documentElement.getAttribute("data-theme"));

    toggleBtn.addEventListener("click", () => {
        const currentTheme = document.documentElement.getAttribute("data-theme");
        const newTheme = currentTheme === "light" ? "dark" : "light";
        
        console.log(`Switching theme to: ${newTheme}`);
        document.documentElement.setAttribute("data-theme", newTheme);
        localStorage.setItem("theme", newTheme);
        updateIcon(newTheme);
    });
}
