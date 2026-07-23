// \js\map-data\sewer.js

// 1. 樓層中文名稱映射
export const FLOOR_NAMES = {
    "sewer-1": "地下水道第1層",
    "sewer-2": "地下水道第2層",
    "sewer-3": "地下水道第3層",
    "sewer-4": "地下水道第4層"
};

// 2. 傳點中文標籤
export const PORTAL_LABELS = {
    "sewer-1": {
        "green-start": "🟢 汴水道 (入口)",
        "a": "a (往 汴水道)",
        "b": "b (往 2層B)",
        "c": "c (往 2層C)"
    },
    "sewer-2": {
        "b": "b (往 1層b)",
        "c": "c (往 1層c)",
        "d": "d (往 3層d)",
        "e": "e (往 3層e)",
        "f": "f (往 3層f)",
        "g": "g (往 3層g)",
        "h": "h (往 3層h)"
    },
    "sewer-3": {
        "d": "d (往 2層d)",
        "e": "e (往 2層e)",
        "f": "f (往 2層f)",
        "g": "g (往 2層g)",
        "h": "h (往 2層h)",
        "J": "J (往 同層k)",
        "k": "k (往 同層J)",
        "l": "l (往 4層l)",
        "m": "m (往 4層m)",
        "i": "i (往 4層i)",
        "n": "n (往 4層n)"
    },
    "sewer-4": {
        "l": "l (往 3層l)",
        "m": "m (往 3層m)",
        "n": "n (往 3層n)",
        "i": "i (往 3層i)"
    }
};

// 3. 內部雙向圖連通表 (內部最短路徑演算法的核心)
export const INTERNAL_CONNECTIONS = {
    "sewer-1": {
        "green-start": ["a", "b", "c"],
        "a": ["green-start", "b", "c"],
        "b": ["green-start", "a", "c"],
        "c": ["green-start", "a", "b"]
    },
    "sewer-2": {
        // 2層為非全連通區域：
        // 區塊1: b ↔ d
        // 區塊2: c (獨立)
        // 區塊3: f ↔ e
        // 區塊4: g ↔ h
        "b": ["d"],
        "d": ["b"],
        "c": [],
        "e": ["f"],
        "f": ["e"],
        "g": ["h"],
        "h": ["g"]
    },
    "sewer-3": {
        // 3層為迷宮大區域，外圍廊道與中央迷宮連通
        // 特別注意：J 與 k 是同層對傳點！
        "d": ["e", "J"],
        "e": ["d", "J"],
        "f": ["g"],
        "g": ["f"],
        "h": ["i", "n"],
        "J": ["d", "e"],
        "k": ["l", "m"],
        "l": ["m", "k"],
        "m": ["l", "k"],
        "i": ["n","h"],
        "n": ["i","h"]
    },
    "sewer-4": {
        // 4層為4個獨立房間 (l, m, n, i)
        "l": [],
        "m": [],
        "n": [],
        "i": []
    }
};

// 4. 跨樓層傳送對應表
export const PORTAL_DESTINATIONS = {
    "sewer-1": {
        "b": { targetFloor: "floor-2", targetPortal: "b" },
        "c": { targetFloor: "floor-2", targetPortal: "c" }
    },
    "sewer-2": {
        "b": { targetFloor: "floor-1", targetPortal: "b" },
        "c": { targetFloor: "floor-1", targetPortal: "c" },
        "d": { targetFloor: "floor-3", targetPortal: "d" },
        "e": { targetFloor: "floor-3", targetPortal: "e" },
        "f": { targetFloor: "floor-3", targetPortal: "f" },
        "g": { targetFloor: "floor-3", targetPortal: "g" },
        "h": { targetFloor: "floor-3", targetPortal: "h" }
    },
    "sewer-3": {
        "d": { targetFloor: "floor-2", targetPortal: "d" },
        "e": { targetFloor: "floor-2", targetPortal: "e" },
        "f": { targetFloor: "floor-2", targetPortal: "f" },
        "g": { targetFloor: "floor-2", targetPortal: "g" },
        "h": { targetFloor: "floor-2", targetPortal: "h" },
        "J": { targetFloor: "floor-3", targetPortal: "k" }, // 同層互傳
        "k": { targetFloor: "floor-3", targetPortal: "J" }, // 同層互傳
        "l": { targetFloor: "floor-4", targetPortal: "l" },
        "m": { targetFloor: "floor-4", targetPortal: "m" },
        "i": { targetFloor: "floor-4", targetPortal: "i" },
        "n": { targetFloor: "floor-4", targetPortal: "n" }
    },
    "sewer-4": {
        "l": { targetFloor: "floor-3", targetPortal: "l" },
        "m": { targetFloor: "floor-3", targetPortal: "m" },
        "n": { targetFloor: "floor-3", targetPortal: "n" },
        "i": { targetFloor: "floor-3", targetPortal: "i" }
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

// 5. 渲染傳點下拉選單的函數 (已修復變數名稱為 PORTAL_DESTINATIONS)
export function updatePortalOptions(floorKey, selectElement) {
    selectElement.innerHTML = ''; // 清空舊選項

    // 優先從 INTERNAL_CONNECTIONS 與 PORTAL_DESTINATIONS 收集該樓層所有可用傳點
    const internalKeys = Object.keys(INTERNAL_CONNECTIONS[floorKey] || {});
    const destinationKeys = Object.keys(PORTAL_DESTINATIONS[floorKey] || {});
    const availablePortals = Array.from(new Set([...internalKeys, ...destinationKeys]));

    availablePortals.forEach(portalKey => {
        const option = document.createElement('option');
        option.value = portalKey;
        
        // 優先讀取 PORTAL_LABELS 中文名稱
        const labelText = PORTAL_LABELS[floorKey]?.[portalKey] || portalKey;
        
        option.textContent = labelText;
        selectElement.appendChild(option);
    });
}