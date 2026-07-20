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
        'red-G': [ 'yellow-A', 'yellow-C'],
        'red-J': ['red-I'],
        'red-H': ['yellow-A', 'yellow-C'],
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
    'floor-front': {
        'red-A': { targetFloor: 'floor-mid', targetPortal: 'red-A' },
        'red-B': { targetFloor: 'floor-mid', targetPortal: 'red-B' },
        'red-C': { targetFloor: 'floor-mid', targetPortal: 'red-C' },
        'red-D': { targetFloor: 'floor-mid', targetPortal: 'red-D' },
        'red-F': { targetFloor: 'floor-mid', targetPortal: 'red-F' }
    },
    'floor-mid': {
        'red-A': { targetFloor: 'floor-front', targetPortal: 'red-A' },
        'red-B': { targetFloor: 'floor-front', targetPortal: 'red-B' },
        'red-C': { targetFloor: 'floor-front', targetPortal: 'red-C' },
        'red-D': { targetFloor: 'floor-front', targetPortal: 'red-D' },
        'red-F': { targetFloor: 'floor-front', targetPortal: 'red-F' },
        'red-E': { targetFloor: 'floor-corridor', targetPortal: 'red-E' },
        'red-G': { targetFloor: 'floor-corridor', targetPortal: 'red-G' },
        'red-J': { targetFloor: 'floor-corridor', targetPortal: 'red-J' }
    },
    'floor-corridor': {
        'red-G': { targetFloor: 'floor-mid', targetPortal: 'red-G' },
        'red-J': { targetFloor: 'floor-mid', targetPortal: 'red-J' },
        'red-E': { targetFloor: 'floor-mid', targetPortal: 'red-E' },
        'red-H': { targetFloor: 'floor-path', targetPortal: 'red-H' },
        'red-I': { targetFloor: 'floor-path', targetPortal: 'red-I' },
        'yellow-A': { targetFloor: 'floor-main', targetPortal: 'yellow-A' },
        'yellow-B': { targetFloor: 'floor-main', targetPortal: 'yellow-B' },
        'yellow-C': { targetFloor: 'floor-main', targetPortal: 'yellow-C' },
        'yellow-D': { targetFloor: 'floor-main', targetPortal: 'yellow-D' }
    },
    'floor-path': {
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
 * 精確考量「同圖步行」與「跨圖傳送」的最短路徑演算法
 */
export function findRealShortestPath(startFloor, endFloor) {
    if (startFloor === endFloor) return [];

    // Queue 節點結構：[當前樓層, 當前所在的傳點(若為null表示起點可自由選擇區域), 經過的路徑歷史]
    let queue = [[startFloor, null, []]];
    let visited = new Set();

    while (queue.length > 0) {
        let [curFloor, curPortal, path] = queue.shift();

        // 標記該 (樓層, 傳點) 組合已探索
        const stateKey = `${curFloor}:${curPortal}`;
        if (visited.has(stateKey)) continue;
        visited.add(stateKey);

        // 1. 如果尚未指定當前傳點（起點剛開始），枚舉該樓層的所有可用傳點作為起點
        let availablePortals = [];
        if (curPortal === null) {
            availablePortals = Object.keys(PORTAL_TELEPORTS[curFloor] || {});
        } else {
            // 在同樓層內，可透過「走路」到達的其他傳點 + 當前傳點自己
            const reachableInternal = INTERNAL_CONNECTIONS[curFloor]?.[curPortal] || [];
            availablePortals = [curPortal, ...reachableInternal];
        }

        // 2. 針對每一個可走路到達的傳點，嘗試進行「跨樓層傳送」
        for (let pCode of availablePortals) {
            const teleportInfo = PORTAL_TELEPORTS[curFloor]?.[pCode];
            if (!teleportInfo) continue;

            const nextFloor = teleportInfo.targetFloor;
            const nextPortal = teleportInfo.targetPortal;

            // 新的步驟紀錄
            const newStep = {
                fromFloor: curFloor,
                walkToPortal: pCode, // 在當前樓層走到的傳點
                toFloor: nextFloor,
                targetPortal: nextPortal
            };

            const newPath = [...path, newStep];

            // 🎯 如果傳送過去的目標樓層就是終點樓層，尋路成功！
            if (nextFloor === endFloor) {
                return newPath;
            }

            // 繼續搜尋下一層
            queue.push([nextFloor, nextPortal, newPath]);
        }
    }

    return null; // 無法到達
}