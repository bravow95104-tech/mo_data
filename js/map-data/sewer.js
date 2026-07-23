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
        "a": "a (往 拓水道)",
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

// 3. 內部雙向圖連通表
export const INTERNAL_CONNECTIONS = {
    "sewer-1": {
        "green-start": ["a", "b", "c"],
        "a": ["b", "c"],
        "b": ["a", "c"],
        "c": ["a", "b"]
    },
    "sewer-2": {
        "b": ["d"],
        "d": ["b"],
        "c": [],
        "e": ["f"],
        "f": ["e"],
        "g": ["h"],
        "h": ["g"]
    },
    "sewer-3": {
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
        "l": [],
        "m": [],
        "n": [],
        "i": []
    }
};

// 4. 跨樓層傳送對應表 (已全數修復為 sewer-1 ~ sewer-4)
export const PORTAL_DESTINATIONS = {
    "sewer-1": {
        "b": { targetFloor: "sewer-2", targetPortal: "b" },
        "c": { targetFloor: "sewer-2", targetPortal: "c" }
    },
    "sewer-2": {
        "b": { targetFloor: "sewer-1", targetPortal: "b" },
        "c": { targetFloor: "sewer-1", targetPortal: "c" },
        "d": { targetFloor: "sewer-3", targetPortal: "d" },
        "e": { targetFloor: "sewer-3", targetPortal: "e" },
        "f": { targetFloor: "sewer-3", targetPortal: "f" },
        "g": { targetFloor: "sewer-3", targetPortal: "g" },
        "h": { targetFloor: "sewer-3", targetPortal: "h" }
    },
    "sewer-3": {
        "d": { targetFloor: "sewer-2", targetPortal: "d" },
        "e": { targetFloor: "sewer-2", targetPortal: "e" },
        "f": { targetFloor: "sewer-2", targetPortal: "f" },
        "g": { targetFloor: "sewer-2", targetPortal: "g" },
        "h": { targetFloor: "sewer-2", targetPortal: "h" },
        "J": { targetFloor: "sewer-3", targetPortal: "k" },
        "k": { targetFloor: "sewer-3", targetPortal: "J" },
        "l": { targetFloor: "sewer-4", targetPortal: "l" },
        "m": { targetFloor: "sewer-4", targetPortal: "m" },
        "i": { targetFloor: "sewer-4", targetPortal: "i" },
        "n": { targetFloor: "sewer-4", targetPortal: "n" }
    },
    "sewer-4": {
        "l": { targetFloor: "sewer-3", targetPortal: "l" },
        "m": { targetFloor: "sewer-3", targetPortal: "m" },
        "n": { targetFloor: "sewer-3", targetPortal: "n" },
        "i": { targetFloor: "sewer-3", targetPortal: "i" }
    }
};

/**
 * 全功能精準尋路演算法 (支援指定起點/終點傳點)
 */
export function findRealShortestPath(startFloor, endFloor, startPortal = 'green-start', endPortal = null) {
    if (startFloor === endFloor && startPortal === endPortal && startPortal !== null) return [];

    let queue = [[startFloor, startPortal, []]];
    let visited = new Set();

    while (queue.length > 0) {
        let [curFloor, curPortal, path] = queue.shift();

        const stateKey = `${curFloor}:${curPortal}`;
        if (visited.has(stateKey)) continue;
        visited.add(stateKey);

        // 1. 取得當前點「步行」能到的傳點清單
        let availablePortals = [];
        if (curPortal === null) {
            availablePortals = Object.keys(PORTAL_DESTINATIONS[curFloor] || {});
        } else {
            const reachableInternal = INTERNAL_CONNECTIONS[curFloor]?.[curPortal] || [];
            availablePortals = Array.from(new Set([curPortal, ...reachableInternal]));
        }

        // 2. 嘗試踏上傳點並進行「跨樓層傳送」
        for (let pCode of availablePortals) {
            // 特殊判定：如果目標就是當前樓層的某個傳點
            if (curFloor === endFloor && endPortal && pCode === endPortal) {
                return [...path, {
                    fromFloor: curFloor,
                    walkToPortal: pCode,
                    toFloor: curFloor,
                    targetPortal: pCode,
                    isFinalWalk: true
                }];
            }

            const teleportInfo = PORTAL_DESTINATIONS[curFloor]?.[pCode];
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

            // 終點判定
            if (nextFloor === endFloor) {
                if (!endPortal || nextPortal === endPortal) {
                    return newPath;
                }
            }

            queue.push([nextFloor, nextPortal, newPath]);
        }
    }

    return null;
}

/**
 * 將演算法回傳的路徑轉化為文字說明
 */
export function formatPathInstructions(pathSteps) {
    if (!pathSteps || pathSteps.length === 0) return '已在目的地或無可用路線';

    let outputHtml = `💡 <b>從「${FLOOR_NAMES[pathSteps[0].fromFloor]}」前往「${FLOOR_NAMES[pathSteps[pathSteps.length - 1].toFloor]}」的最佳走法：</b><br><br>`;

    pathSteps.forEach((step, index) => {
        const fromFloorName = FLOOR_NAMES[step.fromFloor] || step.fromFloor;
        const toFloorName = FLOOR_NAMES[step.toFloor] || step.toFloor;
        
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

// 5. 渲染傳點下拉選單的函數
export function updatePortalOptions(floorKey, selectElement) {
    selectElement.innerHTML = ''; 

    const internalKeys = Object.keys(INTERNAL_CONNECTIONS[floorKey] || {});
    const destinationKeys = Object.keys(PORTAL_DESTINATIONS[floorKey] || {});
    const availablePortals = Array.from(new Set([...internalKeys, ...destinationKeys]));

    availablePortals.forEach(portalKey => {
        const option = document.createElement('option');
        option.value = portalKey;
        
        const labelText = PORTAL_LABELS[floorKey]?.[portalKey] || portalKey;
        
        option.textContent = labelText;
        selectElement.appendChild(option);
    });
}