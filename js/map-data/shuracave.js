// 🌟 1. 樓層與區塊對照表 (顯示在下拉選單中)
export const FLOOR_NAMES = {
    'shura-entrance': '修羅洞_入口',
    'shura-迷惘-A': '修羅洞_迷惘_A區',
    'shura-迷惘-B': '修羅洞_迷惘_B區',
    'shura-迷惘-C': '修羅洞_迷惘_C區',
    'shura-迷惘-D': '修羅洞_迷惘_D區',
    'shura-迷惘-F': '修羅洞_迷惘_F區',
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

export const PORTAL_LABELS = {
    // 修羅洞入口
    'shura-entrance': {
    'green-start': '入口中央',
    'portal-A': '紅色 A',
    'portal-B': '紅色 B',
    'portal-C': '紅色 C',
    'portal-D': '紅色 D',
    'portal-E': '紅色 E'
},

    // 迷惘 A 區 (左)
    'shura-迷惘-A': {
        'portal-b': '藍色 b (左上)',
        'portal-c': '藍色 c (右上)',
        'portal-d': '藍色 d (右下)',
        'portal-f': '藍色 f (左下)'
    },

    // 迷惘 B 區 (下)
    'shura-迷惘-B': {
        'portal-a': '藍色 a (右上)',
        'portal-c': '藍色 c (左下)',
        'portal-d': '藍色 d (左上)',
        'portal-f': '藍色 f (右下)'
    },

    // 迷惘 C 區 (右)
    'shura-迷惘-C': {
        'portal-a': '藍色 a (左上)',
        'portal-b': '藍色 b (右下)',
        'portal-d': '藍色 d (左下)',
        'portal-f': '藍色 f (右上)'
    },

    // 迷惘 D 區 (上)
    'shura-迷惘-D': {
        'portal-a': '藍色 a (右下)',
        'portal-b': '藍色 b (右上)',
        'portal-c': '藍色 c (左下)',
        'portal-f': '藍色 f (左上)'
    },

    // 迷惘 F 區 (中)
    'shura-迷惘-F': {
        'portal-A': '白色 A (回入口 A)',
        'portal-B': '白色 B (前往狂亂 B)'
    },

    // 狂亂 A 區 (左上)
    'shura-狂亂-A': {
        'portal-b': '綠色 b (左上)',
        'portal-A-green': '綠色 A (區塊標記)',
        'portal-g': '綠色 g (左下)',
        'portal-A-white': '白色 A (右上)',
        'portal-D-red': '紅色 D (右下)'
    },

    // 狂亂 B 區 (中間核心)
    'shura-狂亂-B': {
        'portal-a': '綠色 a (左上)',
        'portal-c': '綠色 c (正上)',
        'portal-d': '綠色 d (右上)',
        'portal-e': '綠色 e (左中)',
        'portal-f': '綠色 f (右中)',
        'portal-g': '綠色 g (左下)',
        'portal-h': '綠色 h (正下)',
        'portal-i': '綠色 i (右下)'
    },

    // 狂亂 C 區 (中上)
    'shura-狂亂-C': {
        'portal-b': '綠色 b (右上)',
        'portal-e': '綠色 e (右下)',
        'portal-A-white': '白色 A (左上)',
        'portal-D-red': '紅色 D (左下)'
    },

    // 狂亂 D 區 (右上 - 郝厲害所在區)
    'shura-狂亂-D': {
        'portal-i': '綠色 i (左上)',
        'portal-b': '綠色 b (右上)',
        'portal-C-red': '紅色 C (左下)',
        'portal-A-white': '白色 A (右下)'
    },

    // 狂亂 E 區 (中左)
    'shura-狂亂-E': {
        'portal-h': '綠色 h (左上)',
        'portal-b': '綠色 b (右下)',
        'portal-A-red': '紅色 A (右上)',
        'portal-A-white': '白色 A (左下)'
    },

    // 狂亂 F 區 (中右)
    'shura-狂亂-F': {
        'portal-b': '綠色 b (左上)',
        'portal-a': '綠色 a (右下)',
        'portal-C-red': '紅色 C (右上)',
        'portal-A-white': '白色 A (左下)'
    },

    // 狂亂 G 區 (左下)
    'shura-狂亂-G': {
        'portal-b': '綠色 b (右上)',
        'portal-d': '綠色 d (左下)',
        'portal-A-red': '紅色 A (左上)',
        'portal-A-white': '白色 A (右下)'
    },

    // 狂亂 H 區 (中下)
    'shura-狂亂-H': {
        'portal-f': '綠色 f (右上)',
        'portal-b': '綠色 b (右下)',
        'portal-A-white': '白色 A (左上)',
        'portal-B-red': '紅色 B (左下)'
    },

    // 狂亂 I 區 (右下)
    'shura-狂亂-I': {
        'portal-b': '綠色 b (左下)',
        'portal-G-red': '紅色 G (右上)',
        'portal-B-red': '紅色 B (左上)',
        'portal-A-white': '白色 A (右下)'
    },

    'shura-煉獄': {
        'portal-A-white': '白色 A (中央左下)',
        'portal-G-red': '紅色 G (左下)'
    }
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
    'portal-E': ['portal-A', 'portal-B', 'portal-C', 'portal-D']
},

// 迷惘 - 左區 (A)
'shura-迷惘-A': {
    'portal-a': ['portal-b', 'portal-c', 'portal-d', 'portal-f'],
    'portal-A': ['portal-b', 'portal-c', 'portal-d', 'portal-f'], // 🌟 注意 A 是大寫 (回入口)
    'portal-b': ['portal-A', 'portal-c', 'portal-d', 'portal-f'],
    'portal-c': ['portal-A', 'portal-b', 'portal-d', 'portal-f'],
    'portal-d': ['portal-A', 'portal-b', 'portal-c', 'portal-f'],
    'portal-f': ['portal-A', 'portal-b', 'portal-c', 'portal-d']
},

// 迷惘 - 下區 (B)
'shura-迷惘-B': {
    'portal-a': ['portal-c', 'portal-d', 'portal-f'], 
    'portal-c': ['portal-a', 'portal-d', 'portal-f'],
    'portal-d': ['portal-a', 'portal-c', 'portal-f'],
    'portal-f': ['portal-a', 'portal-c', 'portal-d']
},

// 迷惘 - 右區 (C)
'shura-迷惘-C': {
    'portal-a': ['portal-b', 'portal-d', 'portal-f'], 
    'portal-b': ['portal-a', 'portal-d', 'portal-f'],
    'portal-d': ['portal-a', 'portal-b', 'portal-f'],
    'portal-f': ['portal-a', 'portal-b', 'portal-d']
},

// 迷惘 - 上區 (D)
'shura-迷惘-D': {
    'portal-a': ['portal-b', 'portal-c', 'portal-f'], 
    'portal-b': ['portal-a', 'portal-c', 'portal-f'],
    'portal-c': ['portal-a', 'portal-b', 'portal-f'],
    'portal-f': ['portal-a', 'portal-b', 'portal-c']
},

// 迷惘 - 中區 (F區) 🌟 這裡原本少寫很多！
'shura-迷惘-F': {
    'portal-f': ['portal-A', 'portal-B'],
    'portal-A': ['portal-f', 'portal-B'],
    'portal-B': ['portal-f', 'portal-A']
},

'shura-狂亂-A': {
    'portal-b': ['portal-A-white', 'portal-A-green', 'portal-g', 'portal-D-red'],
    'portal-g': ['portal-b', 'portal-A-white', 'portal-A-green', 'portal-D-red'],
    'portal-A-white': ['portal-b', 'portal-g', 'portal-A-green', 'portal-D-red'],
    'portal-A-green': ['portal-b', 'portal-g', 'portal-A-white', 'portal-D-red'],
    'portal-D-red': ['portal-b', 'portal-g', 'portal-A-white', 'portal-A-green']
},
'shura-狂亂-B': {
    'portal-a': ['portal-c', 'portal-d', 'portal-e', 'portal-f', 'portal-g', 'portal-h', 'portal-i'],
    'portal-b': ['portal-a', 'portal-c', 'portal-d', 'portal-e', 'portal-f', 'portal-g', 'portal-h', 'portal-i'],
    'portal-c': ['portal-a', 'portal-d', 'portal-e', 'portal-f', 'portal-g', 'portal-h', 'portal-i'],
    'portal-d': ['portal-a', 'portal-c', 'portal-e', 'portal-f', 'portal-g', 'portal-h', 'portal-i'],
    'portal-e': ['portal-a', 'portal-c', 'portal-d', 'portal-f', 'portal-g', 'portal-h', 'portal-i'],
    'portal-f': ['portal-a', 'portal-c', 'portal-d', 'portal-e', 'portal-g', 'portal-h', 'portal-i'],
    'portal-g': ['portal-a', 'portal-c', 'portal-d', 'portal-e', 'portal-f', 'portal-h', 'portal-i'],
    'portal-h': ['portal-a', 'portal-c', 'portal-d', 'portal-e', 'portal-f', 'portal-g', 'portal-i'],
    'portal-i': ['portal-a', 'portal-c', 'portal-d', 'portal-e', 'portal-f', 'portal-g', 'portal-h']
},
'shura-狂亂-C': {
    'portal-A-white': ['portal-b', 'portal-D-red', 'portal-e'],
    'portal-b': ['portal-A-white', 'portal-D-red', 'portal-e'],
    'portal-D-red': ['portal-A-white', 'portal-b', 'portal-e'],
    'portal-e': ['portal-A-white', 'portal-b', 'portal-D-red']
},
'shura-狂亂-D': {
    'portal-i': ['portal-b', 'portal-C-red', 'portal-A-white'],
    'portal-b': ['portal-i', 'portal-C-red', 'portal-A-white'],
    'portal-C-red': ['portal-i', 'portal-b', 'portal-A-white'],
    'portal-A-white': ['portal-i', 'portal-b', 'portal-C-red']
},
'shura-狂亂-E': {
    'portal-h': ['portal-A-red', 'portal-A-white', 'portal-b'],
    'portal-A-red': ['portal-h', 'portal-A-white', 'portal-b'],
    'portal-A-white': ['portal-h', 'portal-A-red', 'portal-b'],
    'portal-b': ['portal-h', 'portal-A-red', 'portal-A-white']
},
'shura-狂亂-F': {
    'portal-b': ['portal-C-red', 'portal-A-white', 'portal-a'],
    'portal-C-red': ['portal-b', 'portal-A-white', 'portal-a'],
    'portal-A-white': ['portal-b', 'portal-C-red', 'portal-a'],
    'portal-a': ['portal-b', 'portal-C-red', 'portal-A-white']
},
'shura-狂亂-G': {
    'portal-A-red': ['portal-b', 'portal-d', 'portal-A-white'],
    'portal-b': ['portal-A-red', 'portal-d', 'portal-A-white'],
    'portal-d': ['portal-A-red', 'portal-b', 'portal-A-white'],
    'portal-A-white': ['portal-A-red', 'portal-b', 'portal-d']
},
'shura-狂亂-H': {
    'portal-A-white': ['portal-f', 'portal-B-red', 'portal-b'],
    'portal-f': ['portal-A-white', 'portal-B-red', 'portal-b'],
    'portal-B-red': ['portal-A-white', 'portal-f', 'portal-b'],
    'portal-b': ['portal-A-white', 'portal-f', 'portal-B-red']
},
'shura-狂亂-I': {
    'portal-B-red': ['portal-G-red', 'portal-b', 'portal-A-white'],
    'portal-G-red': ['portal-B-red', 'portal-b', 'portal-A-white'],
    'portal-b': ['portal-B-red', 'portal-G-red', 'portal-A-white'],
    'portal-A-white': ['portal-B-red', 'portal-G-red', 'portal-b']
},

    'shura-煉獄': {
    'green-start': ['portal-A-white', 'portal-G-red'],
    'portal-A-white': ['green-start', 'portal-G-red'],
    'portal-G-red': ['green-start', 'portal-A-white']
},
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
    'portal-E': { targetFloor: 'redwood-forest', targetPortal: 'green-start' }
},

    // ----------------------------------------------------
    // 1. 修羅洞 - 迷惘區 (1~5區)
    // ----------------------------------------------------
    // 迷惘 - 左區 (A)
