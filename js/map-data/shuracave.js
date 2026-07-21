// 🌟 1. 樓層與區塊對照表 (顯示在下拉選單中)
export const FLOOR_NAMES = {
    'shura-entrance': '修羅洞_入口',
    'shura-迷惘-A': '修羅洞_迷惘_A區',
    'shura-迷惘-B': '修羅洞_迷惘_B區',
    'shura-迷惘-C': '修羅洞_迷惘_C區',
    'shura-迷惘-D': '修羅洞_迷惘_D區',
    'shura-迷惘-F': '修羅洞_迷惘_E區',
    'shura-狂亂-A': '修羅洞_狂亂_A區',
    'shura-狂亂-B': '修羅洞_狂亂_B區',
    'shura-狂亂-C': '修羅洞_狂亂_C區',
    'shura-狂亂-D': '修羅洞_狂亂_D區',
    'shura-狂亂-E': '修羅洞_狂亂_E區',
    'shura-狂亂-F': '修羅洞_狂亂_F區',
    'shura-狂亂-G': '修羅洞_狂亂_G區',
    'shura-狂亂-H': '修羅洞_狂亂_H區',
    'shura-狂亂-I': '修羅洞_狂亂_I區',
    'shura-煉獄': '修羅洞_煉獄',
};

// 🌟 2. 區塊內部的傳點連通 (Internal Connections)
export const INTERNAL_CONNECTIONS = {
    // 入口大廳
    'shura-entrance': {
        'green-start': ['portal-A', 'portal-B', 'portal-C', 'portal-D', 'portal-E'],
        'portal-A': ['portal-B', 'portal-C', 'portal-D', 'portal-E'],
        'portal-B': ['portal-A', 'portal-C', 'portal-D', 'portal-E'],
        'portal-C': ['portal-A', 'portal-B', 'portal-D', 'portal-E'],
        'portal-D': ['portal-A', 'portal-B', 'portal-C', 'portal-E'],
        'portal-E': [] // 通往赤松林
    },

// 迷惘 - 左區 (A)
'shura-迷惘-A': {
    'portal-A': ['portal-b', 'portal-c', 'portal-d', 'portal-f'], 
    'portal-b': ['portal-A', 'portal-c', 'portal-d', 'portal-f'],
    'portal-c': ['portal-A', 'portal-b', 'portal-d', 'portal-f'],
    'portal-d': ['portal-A', 'portal-b', 'portal-c', 'portal-f'],
    'portal-f': ['portal-A', 'portal-b', 'portal-c', 'portal-d']
},

// 迷惘 - 下區 (B)
'shura-迷惘-B': {
    'portal-B': ['portal-a', 'portal-c', 'portal-d', 'portal-f'], 
    'portal-a': ['portal-B', 'portal-c', 'portal-d', 'portal-f'],
    'portal-c': ['portal-B', 'portal-a', 'portal-d', 'portal-f'],
    'portal-d': ['portal-B', 'portal-a', 'portal-c', 'portal-f'],
    'portal-f': ['portal-B', 'portal-a', 'portal-c', 'portal-d']
},

// 迷惘 - 右區 (C)
'shura-迷惘-C': {
    'portal-C': ['portal-a', 'portal-f', 'portal-b', 'portal-d'], 
    'portal-a': ['portal-C', 'portal-b', 'portal-d', 'portal-f'],
    'portal-b': ['portal-C', 'portal-a', 'portal-d', 'portal-f'],
    'portal-d': ['portal-C', 'portal-a', 'portal-b', 'portal-f'],
    'portal-f': ['portal-C', 'portal-a', 'portal-d', 'portal-b']
},

// 迷惘 - 上區 (D)
'shura-迷惘-D': {
    'portal-D': ['portal-a', 'portal-b', 'portal-c', 'portal-f'], 
    'portal-a': ['portal-D', 'portal-b', 'portal-c', 'portal-f'],
    'portal-b': ['portal-D', 'portal-a', 'portal-c', 'portal-f'],
    'portal-c': ['portal-D', 'portal-a', 'portal-b', 'portal-f'],
    'portal-f': ['portal-D', 'portal-a', 'portal-b', 'portal-c']
},

// 迷惘 - 中區 (F)
'shura-迷惘-F': {
    'portal-f': ['portal-A', 'portal-B'], 
    'portal-A': ['portal-f', 'portal-B'],
    'portal-B': ['portal-f', 'portal-A']
},

// 1. 左上角 (A區)
    'shura-狂亂-A': {
        'portal-b': ['portal-g', 'portal-A-white', 'portal-D-red'],
        'portal-g': ['portal-b', 'portal-A-white', 'portal-D-red'],
        'portal-A-white': ['portal-b', 'portal-g', 'portal-D-red'],
        'portal-D-red': ['portal-b', 'portal-g', 'portal-A-white']
    },

    // 2. 正中央 (B區 - 八卦核心房)
    'shura-狂亂-B': {
        'portal-B-red': ['portal-a', 'portal-c', 'portal-d', 'portal-e', 'portal-f', 'portal-g', 'portal-h', 'portal-i'],
        'portal-a': ['portal-B-red', 'portal-c', 'portal-d', 'portal-e', 'portal-f', 'portal-g', 'portal-h', 'portal-i'],
        'portal-c': ['portal-B-red', 'portal-a', 'portal-d', 'portal-e', 'portal-f', 'portal-g', 'portal-h', 'portal-i'],
        'portal-d': ['portal-B-red', 'portal-a', 'portal-c', 'portal-e', 'portal-f', 'portal-g', 'portal-h', 'portal-i'],
        'portal-e': ['portal-B-red', 'portal-a', 'portal-c', 'portal-d', 'portal-f', 'portal-g', 'portal-h', 'portal-i'],
        'portal-f': ['portal-B-red', 'portal-a', 'portal-c', 'portal-d', 'portal-e', 'portal-g', 'portal-h', 'portal-i'],
        'portal-g': ['portal-B-red', 'portal-a', 'portal-c', 'portal-d', 'portal-e', 'portal-f', 'portal-h', 'portal-i'],
        'portal-h': ['portal-B-red', 'portal-a', 'portal-c', 'portal-d', 'portal-e', 'portal-f', 'portal-g', 'portal-i'],
        'portal-i': ['portal-B-red', 'portal-a', 'portal-c', 'portal-d', 'portal-e', 'portal-f', 'portal-g', 'portal-h']
    },

    // 3. 中上方 (C區)
    'shura-狂亂-C': {
        'portal-b': ['portal-e', 'portal-A-white', 'portal-D-red'],
        'portal-e': ['portal-b', 'portal-A-white', 'portal-D-red'],
        'portal-A-white': ['portal-b', 'portal-e', 'portal-D-red'],
        'portal-D-red': ['portal-b', 'portal-e', 'portal-A-white']
    },

    // 4. 右上方 (D區 - 郝厲害房)
    'shura-狂亂-D': {
        'portal-i': ['portal-b', 'portal-A-white', 'portal-C-red'],
        'portal-b': ['portal-i', 'portal-A-white', 'portal-C-red'],
        'portal-A-white': ['portal-i', 'portal-b', 'portal-C-red'],
        'portal-C-red': ['portal-i', 'portal-b', 'portal-A-white']
    },

    // 5. 左中區 (E區)
    'shura-狂亂-E': {
        'portal-h': ['portal-b', 'portal-A-left', 'portal-A-right'],
        'portal-b': ['portal-h', 'portal-A-left', 'portal-A-right'],
        'portal-A-left': ['portal-h', 'portal-b', 'portal-A-right'],
        'portal-A-right': ['portal-h', 'portal-b', 'portal-A-left']
    },

    // 6. 右中區 (F區)
    'shura-狂亂-F': {
        'portal-b': ['portal-a', 'portal-A-white', 'portal-C-red'],
        'portal-a': ['portal-b', 'portal-A-white', 'portal-C-red'],
        'portal-A-white': ['portal-b', 'portal-a', 'portal-C-red'],
        'portal-C-red': ['portal-b', 'portal-a', 'portal-A-white']
    },

    // 7. 左下角 (G區)
    'shura-狂亂-G': {
        'portal-b': ['portal-d', 'portal-A-white', 'portal-A-red'],
        'portal-d': ['portal-b', 'portal-A-white', 'portal-A-red'],
        'portal-A-white': ['portal-b', 'portal-d', 'portal-A-red'],
        'portal-A-red': ['portal-b', 'portal-d', 'portal-A-white']
    },

    // 8. 中下方 (H區)
    'shura-狂亂-H': {
        'portal-f': ['portal-b', 'portal-A-white', 'portal-B-red'],
        'portal-b': ['portal-f', 'portal-A-white', 'portal-B-red'],
        'portal-A-white': ['portal-f', 'portal-b', 'portal-B-red'],
        'portal-B-red': ['portal-f', 'portal-b', 'portal-A-white']
    },

    // 9. 右下角 (I區 - 通往煉獄)
    'shura-狂亂-I': {
        'portal-b': ['portal-A-white', 'portal-B-red', 'portal-G-red'],
        'portal-A-white': ['portal-b', 'portal-B-red', 'portal-G-red'],
        'portal-B-red': ['portal-b', 'portal-A-white', 'portal-G-red'],
        'portal-G-red': ['portal-b', 'portal-A-white', 'portal-B-red'] // 🌟 紅色 G 通往煉獄
    }
};

