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
        setActiveNavLink();
    });

    loadComponent("#footer-container", baseURL + "/components/footer/footer.html");

    // --- 動態提示 (Hint) 初始化 ---
    initDynamicHint();

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
        let height = navbar.offsetHeight;
        if (window.innerWidth <= 768) {
            const mobileHeader = document.querySelector(".nav-mobile-header");
            if (mobileHeader) height = mobileHeader.offsetHeight;
        }
        document.documentElement.style.setProperty("--nav-offset", height + "px");
        document.documentElement.style.setProperty("--nav-height", height + "px");
    }

    function closeDropdowns() {
        navMenu.querySelectorAll(".dropdown.open").forEach((dropdown) => {
            dropdown.classList.remove("open");
            const toggle = dropdown.querySelector(".dropdown-toggle");
            if (toggle) {
                toggle.setAttribute("aria-expanded", "false");
                toggle.blur(); // 強制失焦
            }
        });
    }

    function setMenuState(isOpen) {
        const navContainer = document.getElementById("nav-container");
        navMenu.classList.toggle("active", isOpen);
        navbar.classList.toggle("menu-open", isOpen);
        if (navContainer) navContainer.classList.toggle("menu-open", isOpen);
        
        hamburgerBtn.setAttribute("aria-expanded", String(isOpen));
        
        if (isOpen) {
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "";
        }

        if (!isOpen) closeDropdowns();
        window.setTimeout(updateNavOffset, 50);
    }

    navbar.classList.add("visible");
    updateNavOffset();
    
    window.addEventListener("resize", () => {
        updateNavOffset();
        if (window.innerWidth > 768 && navMenu.classList.contains("active")) {
            setMenuState(false);
        }
    });

    hamburgerBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        setMenuState(!navMenu.classList.contains("active"));
        navbar.classList.add("visible");
    });

    navMenu.addEventListener("click", (e) => {
        const toggle = e.target.closest(".dropdown-toggle");
        if (toggle) {
            // 只有當此 dropdown 裡面有子選單 (.dropdown-content) 時才攔截預設行為
            const dropdown = toggle.closest(".dropdown");
            const hasContent = dropdown && dropdown.querySelector(".dropdown-content");

            if (hasContent) {
                e.preventDefault();
                e.stopPropagation();

                const isAlreadyOpen = dropdown.classList.contains("open");
                
                // 關閉其他已開啟的選單
                closeDropdowns();
                
                // 如果原本是關閉的，就打開；如果是開啟的，剛才 closeDropdowns() 已經順利收合了
                if (!isAlreadyOpen) {
                    dropdown.classList.add("open");
                    toggle.setAttribute("aria-expanded", "true");
                }

                window.setTimeout(updateNavOffset, 50);
                return;
            }
        }

        // 點擊一般的子連結 (<a>) 時，關閉手機選單
        if (e.target.tagName === "A") {
            setMenuState(false);
        }
    });

    // 點擊頁面其他空白處時自動收合選單
    document.addEventListener("click", (e) => {
        if (!navMenu.contains(e.target) && !hamburgerBtn.contains(e.target)) {
            closeDropdowns();
            if (navMenu.classList.contains("active")) {
                setMenuState(false);
            }
        }
    });
}

function initThemeSwitcher() {
    const toggleBtns = document.querySelectorAll(".theme-toggle-btn");
    if (toggleBtns.length === 0) {
        console.error("Theme toggle buttons not found!");
        return;
    }

    const themeIcons = document.querySelectorAll(".theme-icon");
    console.log("Theme switcher initialized with", toggleBtns.length, "buttons.");

    const updateIcons = (theme) => {
        themeIcons.forEach(icon => {
            icon.textContent = theme === "light" ? "☀️" : "🌙";
        });
    };

    updateIcons(document.documentElement.getAttribute("data-theme"));

    toggleBtns.forEach(btn => {
        btn.addEventListener("click", () => {
            const currentTheme = document.documentElement.getAttribute("data-theme");
            const newTheme = currentTheme === "light" ? "dark" : "light";
            
            console.log(`Switching theme to: ${newTheme}`);
            document.documentElement.setAttribute("data-theme", newTheme);
            localStorage.setItem("theme", newTheme);
            updateIcons(newTheme);
        });
    });
}

/**
 * 動態從 Supabase 載入頁面提示 (Hint)
 */