'shura-迷惘-A': {
    'portal-A': { targetFloor: 'shura-entrance', targetPortal: 'portal-A' }, // 🌟 大寫 A 回入口 A
    'portal-b': { targetFloor: 'shura-迷惘-B', targetPortal: 'portal-b' },
    'portal-c': { targetFloor: 'shura-迷惘-C', targetPortal: 'portal-c' },
    'portal-d': { targetFloor: 'shura-迷惘-D', targetPortal: 'portal-d' },
    'portal-f': { targetFloor: 'shura-迷惘-F', targetPortal: 'portal-f' }
},

// 迷惘 - 下區 (B)
'shura-迷惘-B': {
    'portal-a': { targetFloor: 'shura-迷惘-A', targetPortal: 'portal-a' },
    'portal-c': { targetFloor: 'shura-迷惘-C', targetPortal: 'portal-c' },
    'portal-d': { targetFloor: 'shura-迷惘-D', targetPortal: 'portal-d' },
    'portal-f': { targetFloor: 'shura-迷惘-F', targetPortal: 'portal-f' }
},

// 迷惘 - 右區 (C)
'shura-迷惘-C': {
    'portal-a': { targetFloor: 'shura-迷惘-A', targetPortal: 'portal-a' },
    'portal-b': { targetFloor: 'shura-迷惘-B', targetPortal: 'portal-b' },
    'portal-d': { targetFloor: 'shura-迷惘-D', targetPortal: 'portal-d' },
    'portal-f': { targetFloor: 'shura-迷惘-F', targetPortal: 'portal-f' }
},

