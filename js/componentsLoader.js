// componentsLoader.js
// 用於載入共用元件（如 nav、footer）到各頁面

function loadComponent(selector, url) {
  const el = document.querySelector(selector);
  if (!el) return Promise.resolve(); // 沒找到容器直接跳過

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

// === 導覽列滾動與滑鼠顯示控制 ===
function initNavbarBehavior() {
  const navbar = document.querySelector("#nav-container nav");
  if (!navbar) return;

  let lastScrollY = window.scrollY;
  let isMouseNearTop = false;

  // 初始狀態顯示
  navbar.classList.add("visible");

  // 滑鼠靠近頂部顯示導覽列
  document.addEventListener("mousemove", e => {
    isMouseNearTop = e.clientY < 80;
    updateNavbarVisibility();
  });

  // 滾動控制顯示／隱藏
  window.addEventListener("scroll", () => {
    const currentY = window.scrollY;

    if (currentY < 100) {
      navbar.classList.add("visible");
    } else if (currentY > lastScrollY && !isMouseNearTop) {
      navbar.classList.remove("visible");
    } else {
      navbar.classList.add("visible");
    }

    lastScrollY = currentY;
  });

  function updateNavbarVisibility() {
    if (isMouseNearTop) {
      navbar.classList.add("visible");
    } else if (window.scrollY > 100) {
      navbar.classList.remove("visible");
    }
  }
}
