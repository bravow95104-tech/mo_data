// /mo_data/js/map-data.js

// 定義樓層名稱對照
export const FLOOR_NAMES = {
    'floor-front': '皇陵前殿',
    'floor-mid': '皇陵中殿',
    'floor-corridor': '皇陵迴廊',
    'floor-path': '皇陵通道',
    'floor-main': '皇陵正殿'
};

// 定義皇陵傳點連通圖 (Graph)
export const IMPERIAL_MAUSOLEUM_GRAPH = {
    'floor-front': [
        { portal: 'red-A', targetFloor: 'floor-mid', label: '紅 A' },
        { portal: 'red-B', targetFloor: 'floor-mid', label: '紅 B' },
        { portal: 'red-C', targetFloor: 'floor-mid', label: '紅 C' },
        { portal: 'red-D', targetFloor: 'floor-mid', label: '紅 D' },
        { portal: 'red-F', targetFloor: 'floor-mid', label: '紅 F' }
    ],
    'floor-mid': [
        { portal: 'red-A', targetFloor: 'floor-front', label: '紅 A' },
        { portal: 'red-B', targetFloor: 'floor-front', label: '紅 B' },
        { portal: 'red-C', targetFloor: 'floor-front', label: '紅 C' },
        { portal: 'red-D', targetFloor: 'floor-front', label: '紅 D' },
        { portal: 'red-F', targetFloor: 'floor-front', label: '紅 F' },
        { portal: 'red-E', targetFloor: 'floor-corridor', label: '紅 E' },
        { portal: 'red-G', targetFloor: 'floor-corridor', label: '紅 G' },
        { portal: 'red-J', targetFloor: 'floor-corridor', label: '紅 J' }
    ],
    'floor-corridor': [
        { portal: 'red-G', targetFloor: 'floor-mid', label: '紅 G' },
        { portal: 'red-J', targetFloor: 'floor-mid', label: '紅 J' },
        { portal: 'red-E', targetFloor: 'floor-mid', label: '紅 E' },
        { portal: 'red-H', targetFloor: 'floor-path', label: '紅 H' },
        { portal: 'red-I', targetFloor: 'floor-path', label: '紅 I' },
        { portal: 'yellow-A', targetFloor: 'floor-main', label: '黃 A' },
        { portal: 'yellow-B', targetFloor: 'floor-main', label: '黃 B' },
        { portal: 'yellow-C', targetFloor: 'floor-main', label: '黃 C' },
        { portal: 'yellow-K', targetFloor: 'floor-main', label: '黃 K' }
    ],
    'floor-path': [
        { portal: 'red-H', targetFloor: 'floor-corridor', label: '紅 H' },
        { portal: 'red-I', targetFloor: 'floor-corridor', label: '紅 I' },
        { portal: 'red-K', targetFloor: 'floor-main', label: '紅 K' },
        { portal: 'yellow-A', targetFloor: 'floor-corridor', label: '黃 A' },
        { portal: 'yellow-B', targetFloor: 'floor-corridor', label: '黃 B' },
        { portal: 'yellow-C', targetFloor: 'floor-corridor', label: '黃 C' },
        { portal: 'yellow-D', targetFloor: 'floor-corridor', label: '黃 D' }
    ],
    'floor-main': [
        { portal: 'red-K', targetFloor: 'floor-path', label: '紅 K' }
    ]
};

/**
 * 廣度優先搜尋演算法 (BFS) 尋找最短跳轉次數路線
 */
export function findShortestPath(startFloor, endFloor) {
    if (startFloor === endFloor) return [];

    let queue = [[startFloor, []]];
    let visited = new Set([startFloor]);

    while (queue.length > 0) {
        let [currentFloor, path] = queue.shift();
        const neighbors = IMPERIAL_MAUSOLEUM_GRAPH[currentFloor] || [];

        for (let edge of neighbors) {
            if (edge.targetFloor === endFloor) {
                return [...path, { from: currentFloor, via: edge.portal, to: endFloor, label: edge.label }];
            }

            if (!visited.has(edge.targetFloor)) {
                visited.add(edge.targetFloor);
                queue.push([
                    edge.targetFloor,
                    [...path, { from: currentFloor, via: edge.portal, to: edge.targetFloor, label: edge.label }]
                ]);
            }
        }
    }
    return null; // 無法連通
}