// 迷惘 - 上區 (D)
'shura-迷惘-D': {
    'portal-a': { targetFloor: 'shura-迷惘-A', targetPortal: 'portal-a' },
    'portal-b': { targetFloor: 'shura-迷惘-B', targetPortal: 'portal-b' },
    'portal-c': { targetFloor: 'shura-迷惘-C', targetPortal: 'portal-c' },
    'portal-f': { targetFloor: 'shura-迷惘-F', targetPortal: 'portal-f' }
},

// 迷惘 - 中區 (F區) 🌟 根據右上角說明：A->入口A, B->狂亂B
'shura-迷惘-F': {
    'portal-A': { targetFloor: 'shura-entrance', targetPortal: 'portal-A' },
    'portal-B': { targetFloor: 'shura-狂亂-B', targetPortal: 'portal-b' } // 🌟 確保 targetPortal 跟狂亂 B 區定義的 key 一致
},

    // ----------------------------------------------------
    // 2. 修羅洞 - 狂亂區 (九宮格 A~I 區)
    // ----------------------------------------------------
// 狂亂 - 左上 (A區)
    'shura-狂亂-A': {
        'portal-a': { targetFloor: 'shura-狂亂-B', targetPortal: 'portal-b' },       // 🌟 補上落腳點 portal-a
        'portal-b': { targetFloor: 'shura-狂亂-B', targetPortal: 'portal-b' },
        'portal-A-white': { targetFloor: 'shura-entrance', targetPortal: 'portal-A' },
        'portal-A-green': { targetFloor: 'shura-狂亂-A', targetPortal: 'portal-a' },
        'portal-g': { targetFloor: 'shura-狂亂-G', targetPortal: 'portal-g' },
        'portal-D-red': { targetFloor: 'shura-迷惘-D', targetPortal: 'portal-d' }
    },

