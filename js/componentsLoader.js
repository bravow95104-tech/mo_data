// componentsLoader.js
// 用於載入共用元件（如 nav）到各頁面

function loadComponent(selector, url) {
  const el = document.querySelector(selector);
  if (el) {
    fetch(url)
      .then((res) => res.text())
      .then((html) => {
        el.innerHTML = html;
      });
  }
}

// 自動載入 nav（如有需要可擴充更多元件）
document.addEventListener("DOMContentLoaded", function () {
  const repoName = window.location.pathname.split("/")[1]; // 只取 repo 名
  const baseURL = `${window.location.origin}/${repoName}`;
  // const baseURL = ``;


  loadComponent("#nav-container", baseURL + "/components/nav/nav.html");
  loadComponent(
    "#footer-container",
    baseURL + "/components/footer/footer.html"
  );
});