async function initDynamicHint() {
    const SUPABASE_URL = 'https://zyupyyqrqxhqczjcxeva.supabase.co';
    const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp5dXB5eXFycXhocWN6amN4ZXZhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAxMDkzNDQsImV4cCI6MjA5NTY4NTM0NH0._5Jc-Nge1rwTyqRv6cErmpO31zFgx8z8nZxeM576j_0';
    
    let path = window.location.pathname;
    if (path.includes("/mo_data/")) {
        path = path.substring(path.indexOf("/mo_data/") + 8);
    }
    
    if (!path.startsWith("/")) path = "/" + path;
    if (path.endsWith("/")) path += "index.html";
    if (path === "/") path = "/index.html";

    console.log(`Fetching hint for path: ${path}`);

    try {
        const response = await fetch(`${SUPABASE_URL}/rest/v1/page_hints?page_path=eq.${encodeURIComponent(path)}&select=*`, {
            headers: {
                'apikey': SUPABASE_KEY,
                'Authorization': `Bearer ${SUPABASE_KEY}`
            }
        });

        if (!response.ok) return;

        const data = await response.json();
        if (data && data.length > 0) {
            const hint = data[0];
            injectHintButton(hint.hint_text, hint.target_selector);
        }
    } catch (err) {
        console.error("Failed to fetch page hint:", err);
    }
}

/**
 * 在頁面中注入提示按鈕
 */
function injectHintButton(text, customSelector = null) {
    let target = null;
    
    // 1. 優先使用後台設定的選擇器
    if (customSelector) {
        target = document.querySelector(customSelector);
    }
    
    // 2. 如果沒設定選擇器，則尋找 HTML 中手動放置的標記點
    if (!target) {
        target = document.getElementById("dynamic-hint-target");
    }
    
    // 如果都找不到，就不顯示，避免亂跑
    if (!target) return;

    // 避免重複注入
    if (target.querySelector(".dynamic-hint")) return;
    if (target.id !== "dynamic-hint-target" && target.parentNode.querySelector(".dynamic-hint")) return;

    // 建立提示按鈕 HTML
    const hintBtn = document.createElement("button");
    hintBtn.className = "hint-btn dynamic-hint";
    hintBtn.type = "button";
    hintBtn.setAttribute("aria-label", "提示說明");
    
    // 【重點修改 1】：這裡加上了 show，讓網頁一載入就預設打開！
    hintBtn.innerHTML = `
        <span class="hint-circle">!</span>
        <div class="hint-tooltip show" role="tooltip">${text}</div>
    `;

    const tooltip = hintBtn.querySelector(".hint-tooltip");

    // 【重點修改 2】：點擊提示框「文字區域」時不要關閉，停止事件冒泡
    tooltip.addEventListener("click", (e) => {
        e.stopPropagation();
    });

    // 點擊「按鈕 (! 圖示)」時，觸發顯示 / 隱藏切換
    hintBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        
        // 關閉網頁上其他有開啟的提示
        document.querySelectorAll(".hint-tooltip.show").forEach(t => {
            if (t !== tooltip) t.classList.remove("show");
        });
        
        tooltip.classList.toggle("show");
    });

    // 點擊網頁其他空白處時，自動關閉提示框
    document.addEventListener("click", () => {
        if (tooltip) tooltip.classList.remove("show");
    });

    // --- 佈局邏輯 ---
    target.classList.add("hint-target-wrapper");
    target.appendChild(hintBtn);
    
    if (window.getComputedStyle(target).position === "static") {
        target.style.position = "relative";
    }
}

/**
 * 自動比對當前網址路徑，並為導覽列對應的 <a> 標籤加上 .active 類別
 */
function setActiveNavLink() {
    const navMenu = document.getElementById("nav-menu");
    if (!navMenu) return;

    // 取得當前頁面檔名 (例如: "map.html" 或 "index.html")
    let currentPath = window.location.pathname;
    
    // 清理路徑，只留最後的檔名/目錄
    let currentPage = currentPath.split("/").pop();
    if (!currentPage || currentPage === "") {
        currentPage = "index.html"; // 預設首頁
    }

    const navLinks = navMenu.querySelectorAll("a");

    navLinks.forEach((link) => {
        const href = link.getAttribute("href");
        if (!href) return;

        // 取得連結對應的檔名
        const linkPage = href.split("/").pop();

        // 比對檔名是否一致
        if (linkPage === currentPage) {
            link.classList.add("active");

            // 🚀 如果該連結在下拉選單內 (.dropdown)，順便讓父級選單按鈕也高亮！
            const parentDropdown = link.closest(".dropdown");
            if (parentDropdown) {
                const parentToggle = parentDropdown.querySelector(".dropdown-toggle");
                if (parentToggle) {
                    parentToggle.classList.add("active");
                }
            }
        }
    });
}