// 狂亂 - 中間核心 (B區)
    'shura-狂亂-B': {
        'portal-a': { targetFloor: 'shura-狂亂-A', targetPortal: 'portal-a' },
        'portal-b': { targetFloor: 'shura-狂亂-B', targetPortal: 'portal-b' },       // 🌟 補上落腳點 portal-b
        'portal-c': { targetFloor: 'shura-狂亂-C', targetPortal: 'portal-c' },
        'portal-d': { targetFloor: 'shura-狂亂-D', targetPortal: 'portal-d' },
        'portal-e': { targetFloor: 'shura-狂亂-E', targetPortal: 'portal-e' },
        'portal-f': { targetFloor: 'shura-狂亂-F', targetPortal: 'portal-f' },
        'portal-g': { targetFloor: 'shura-狂亂-G', targetPortal: 'portal-g' },
        'portal-h': { targetFloor: 'shura-狂亂-H', targetPortal: 'portal-h' },
        'portal-i': { targetFloor: 'shura-狂亂-I', targetPortal: 'portal-i' }
    },

// 狂亂 - 中上 (C區)
    'shura-狂亂-C': {
        'portal-c': { targetFloor: 'shura-狂亂-B', targetPortal: 'portal-b' },       // 🌟 補上落腳點 portal-c
        'portal-A-white': { targetFloor: 'shura-entrance', targetPortal: 'portal-A' },
        'portal-b': { targetFloor: 'shura-狂亂-B', targetPortal: 'portal-b' },
        'portal-D-red': { targetFloor: 'shura-迷惘-D', targetPortal: 'portal-d' },
        'portal-e': { targetFloor: 'shura-狂亂-E', targetPortal: 'portal-e' }
    },

    // 狂亂 - 右上 (D區)
    'shura-狂亂-D': {
        'portal-d': { targetFloor: 'shura-狂亂-B', targetPortal: 'portal-b' },       // 🌟 補上落腳點 portal-d
        'portal-i': { targetFloor: 'shura-狂亂-I', targetPortal: 'portal-i' },
        'portal-b': { targetFloor: 'shura-狂亂-B', targetPortal: 'portal-b' },
        'portal-C-red': { targetFloor: 'shura-迷惘-C', targetPortal: 'portal-c' },
        'portal-A-white': { targetFloor: 'shura-entrance', targetPortal: 'portal-A' }
    },

