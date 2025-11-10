document.addEventListener("DOMContentLoaded", () => {
  let mapsData = [];

  // 載入 JSON 資料
  fetch("/mo_data/data/detailed_map.json")
    .then(response => response.json())
    .then(data => {
      mapsData = data;
      renderTable(mapsData);
    })
    .catch(error => {
      console.error("載入地圖資料錯誤:", error);
      const tbody = document.querySelector("#heroes-table tbody");
      tbody.innerHTML = '<tr><td colspan="15">無法載入地圖資料</td></tr>';
    });

  // 搜尋框邏輯
  const searchInput = document.getElementById("searchInput");
  searchInput.addEventListener("input", () => {
    const keyword = searchInput.value.trim().toLowerCase();

    const filtered = mapsData.filter(map => {
      const targetFields = [
        map.mapid,
        map.traits,
        map.drop_glory_high,
        map.drop_glory_low,
        map.player
      ]
        .join(" ")
        .toLowerCase();

      return targetFields.includes(keyword);
    });

    renderTable(filtered);
  });

  // 產生表格
  function renderTable(data) {
    const tbody = document.querySelector("#heroes-table tbody");
    tbody.innerHTML = "";

    const keyword = searchInput.value.trim().toLowerCase();

    if (data.length === 0) {
      tbody.innerHTML = '<tr><td colspan="15">找不到符合條件的地圖</td></tr>';
      return;
    }

    data.forEach(map => {
      const tr = document.createElement("tr");
      const fields = ["mapid"];

      fields.forEach(field => {
        const td = document.createElement("td");
        const value = map[field] !== undefined ? String(map[field]) : "";

        if (keyword && value.toLowerCase().includes(keyword)) {
          const regex = new RegExp(`(${keyword})`, "gi");
          td.innerHTML = value.replace(regex, '<span class="highlight2">$1</span>');
        } else {
          td.textContent = value;
        }

        tr.appendChild(td);
      });

      // 點擊列 → 顯示詳細視窗
      tr.addEventListener("click", () => showDetailModal(map));

      tbody.appendChild(tr);
    });
  }

  // === Modal ===
  function showDetailModal(map) {
    const overlay = document.getElementById("modalOverlay");
    const modalBox = document.getElementById("modalBox");
    const contentDiv = document.getElementById("modalContent");

    // 安全檔名
    const safeName = map.name ? map.name.replace(/[^\w\u4e00-\u9fa5]/g, "") : "unknown";

    // 建立可回退圖片
    function createImageWithFallbacks(basePath, altText) {
      const extensions = [".png", ".bmp", ".jpg"];
      let attempt = 0;

      const img = document.createElement("img");
      img.alt = altText;
      img.style.objectFit = "contain";
      img.style.maxWidth = "100%";

      function tryNext() {
        img.src = basePath + extensions[attempt];
        img.onerror = () => {
          attempt++;
          if (attempt < extensions.length) {
            tryNext();
          } else {
            img.src = "/mo_data/pic/maps/no_image.jpg"; // 全部失敗時用預設圖
          }
        };
      }

      tryNext();
      return img;
    }

    const baseFront = `/mo_data/pic/maps/${safeName}`;
    const frontImage = createImageWithFallbacks(baseFront, `${map.name} 地圖`);

    const imgContainer = document.createElement("div");
    imgContainer.className = "map-images";
    imgContainer.style.display = "flex";
    imgContainer.style.gap = "10px";
    imgContainer.style.marginBottom = "20px";
    imgContainer.appendChild(frontImage);

    // Modal 主內容
    contentDiv.innerHTML = `
      <h2 class="map-name">${map.name || map.mapid || "未知地圖"}</h2>
    `;
    contentDiv.appendChild(imgContainer);

    const detailHTML = `
      <div class="map-details">
        <p><strong>光輝掉落（掉落較多）：</strong>${map.drop_glory_high || "—"}</p>
        <p class="section-gap"><strong>光輝掉落（掉落較低）：</strong>${map.drop_glory_low || "—"}</p>
        <p class="section-gap"><strong>光輝掉落（玩家提供）：</strong>${map.player || "—"}</p>
      </div>
    `;

    contentDiv.insertAdjacentHTML("beforeend", detailHTML);

    overlay.style.display = "block";
    modalBox.style.display = "block";
  }

  // 關閉 Modal
  const closeBtn = document.querySelector("#modalBox .close-btn");
  closeBtn.addEventListener("click", closeModal);
  document.getElementById("modalOverlay").addEventListener("click", closeModal);

  function closeModal() {
    document.getElementById("modalOverlay").style.display = "none";
    document.getElementById("modalBox").style.display = "none";
  }


  // 清除篩選
  document.getElementById("clearFilters").addEventListener("click", () => {
    renderTable(mapsData);
    searchInput.value = "";
    document.querySelectorAll(".filter-btn").forEach(btn => btn.classList.remove("active"));

    document.querySelectorAll(".highlight, .highlight2").forEach(el => {
      const parent = el.parentNode;
      parent.replaceChild(document.createTextNode(el.textContent), el);
      parent.normalize();
    });
  });

  // Accordion
  document.querySelectorAll(".accordion-header").forEach(header => {
    header.addEventListener("click", () => {
      header.parentElement.classList.toggle("collapsed");
    });
  });
});
