// \js\map-data\sewer.js

// 1. 樓層中文名稱映射
export const FLOOR_NAMES = {
    "floor-1": "地下水道第1層",
    "floor-2": "地下水道第2層",
    "floor-3": "地下水道第3層",
    "floor-4": "地下水道第4層"
};

// 2. 傳點中文標籤 (當演算法印出路線時顯示)
export const PORTAL_LABELS = {
    "floor-1": {
        "a": "a (往 拓水道)",
        "b": "b (往 2層B)",
        "c": "c (往 2層C)"
    },
    "floor-2": {
        "b": "b (往 1層b)",
        "c": "c (往 1層c)",
        "d": "d (往 3層d)",
        "e": "e (往 3層e)",
        "f": "f (往 3層f)",
        "g": "g (往 3層g)",
        "h": "h (往 3層h)"
    },
    "floor-3": {
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
    "floor-4": {
        "l": "l (往 3層l)",
        "m": "m (往 3層m)",
        "n": "n (往 3層n)",
        "i": "i (往 3層i)"
    }
};

// 3. 內部雙向圖連通表 (內部最短路徑演算法的核心)
export const INTERNAL_CONNECTIONS = {
    "floor-1": {
        "green-start": ["a", "b", "c"],
        "a": ["green-start", "b", "c"],
        "b": ["green-start", "a", "c"],
        "c": ["green-start", "a", "b"]
    },
    "floor-2": {
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
    "floor-3": {
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
    "floor-4": {
        // 4層為4個獨立房間 (l, m, n, i)
        "l": [],
        "m": [],
        "n": [],
        "i": []
    }
};

// 4. 跨樓層傳送對應表
export const PORTAL_DESTINATIONS = {
    "floor-1": {
        "b": { targetFloor: "floor-2", targetPortal: "b" },
        "c": { targetFloor: "floor-2", targetPortal: "c" }
    },
    "floor-2": {
        "b": { targetFloor: "floor-1", targetPortal: "b" },
        "c": { targetFloor: "floor-1", targetPortal: "c" },
        "d": { targetFloor: "floor-3", targetPortal: "d" },
        "e": { targetFloor: "floor-3", targetPortal: "e" },
        "f": { targetFloor: "floor-3", targetPortal: "f" },
        "g": { targetFloor: "floor-3", targetPortal: "g" },
        "h": { targetFloor: "floor-3", targetPortal: "h" }
    },
    "floor-3": {
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
    "floor-4": {
        "l": { targetFloor: "floor-3", targetPortal: "l" },
        "m": { targetFloor: "floor-3", targetPortal: "m" },
        "n": { targetFloor: "floor-3", targetPortal: "n" },
        "i": { targetFloor: "floor-3", targetPortal: "i" }
    }
};

// 5. 最短路徑演算法 (BFS)
export function findRealShortestPath(startFloor, endFloor, startPortal = 'green-start', endPortal = null) {
    if (startFloor === endFloor && startPortal === endPortal) return [];

    const queue = [{
        currentFloor: startFloor,
        currentPortal: startPortal,
        path: []
    }];

    const visited = new Set();
    visited.add(`${startFloor}_${startPortal}`);

    while (queue.length > 0) {
        const { currentFloor, currentPortal, path } = queue.shift();

        // 判斷是否抵達終點
        if (currentFloor === endFloor) {
            if (!endPortal || currentPortal === endPortal) {
                return path;
            }
        }

        // 1. 同層移動 (Internal Move)
        const possiblePortals = INTERNAL_CONNECTIONS[currentFloor]?.[currentPortal] || [];
        for (const nextPortal of possiblePortals) {
            const stateKey = `${currentFloor}_${nextPortal}`;
            if (!visited.has(stateKey)) {
                visited.add(stateKey);

                const newPath = [
                    ...path,
                    {
                        fromFloor: currentFloor,
                        toFloor: currentFloor,
                        walkToPortal: nextPortal,
                        isFinalWalk: (currentFloor === endFloor && (!endPortal || nextPortal === endPortal))
                    }
                ];

                if (currentFloor === endFloor && (!endPortal || nextPortal === endPortal)) {
                    return newPath;
                }

                queue.push({
                    currentFloor: currentFloor,
                    currentPortal: nextPortal,
                    path: newPath
                });
            }
        }

        // 2. 跨樓層/傳送點移動 (Cross Portal Move)
        const dest = PORTAL_DESTINATIONS[currentFloor]?.[currentPortal];
        if (dest) {
            const stateKey = `${dest.targetFloor}_${dest.targetPortal}`;
            if (!visited.has(stateKey)) {
                visited.add(stateKey);

                const newPath = [
                    ...path,
                    {
                        fromFloor: currentFloor,
                        toFloor: dest.targetFloor,
                        walkToPortal: currentPortal,
                        isFinalWalk: false
                    }
                ];

                queue.push({
                    currentFloor: dest.targetFloor,
                    currentPortal: dest.targetPortal,
                    path: newPath
                });
            }
        }
    }

    return null; // 找不到路徑
}