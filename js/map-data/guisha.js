// 🌟 1. 樓層與區塊對照表
export const FLOOR_NAMES = {
    'guisha-1': '鬼煞洞第一層',
    'guisha-2': '鬼煞洞第二層',
    'guisha-3': '鬼煞洞第三層',
};

// 🌟 2. 傳點中文標籤表 (改用字母標示)
export const PORTAL_LABELS = {
    'guisha-1': {
        'green-start': '🟢 飛鶴山 (入口)',
        'portal-feishan': '飛鶴山',
        'portal-guigu': '鬼谷仙人居',
        'portal-A': '傳點 A (右上 - 往二層)',
        'portal-B': '傳點 B (左上 - 往二層)',
        'portal-C': '傳點 C (右中 - 往二層)',
        'portal-D': '傳點 D (左中 - 往二層)',
        'portal-E': '傳點 E (右下 - 往二層)',
        'portal-F': '傳點 F (左下 - 往二層)',
    },
    'guisha-2': {
        'portal-A': '傳點 A (右上 - 往一層)',
        'portal-B': '傳點 B (左上 - 往一層)',
        'portal-C': '傳點 C (右中 - 往一層)',
        'portal-D': '傳點 D (左中 - 往一層)',
        'portal-E': '傳點 E (右下 - 往一層)',
        'portal-F': '傳點 F (左下 - 往一層)',
        'portal-3': '鬼煞洞第三層 (正上)',
    },
    'guisha-3': {
        'portal-2': '鬼煞洞第二層 (正下)',
    }
};

// 🌟 3. 樓層內部連通關係
export const INTERNAL_CONNECTIONS = {
    'guisha-1': {
        'green-start': ['portal-feishan', 'portal-guigu', 'portal-A', 'portal-B', 'portal-C', 'portal-D', 'portal-E', 'portal-F'],
        'portal-feishan': ['portal-guigu', 'portal-A', 'portal-B', 'portal-C', 'portal-D', 'portal-E', 'portal-F'],
        'portal-guigu': ['portal-feishan', 'portal-A', 'portal-B', 'portal-C', 'portal-D', 'portal-E', 'portal-F'],
        'portal-A': ['portal-feishan', 'portal-guigu', 'portal-B', 'portal-C', 'portal-D', 'portal-E', 'portal-F'],
        'portal-B': ['portal-feishan', 'portal-guigu', 'portal-A', 'portal-C', 'portal-D', 'portal-E', 'portal-F'],
        'portal-C': ['portal-feishan', 'portal-guigu', 'portal-A', 'portal-B', 'portal-D', 'portal-E', 'portal-F'],
        'portal-D': ['portal-feishan', 'portal-guigu', 'portal-A', 'portal-B', 'portal-C', 'portal-E', 'portal-F'],
        'portal-E': ['portal-feishan', 'portal-guigu', 'portal-A', 'portal-B', 'portal-C', 'portal-D', 'portal-F'],
        'portal-F': ['portal-feishan', 'portal-guigu', 'portal-A', 'portal-B', 'portal-C', 'portal-D', 'portal-E'],
    },
    'guisha-2': {
        'portal-A': ['portal-B', 'portal-C', 'portal-D', 'portal-E', 'portal-F', 'portal-3'],
        'portal-B': ['portal-A', 'portal-C', 'portal-D', 'portal-E', 'portal-F', 'portal-3'],
        'portal-C': ['portal-A', 'portal-B', 'portal-D', 'portal-E', 'portal-F', 'portal-3'],
        'portal-D': ['portal-A', 'portal-B', 'portal-C', 'portal-E', 'portal-F', 'portal-3'],
        'portal-E': ['portal-A', 'portal-B', 'portal-C', 'portal-D', 'portal-F', 'portal-3'],
        'portal-F': ['portal-A', 'portal-B', 'portal-C', 'portal-D', 'portal-E', 'portal-3'],
        'portal-3': ['portal-A', 'portal-B', 'portal-C', 'portal-D', 'portal-E', 'portal-F'],
    },
    'guisha-3': {
        'green-start': ['portal-2'],
        'portal-2': ['green-start'],
    }
};

// 🌟 4. 跨樓層對應關係 (同名 Portal 直接對接，邏輯極度清晰)
export const PORTAL_TELEPORTS = {
    'guisha-1': {
        'portal-feishan': { targetFloor: 'feishan', targetPortal: 'green-start' },
        'portal-guigu':   { targetFloor: 'guigu-home', targetPortal: 'green-start' },
        'portal-A':       { targetFloor: 'guisha-2', targetPortal: 'portal-A' },
        'portal-B':       { targetFloor: 'guisha-2', targetPortal: 'portal-B' },
        'portal-C':       { targetFloor: 'guisha-2', targetPortal: 'portal-C' },
        'portal-D':       { targetFloor: 'guisha-2', targetPortal: 'portal-D' },
        'portal-E':       { targetFloor: 'guisha-2', targetPortal: 'portal-E' },
        'portal-F':       { targetFloor: 'guisha-2', targetPortal: 'portal-F' },
    },
    'guisha-2': {
        'portal-A': { targetFloor: 'guisha-1', targetPortal: 'portal-A' },
        'portal-B': { targetFloor: 'guisha-1', targetPortal: 'portal-B' },
        'portal-C': { targetFloor: 'guisha-1', targetPortal: 'portal-C' },
        'portal-D': { targetFloor: 'guisha-1', targetPortal: 'portal-D' },
        'portal-E': { targetFloor: 'guisha-1', targetPortal: 'portal-E' },
        'portal-F': { targetFloor: 'guisha-1', targetPortal: 'portal-F' },
        'portal-3': { targetFloor: 'guisha-3', targetPortal: 'portal-2' },
    },
    'guisha-3': {
        'portal-2': { targetFloor: 'guisha-2', targetPortal: 'portal-3' },
    }
};


