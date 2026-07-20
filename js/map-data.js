// /mo_data/js/map-data.js

export const FLOOR_NAMES = {
    'floor-front': '皇陵前殿',
    'floor-mid': '皇陵中殿',
    'floor-corridor': '皇陵迴廊',
    'floor-path': '皇陵通道',
    'floor-main': '皇陵正殿'
};

/**
 * 樓層內部連通表 (根據地圖牆壁與走道實際狀況設定)
 * 代表玩家站在某傳點時，在該地圖內「走路」能到達的其他傳點
 */
export const INTERNAL_CONNECTIONS = {
    'floor-front': {
        // 假設前殿是一整區，所有傳點彼此都能走通
        'green-start': ['red-A', 'red-B', 'red-D'],
        'red-A': ['red-B', 'red-D',],
        'red-B': ['red-A', 'red-D',],
        'red-C': ['red-F'],
        'red-D': ['red-A', 'red-B'],
        'red-F': ['red-C'],
    },
    'floor-mid': {
        // 🌟 這裡就是關鍵！根據地圖真實障礙物來設：
        // 例如：A, B, F 是一區；C, D, E 是一區；G, J 是一區（彼此不通）
        'red-A': ['red-B', 'red-C'],
        'red-B': ['red-A', 'red-C'],
        'red-F': ['red-G'],

        'red-C': ['red-A', 'red-B'],
        'red-D': ['red-E'],
        'red-E': ['red-D'], // 要去 E，必須從 C 或 D 近進來！

        'red-G': ['red-F'],
        'red-J': []
    },
    'floor-corridor': {
        'red-G': ['yellow-A', 'yellow-C','red-H'],
        'red-J': ['red-I'],
        'red-H': ['yellow-A', 'yellow-C','red-G'],
        'red-I': ['red-J'],
        'red-E': [],

        'yellow-A': ['yellow-C','red-G','red-H'],
        'yellow-B': [],
        'yellow-C': ['yellow-A', 'red-G','red-H'],
        'yellow-D': []
    },
    'floor-path': {
        'red-H': ['red-I', 'red-K'],
        'red-I': ['red-H', 'red-K'],
        'red-K': ['red-H', 'red-I'],
        'yellow-A': ['yellow-B'],
        'yellow-B': ['yellow-A'],
        'yellow-C': ['yellow-D'],
        'yellow-D': ['yellow-C']
    },
    'floor-main': {
        'red-K': []
    }
};

/**
 * 跨樓層傳點傳送關係 (Portal Teleports)
 * 點擊該傳點，會直接傳送到目標樓層的同名傳點
 */
export const PORTAL_TELEPORTS = {
    'floor-front': {/**前**/
        'red-A': { targetFloor: 'floor-mid', targetPortal: 'red-A' },
        'red-B': { targetFloor: 'floor-mid', targetPortal: 'red-B' },
        'red-C': { targetFloor: 'floor-mid', targetPortal: 'red-C' },
        'red-D': { targetFloor: 'floor-mid', targetPortal: 'red-D' },
        'red-F': { targetFloor: 'floor-mid', targetPortal: 'red-F' }
    },
    'floor-mid': {/**中**/
        'red-A': { targetFloor: 'floor-front', targetPortal: 'red-A' },
        'red-B': { targetFloor: 'floor-front', targetPortal: 'red-B' },
        'red-C': { targetFloor: 'floor-front', targetPortal: 'red-C' },
        'red-D': { targetFloor: 'floor-front', targetPortal: 'red-D' },
        'red-F': { targetFloor: 'floor-front', targetPortal: 'red-F' },
        'red-E': { targetFloor: 'floor-corridor', targetPortal: 'red-E' },
        'red-G': { targetFloor: 'floor-corridor', targetPortal: 'red-G' },
        'red-J': { targetFloor: 'floor-corridor', targetPortal: 'red-J' }
    },
    'floor-corridor': {/**迴廊**/
        'red-G': { targetFloor: 'floor-mid', targetPortal: 'red-G' },
        'red-J': { targetFloor: 'floor-mid', targetPortal: 'red-J' },
        'red-E': { targetFloor: 'floor-mid', targetPortal: 'red-E' },
        'red-H': { targetFloor: 'floor-path', targetPortal: 'red-H' },
        'red-I': { targetFloor: 'floor-path', targetPortal: 'red-I' },
        'yellow-A': { targetFloor: 'floor-path', targetPortal: 'yellow-A' },
        'yellow-B': { targetFloor: 'floor-path', targetPortal: 'yellow-B' },
        'yellow-C': { targetFloor: 'floor-path', targetPortal: 'yellow-C' },
        'yellow-D': { targetFloor: 'floor-path', targetPortal: 'yellow-D' }
    },
    'floor-path': {/**通道**/
        'red-H': { targetFloor: 'floor-corridor', targetPortal: 'red-H' },
        'red-I': { targetFloor: 'floor-corridor', targetPortal: 'red-I' },
        'red-K': { targetFloor: 'floor-main', targetPortal: 'red-K' },
        'yellow-A': { targetFloor: 'floor-corridor', targetPortal: 'yellow-A' },
        'yellow-B': { targetFloor: 'floor-corridor', targetPortal: 'yellow-B' },
        'yellow-C': { targetFloor: 'floor-corridor', targetPortal: 'yellow-C' },
        'yellow-D': { targetFloor: 'floor-corridor', targetPortal: 'yellow-D' }
    },
    'floor-main': {
        'red-K': { targetFloor: 'floor-path', targetPortal: 'red-K' }
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

// 動態更新傳點選單
function updatePortalOptions(floorSelectId, portalSelectId) {
    const floor = document.getElementById(floorSelectId).value;
    const portalSelect = document.getElementById(portalSelectId);
    
    // 清空現有選項
    portalSelect.innerHTML = floorSelectId === 'start-floor-select' 
        ? '<option value="green-start">🟢 綠色入口 (預設)</option>' 
        : '<option value="">✨ 任意門 (到達即可)</option>';

    const portals = Object.keys(INTERNAL_CONNECTIONS[floor] || {});
    portals.forEach(p => {
        if (p !== 'green-start') {
            portalSelect.innerHTML += `<option value="${p}">${p}</option>`;
        }
    });
}

// 監聽樓層下拉選單變更
document.getElementById('start-floor-select').addEventListener('change', () => updatePortalOptions('start-floor-select', 'start-portal-select'));
document.getElementById('end-floor-select').addEventListener('change', () => updatePortalOptions('end-floor-select', 'end-portal-select'));

// 點擊搜尋按鈕
document.getElementById('search-route-btn').addEventListener('click', () => {
    const startFloor = document.getElementById('start-floor-select').value;
    const startPortal = document.getElementById('start-portal-select').value || 'green-start';
    const endFloor = document.getElementById('end-floor-select').value;
    const endPortal = document.getElementById('end-portal-select').value || null;

    const route = findRealShortestPath(startFloor, endFloor, startPortal, endPortal);
    
    // 渲染搜尋結果...
});