// 狂亂 - 中左 (E區)
    'shura-狂亂-E': {
        'portal-e': { targetFloor: 'shura-狂亂-B', targetPortal: 'portal-b' },       // 🌟 補上落腳點 portal-e
        'portal-h': { targetFloor: 'shura-狂亂-H', targetPortal: 'portal-h' },
        'portal-A-red': { targetFloor: 'shura-迷惘-A', targetPortal: 'portal-a' },
        'portal-A-white': { targetFloor: 'shura-entrance', targetPortal: 'portal-A' },
        'portal-b': { targetFloor: 'shura-狂亂-B', targetPortal: 'portal-b' }
    },

    // 狂亂 - 中右 (F區)
    'shura-狂亂-F': {
        'portal-f': { targetFloor: 'shura-狂亂-B', targetPortal: 'portal-b' },       // 🌟 補上落腳點 portal-f
        'portal-b': { targetFloor: 'shura-狂亂-B', targetPortal: 'portal-b' },
        'portal-C-red': { targetFloor: 'shura-迷惘-C', targetPortal: 'portal-c' },
        'portal-A-white': { targetFloor: 'shura-entrance', targetPortal: 'portal-A' },
        'portal-a': { targetFloor: 'shura-狂亂-A', targetPortal: 'portal-a' }
    },

// 狂亂 - 左下 (G區)
'shura-狂亂-G': {
    'portal-g': { targetFloor: 'shura-狂亂-B', targetPortal: 'portal-b' },
    'portal-A-red': { targetFloor: 'shura-迷惘-A', targetPortal: 'portal-a' },
    'portal-b': { targetFloor: 'shura-狂亂-B', targetPortal: 'portal-b' },
    'portal-d': { targetFloor: 'shura-狂亂-D', targetPortal: 'portal-d' },
    'portal-A-white': { targetFloor: 'shura-entrance', targetPortal: 'portal-A' }
},

// 狂亂 - 中下 (H區)
'shura-狂亂-H': {
    'portal-h': { targetFloor: 'shura-狂亂-B', targetPortal: 'portal-b' },
    'portal-A-white': { targetFloor: 'shura-entrance', targetPortal: 'portal-A' },
    'portal-f': { targetFloor: 'shura-狂亂-F', targetPortal: 'portal-f' },
    'portal-B-red': { targetFloor: 'shura-迷惘-B', targetPortal: 'portal-b' },
    'portal-b': { targetFloor: 'shura-狂亂-B', targetPortal: 'portal-b' }
},

// 狂亂 - 右下 (I區)
'shura-狂亂-I': {
    'portal-i': { targetFloor: 'shura-煉獄', targetPortal: 'portal-G-red' },
    'portal-B-red': { targetFloor: 'shura-迷惘-B', targetPortal: 'portal-b' },
    'portal-G-red': { targetFloor: 'shura-煉獄', targetPortal: 'portal-G-red' }, // 🌟 將 targetPortal 改為 'portal-G-red'
    'portal-b': { targetFloor: 'shura-狂亂-B', targetPortal: 'portal-b' },
    'portal-A-white': { targetFloor: 'shura-entrance', targetPortal: 'portal-A' }
},

    'shura-煉獄': {
    'portal-A-white': { targetFloor: 'shura-entrance', targetPortal: 'portal-A' },
    'portal-G-red': { targetFloor: 'shura-狂亂-B', targetPortal: 'portal-b' }
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