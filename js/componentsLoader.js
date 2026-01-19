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

    // --- 🌟 關鍵：更新 CSS 變數以防止遮擋表格表頭 ---
    function updateNavOffset() {
        const height = navbar.offsetHeight;
        document.documentElement.style.setProperty('--nav-offset', height + 'px');
    }

    // --- 初始設定：永久顯示並設定偏移量 ---
    navbar.classList.add("visible");
    updateNavOffset();

    // --- 🐞 ADVANCED DEBUGGING: Log computed values ---
    setTimeout(() => {
      const computedNavOffset = getComputedStyle(document.documentElement).getPropertyValue('--nav-offset').trim();
      const tableHeader = document.querySelector('thead');
      if (tableHeader) {
        const computedHeaderTop = getComputedStyle(tableHeader).top;
        console.log(`--- DEBUG INFO for ${window.location.pathname} ---`);
        console.log(`--nav-offset is: ${computedNavOffset}`);
        console.log('Computed <thead> top:', computedHeaderTop);
        console.log('-------------------------------------------');
      }
    }, 100); // Timeout to ensure styles are applied

    // --- 當視窗大小改變時，重新計算偏移量 ---
    window.addEventListener('resize', updateNavOffset);
    
    // --- 漢堡選單控制邏輯 ---
    const hamburgerBtn = document.getElementById("hamburger-btn");
    const navMenu = document.getElementById("nav-menu");
    
    if (hamburgerBtn && navMenu) {
        hamburgerBtn.addEventListener("click", (e) => {
            e.stopPropagation();
            navMenu.classList.toggle("active");
            navbar.classList.add("visible"); // 確保可見
            // 選單展開/收合後高度可能變化，延遲更新以確保抓到正確高度
            setTimeout(updateNavOffset, 300); // 300ms 等待 CSS 過渡
        });

        document.addEventListener("click", (e) => {
            if (navMenu.classList.contains("active") && !navMenu.contains(e.target) && !hamburgerBtn.contains(e.target)) {
                navMenu.classList.remove("active");
                setTimeout(updateNavOffset, 300);
            }
        });
    }
}

    // --- 初始設定：永久顯示並設定偏移量 ---
    navbar.classList.add("visible");
    updateNavOffset();

    // --- 🐞 ADVANCED DEBUGGING: Log computed values ---
    setTimeout(() => {
      const computedNavOffset = getComputedStyle(document.documentElement).getPropertyValue('--nav-offset').trim();
      const tableHeader = document.querySelector('thead');
      if (tableHeader) {
        const computedHeaderTop = getComputedStyle(tableHeader).top;
        console.log(`--- DEBUG INFO for ${window.location.pathname} ---`);
        console.log(`--nav-offset is: ${computedNavOffset}`);
        console.log('Computed <thead> top:', computedHeaderTop);
        console.log('-------------------------------------------');
      }
    }, 100); // Timeout to ensure styles are applied

    // --- 當視窗大小改變時，重新計算偏移量 ---
    window.addEventListener('resize', updateNavOffset);
    
    // --- 漢堡選單控制邏輯 ---
    const hamburgerBtn = document.getElementById("hamburger-btn");
    const navMenu = document.getElementById("nav-menu");
    
    if (hamburgerBtn && navMenu) {
        hamburgerBtn.addEventListener("click", (e) => {
            e.stopPropagation();
            navMenu.classList.toggle("active");
            navbar.classList.add("visible"); // 確保可見
            // 選單展開/收合後高度可能變化，延遲更新以確保抓到正確高度
            setTimeout(updateNavOffset, 300); // 300ms 等待 CSS 過渡
        });

        document.addEventListener("click", (e) => {
            if (navMenu.classList.contains("active") && !navMenu.contains(e.target) && !hamburgerBtn.contains(e.target)) {
                navMenu.classList.remove("active");
                setTimeout(updateNavOffset, 300);
            }
        });
    }
}

    // --- 初始設定：永久顯示並設定偏移量 ---
    navbar.classList.add("visible");
    updateNavOffset();

    // --- 🐞 ADVANCED DEBUGGING: Log computed values ---
    setTimeout(() => {
      const computedNavOffset = getComputedStyle(document.documentElement).getPropertyValue('--nav-offset').trim();
      const tableHeader = document.querySelector('thead');
      if (tableHeader) {
        const computedHeaderTop = getComputedStyle(tableHeader).top;
        console.log(`--- DEBUG INFO for ${window.location.pathname} ---`);
        console.log(`--nav-offset is: ${computedNavOffset}`);
        console.log('Computed <thead> top:', computedHeaderTop);
        console.log('-------------------------------------------');
      }
    }, 100); // Timeout to ensure styles are applied

    // --- 當視窗大小改變時，重新計算偏移量 ---
    window.addEventListener('resize', updateNavOffset);
    
    // --- 漢堡選單控制邏輯 ---
    const hamburgerBtn = document.getElementById("hamburger-btn");
    const navMenu = document.getElementById("nav-menu");
    
    if (hamburgerBtn && navMenu) {
        hamburgerBtn.addEventListener("click", (e) => {
            e.stopPropagation();
            navMenu.classList.toggle("active");
            navbar.classList.add("visible"); // 確保可見
            // 選單展開/收合後高度可能變化，延遲更新以確保抓到正確高度
            setTimeout(updateNavOffset, 300); // 300ms 等待 CSS 過渡
        });

        document.addEventListener("click", (e) => {
            if (navMenu.classList.contains("active") && !navMenu.contains(e.target) && !hamburgerBtn.contains(e.target)) {
                navMenu.classList.remove("active");
                setTimeout(updateNavOffset, 300);
            }
        });
    }
}