// 🌟 3. 跨區塊 / 跨樓層傳送關係 (Portal Teleports)
export const PORTAL_TELEPORTS = {
    // ----------------------------------------------------
    // 0. 修羅洞入口
    // ----------------------------------------------------
    'shura-entrance': {
        'portal-A': { targetFloor: 'shura-迷惘-A', targetPortal: 'portal-A' },
        'portal-B': { targetFloor: 'shura-迷惘-B', targetPortal: 'portal-B' },
        'portal-C': { targetFloor: 'shura-迷惘-C', targetPortal: 'portal-C' },
        'portal-D': { targetFloor: 'shura-迷惘-D', targetPortal: 'portal-D' },
        'portal-E': { targetFloor: 'redwood-forest', targetPortal: 'green-start' } // 通往赤松林
    },

    // ----------------------------------------------------
    // 1. 修羅洞 - 迷惘區 (1~5區)
    // ----------------------------------------------------
    'shura-迷惘-A': {
        'portal-A': { targetFloor: 'shura-entrance', targetPortal: 'portal-A' },
        'portal-b': { targetFloor: 'shura-迷惘-B', targetPortal: 'portal-b' },
        'portal-c': { targetFloor: 'shura-迷惘-C', targetPortal: 'portal-c' },
        'portal-d': { targetFloor: 'shura-迷惘-D', targetPortal: 'portal-d' },
        'portal-f': { targetFloor: 'shura-迷惘-F', targetPortal: 'portal-f' }
    },
    'shura-迷惘-B': {
        'portal-B': { targetFloor: 'shura-狂亂-B', targetPortal: 'portal-B-red' }, // 通往狂亂 B 區
        'portal-a': { targetFloor: 'shura-迷惘-A', targetPortal: 'portal-a' },
        'portal-c': { targetFloor: 'shura-迷惘-C', targetPortal: 'portal-c' },
        'portal-d': { targetFloor: 'shura-迷惘-D', targetPortal: 'portal-d' },
        'portal-f': { targetFloor: 'shura-迷惘-F', targetPortal: 'portal-f' }
    },
    'shura-迷惘-C': {
        'portal-C': { targetFloor: 'shura-entrance', targetPortal: 'portal-C' },
        'portal-a': { targetFloor: 'shura-迷惘-A', targetPortal: 'portal-a' },
        'portal-b': { targetFloor: 'shura-迷惘-B', targetPortal: 'portal-b' },
        'portal-d': { targetFloor: 'shura-迷惘-D', targetPortal: 'portal-d' },
        'portal-f': { targetFloor: 'shura-迷惘-F', targetPortal: 'portal-f' }
    },
    'shura-迷惘-D': {
        'portal-D': { targetFloor: 'shura-entrance', targetPortal: 'portal-D' },
        'portal-a': { targetFloor: 'shura-迷惘-A', targetPortal: 'portal-a' },
        'portal-b': { targetFloor: 'shura-迷惘-B', targetPortal: 'portal-b' },
        'portal-c': { targetFloor: 'shura-迷惘-C', targetPortal: 'portal-c' },
        'portal-f': { targetFloor: 'shura-迷惘-F', targetPortal: 'portal-f' }
    },
    'shura-迷惘-F': {
        'portal-f': { targetFloor: 'shura-迷惘-A', targetPortal: 'portal-f' }, // 迷惘 5區回 1區
        'portal-A': { targetFloor: 'shura-entrance', targetPortal: 'portal-A' },
        'portal-B': { targetFloor: 'shura-狂亂-B', targetPortal: 'portal-B-red' }
    },

    // ----------------------------------------------------
    // 2. 修羅洞 - 狂亂區 (九宮格 A~I 區)
    // ----------------------------------------------------
    // A區 (左上)
    'shura-狂亂-A': {
        'portal-b': { targetFloor: 'shura-狂亂-B', targetPortal: 'portal-b' },
        'portal-g': { targetFloor: 'shura-狂亂-G', targetPortal: 'portal-g' },
        'portal-A-white': { targetFloor: 'shura-迷惘-A', targetPortal: 'portal-A' },
        'portal-D-red': { targetFloor: 'shura-迷惘-D', targetPortal: 'portal-D' }
    },
    // B區 (正中 - 核心)
    'shura-狂亂-B': {
        'portal-B-red': { targetFloor: 'shura-迷惘-B', targetPortal: 'portal-B' }, // 回迷惘 B
        'portal-a': { targetFloor: 'shura-狂亂-A', targetPortal: 'portal-a' },
        'portal-c': { targetFloor: 'shura-狂亂-C', targetPortal: 'portal-c' },
        'portal-d': { targetFloor: 'shura-狂亂-D', targetPortal: 'portal-d' },
        'portal-e': { targetFloor: 'shura-狂亂-E', targetPortal: 'portal-e' },
        'portal-f': { targetFloor: 'shura-狂亂-F', targetPortal: 'portal-f' },
        'portal-g': { targetFloor: 'shura-狂亂-G', targetPortal: 'portal-g' },
        'portal-h': { targetFloor: 'shura-狂亂-H', targetPortal: 'portal-h' },
        'portal-i': { targetFloor: 'shura-狂亂-I', targetPortal: 'portal-i' }
    },
    // C區 (中上)
    'shura-狂亂-C': {
        'portal-b': { targetFloor: 'shura-狂亂-B', targetPortal: 'portal-b' },
        'portal-e': { targetFloor: 'shura-狂亂-E', targetPortal: 'portal-e' },
        'portal-A-white': { targetFloor: 'shura-迷惘-A', targetPortal: 'portal-A' },
        'portal-D-red': { targetFloor: 'shura-迷惘-D', targetPortal: 'portal-D' }
    },
    // D區 (右上)
    'shura-狂亂-D': {
        'portal-i': { targetFloor: 'shura-狂亂-I', targetPortal: 'portal-i' },
        'portal-b': { targetFloor: 'shura-狂亂-B', targetPortal: 'portal-b' },
        'portal-A-white': { targetFloor: 'shura-迷惘-A', targetPortal: 'portal-A' },
        'portal-C-red': { targetFloor: 'shura-迷惘-C', targetPortal: 'portal-C' }
    },
    // E區 (左中)
    'shura-狂亂-E': {
        'portal-h': { targetFloor: 'shura-狂亂-H', targetPortal: 'portal-h' },
        'portal-b': { targetFloor: 'shura-狂亂-B', targetPortal: 'portal-b' },
        'portal-A-left': { targetFloor: 'shura-迷惘-A', targetPortal: 'portal-A' },
        'portal-A-right': { targetFloor: 'shura-迷惘-A', targetPortal: 'portal-A' }
    },
    // F區 (右中)
    'shura-狂亂-F': {
        'portal-b': { targetFloor: 'shura-狂亂-B', targetPortal: 'portal-b' },
        'portal-a': { targetFloor: 'shura-狂亂-A', targetPortal: 'portal-a' },
        'portal-A-white': { targetFloor: 'shura-迷惘-A', targetPortal: 'portal-A' },
        'portal-C-red': { targetFloor: 'shura-迷惘-C', targetPortal: 'portal-C' }
    },
    // G區 (左下)
    'shura-狂亂-G': {
        'portal-b': { targetFloor: 'shura-狂亂-B', targetPortal: 'portal-b' },
        'portal-d': { targetFloor: 'shura-狂亂-D', targetPortal: 'portal-d' },
        'portal-A-white': { targetFloor: 'shura-迷惘-A', targetPortal: 'portal-A' },
        'portal-A-red': { targetFloor: 'shura-迷惘-A', targetPortal: 'portal-A' }
    },
    // H區 (中下)
    'shura-狂亂-H': {
        'portal-f': { targetFloor: 'shura-狂亂-F', targetPortal: 'portal-f' },
        'portal-b': { targetFloor: 'shura-狂亂-B', targetPortal: 'portal-b' },
        'portal-A-white': { targetFloor: 'shura-迷惘-A', targetPortal: 'portal-A' },
        'portal-B-red': { targetFloor: 'shura-迷惘-B', targetPortal: 'portal-B' }
    },
    // I區 (右下)
    'shura-狂亂-I': {
        'portal-b': { targetFloor: 'shura-狂亂-B', targetPortal: 'portal-b' },
        'portal-A-white': { targetFloor: 'shura-迷惘-A', targetPortal: 'portal-A' },
        'portal-B-red': { targetFloor: 'shura-迷惘-B', targetPortal: 'portal-B' },
        'portal-G-red': { targetFloor: 'shura-煉獄', targetPortal: 'green-start' } // 🌟 進入煉獄層！
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