// componentsLoader.js
// 用於載入共用元件（如 nav）到各頁面

function loadComponent(selector, url) {
  const el = document.querySelector(selector);
  if (!el) return Promise.resolve(); // 沒找到容器直接跳過

  return fetch(url)
    .then((res) => res.text())
    .then((html) => {
      el.innerHTML = html;
    });
}

document.addEventListener("DOMContentLoaded", function () {
  const repoName = window.location.pathname.split("/")[1];
  const baseURL = `${window.location.origin}/${repoName}`;

  // 等待 nav 載入完成後再綁事件
  loadComponent("#nav-container", baseURL + "/components/nav/nav.html").then(() => {
    initNavbarBehavior();
  });

  loadComponent(
    "#footer-container",
    baseURL + "/components/footer/footer.html"
  );
});

// === 導覽列滾動與滑鼠顯示控制 ===
function initNavbarBehavior() {
  const navbar = document.querySelector("#nav-container nav");
  if (!navbar) return;

  let lastScrollY = window.scrollY;
  let isMouseNearTop = false;

  // 初始狀態顯示
  navbar.classList.add("visible");

  // 滑鼠移動監聽：當靠近頂部顯示導覽列
  document.addEventListener("mousemove", (e) => {
    isMouseNearTop = e.clientY < 80;
    updateNavbarVisibility();
  });

  // 滾動監聽：根據滾動方向顯示/隱藏
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
