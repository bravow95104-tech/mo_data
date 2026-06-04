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
    
    // 優先檢查是否有 /mo_data/ 路徑標記 (適用於 GitHub Pages 等部署環境)
    if (path.includes("/mo_data/")) {
        baseURL = path.substring(0, path.indexOf("/mo_data/")) + "/mo_data";
    } else {
        // 根據路徑深度自動判斷 (適用於本機開發)
        // 排除掉檔名後計算層級
        const segments = path.split("/").filter(s => s.length > 0);
        // 如果最後一個 segment 看起來像檔案 (有副檔名)，則不計入深度
        if (segments.length > 0 && segments[segments.length - 1].includes('.')) {
            segments.pop();
        }
        
        const depth = segments.length;
        if (depth === 0) {
            baseURL = ".";
        } else {
            baseURL = Array(depth).fill("..").join("/");
        }
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
