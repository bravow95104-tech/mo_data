// componentsLoader.js
// 用於載入共用元件（如 nav、footer）到各頁面，並同步處理導覽列與表格表頭的位移

function loadComponent(selector, url) {
    const el = document.querySelector(selector);
    if (!el) return Promise.resolve(); 

    return fetch(url)
        .then(res => res.text())
        .then(html => {
            el.innerHTML = html;
        })
        .catch(err => console.error(`❌ 載入 ${url} 失敗:`, err));
}

document.addEventListener("DOMContentLoaded", function () {
    // === 自動偵測 Base URL ===
    const pathParts = window.location.pathname.split("/").filter(Boolean);
    const repoName = pathParts.length > 0 ? pathParts[0] : "";
    const baseURL = repoName ? `${window.location.origin}/${repoName}` : window.location.origin;

    // === 載入 nav、footer ===
    loadComponent("#nav-container", baseURL + "/components/nav/nav.html").then(() => {
        initNavbarBehavior();
    });

    loadComponent("#footer-container", baseURL + "/components/footer/footer.html");

    // === 回到頂部按鈕邏輯 ===
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

// === 導覽列滾動控制 與 表格偏移同步邏輯 ===
function initNavbarBehavior() {
    const navbar = document.querySelector("#nav-container nav");
    if (!navbar) return;

    const hamburgerBtn = document.getElementById("hamburger-btn");
    const navMenu = document.getElementById("nav-menu");
    
    let lastScrollY = window.scrollY;
    let isMouseNearTop = false;

    // --- 🌟 關鍵：更新 CSS 變數以防止遮擋表格表頭 ---
    function updateNavOffset() {
        // 如果導航列處於可見狀態，則獲取其高度，否則偏移量為 0
        const isVisible = navbar.classList.contains("visible");
        const height = isVisible ? navbar.offsetHeight : 0;
        document.documentElement.style.setProperty('--nav-offset', height + 'px');
    }

    // 初始狀態
    navbar.classList.add("visible");
    updateNavOffset();

    function isMobileMenuOpen() {
        return navMenu && navMenu.classList.contains("active");
    }

    // 滑鼠靠近頂部顯示導覽列
    document.addEventListener("mousemove", e => {
        isMouseNearTop = e.clientY < 80;
        updateNavbarVisibility();
    });

    // 滾動控制顯示／隱藏
    window.addEventListener("scroll", () => {
        const currentY = window.scrollY;
        const shouldHide = currentY > lastScrollY && !isMouseNearTop && !isMobileMenuOpen();
        
        if (currentY < 100) {
            navbar.classList.add("visible");
        } else if (shouldHide) {
            navbar.classList.remove("visible");
        } else {
            navbar.classList.add("visible");
        }

        updateNavOffset(); // 📌 滾動時同步更新偏移量
        lastScrollY = currentY;
    });

    function updateNavbarVisibility() {
        if (isMobileMenuOpen()) {
            navbar.classList.add("visible");
        } else if (isMouseNearTop) {
            navbar.classList.add("visible");
        } else if (window.scrollY > 100) {
            navbar.classList.remove("visible");
        }
        updateNavOffset(); // 📌 狀態改變時更新偏移量
    }
    
    // --- 漢堡選單控制邏輯 ---
    if (hamburgerBtn && navMenu) {
        hamburgerBtn.addEventListener("click", (e) => {
            e.stopPropagation();
            navMenu.classList.toggle("active");
            navbar.classList.add("visible"); 
            updateNavOffset();
        });

        document.addEventListener("click", (e) => {
            if (isMobileMenuOpen() && !navMenu.contains(e.target) && !hamburgerBtn.contains(e.target)) {
                navMenu.classList.remove("active");
                updateNavOffset();
            }
        });
    }
}