/**
 * 精確考量「同圖步行」與「跨圖傳送」的最短路徑演算法 (支援 green-start 入口)
 */
/**
 * 全功能精準尋路演算法 (支援指定起點/終點傳點)
 * @param {string} startFloor 起始樓層 (例: 'floor-corridor')
 * @param {string} endFloor 目標樓層 (例: 'floor-main')
 * @param {string|null} startPortal 起始傳點 (例: 'red-H' 或 'green-start'，若給 null 則自動允許任意起點)
 * @param {string|null} endPortal 目標傳點 (例: 'red-K'，若給 null 則只要抵達 endFloor 即可)
 */
export function findRealShortestPath(startFloor, endFloor, startPortal = 'green-start', endPortal = null) {
    // 如果起終點樓層與傳點完全相同，不用走
    if (startFloor === endFloor && startPortal === endPortal && startPortal !== null) return [];

    // Queue 結構：[當前樓層, 當前所在的傳點, 路徑歷史]
    let queue = [[startFloor, startPortal, []]];
    let visited = new Set();

    while (queue.length > 0) {
        let [curFloor, curPortal, path] = queue.shift();

        console.log(`🔍 搜尋中：當前樓層 [${curFloor}] | 當前傳點 [${curPortal}]`);

        const stateKey = `${curFloor}:${curPortal}`;
        if (visited.has(stateKey)) continue;
        visited.add(stateKey);

        // 1. 取得當前點「步行」能到的傳點清單
        let availablePortals = [];
        if (curPortal === null) {
            // 未指定起點傳點時，開放該圖所有傳點作為起點
            availablePortals = Object.keys(PORTAL_TELEPORTS[curFloor] || {});
        } else {
            const reachableInternal = INTERNAL_CONNECTIONS[curFloor]?.[curPortal] || [];
            availablePortals = Array.from(new Set([curPortal, ...reachableInternal]));
        }

        // 2. 嘗試踏上傳點並進行「跨樓層傳送」
        for (let pCode of availablePortals) {
            // 🎯 特殊判定：如果目標就是「當前樓層的某個傳點」（例如在同樓層走路就到了目標點）
            if (curFloor === endFloor && endPortal && pCode === endPortal) {
                return [...path, {
                    fromFloor: curFloor,
                    walkToPortal: pCode,
                    toFloor: curFloor,
                    targetPortal: pCode,
                    isFinalWalk: true // 標記為步行抵達終點
                }];
            }

            const teleportInfo = PORTAL_TELEPORTS[curFloor]?.[pCode];
            if (!teleportInfo) continue;

            const nextFloor = teleportInfo.targetFloor;
            const nextPortal = teleportInfo.targetPortal;

            const newStep = {
                fromFloor: curFloor,
                walkToPortal: pCode,
                toFloor: nextFloor,
                targetPortal: nextPortal
            };

            const newPath = [...path, newStep];

            // 🎯 終點判定：
            // 情況 A：指定了 endPortal -> 傳送過去的目標樓層 AND 目標傳點都要對上
            // 情況 B：沒指定 endPortal -> 只要目標樓層對上即可
            if (nextFloor === endFloor) {
                if (!endPortal || nextPortal === endPortal) {
                    return newPath;
                }
            }

            queue.push([nextFloor, nextPortal, newPath]);
        }
    }

    return null; // 找不到連通路線
}

/**
 * 將演算法回傳的路徑轉化為玩家看得懂的步驟說明
 */
export function formatPathInstructions(pathSteps) {
    if (!pathSteps || pathSteps.length === 0) return '已在目的地或無可用路線';

    let outputHtml = `💡 <b>從「${FLOOR_NAMES[pathSteps[0].fromFloor]}」前往「${FLOOR_NAMES[pathSteps[pathSteps.length - 1].toFloor]}」的最佳走法：</b><br><br>`;

    pathSteps.forEach((step, index) => {
        const fromFloorName = FLOOR_NAMES[step.fromFloor] || step.fromFloor;
        const toFloorName = FLOOR_NAMES[step.toFloor] || step.toFloor;
        
        // 優先讀取對照表名稱，沒有的話就顯示原本 key
        const portalLabel = PORTAL_LABELS[step.fromFloor]?.[step.walkToPortal] 
                          || `傳點 [${step.walkToPortal}]`;

        if (step.isFinalWalk) {
            outputHtml += `${index + 1}. 在 <b>${fromFloorName}</b> 內部走到 <b>${portalLabel}</b> 抵達目的地。<br>`;
        } else {
            outputHtml += `${index + 1}. 在 <b>${fromFloorName}</b> 踩 <b>${portalLabel}</b> ➔ 進入 <b>${toFloorName}</b><br>`;
        }
    });

    return outputHtml;
}

// 渲染傳點下拉選單的函數
function updatePortalOptions(floorKey, selectElement) {
    selectElement.innerHTML = ''; // 清空舊選項

    // 取得該樓層的所有傳點 key
    const availablePortals = Object.keys(PORTAL_TELEPORTS[floorKey] || {});

    availablePortals.forEach(portalKey => {
        const option = document.createElement('option');
        option.value = portalKey; // 傳給演算法計算的依然是 key (如 'portal-A-white')
        
        // 🌟 核心修改：優先讀取 PORTAL_LABELS 中文名稱，若找不到才顯示原本 key
        const labelText = PORTAL_LABELS[floorKey]?.[portalKey] || portalKey;
        
        option.textContent = labelText; // 👈 這裡改顯示中文名稱！
        selectElement.appendChild(option);
    });
}