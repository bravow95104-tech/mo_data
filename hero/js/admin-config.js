// js/admin-config.js
export const TABLE_CONFIGS = {
    heroes: {
        title: '英雄清單',
        tableName: 'heroes',
        tableCols: ['英雄名稱', '對應光輝', '拜官', '屬性', '操作'],
        displayFields: ['name', 'glory', 'promotion', 'element'], // 表格顯示的欄位
        fields: [
            { id: 'name', label: '英雄名稱', type: 'text', required: true, grid: 1 },
            { id: 'sort_id', label: '顯示順序', type: 'number', grid: 1 },
            { id: 'glory', label: '對應光輝', type: 'text', grid: 1 },
            { id: 'promotion', label: '拜官', type: 'text', grid: 1 },
            { id: 'element', label: '屬性', type: 'select', options: ['火', '水', '木', '金', '土', '無'], grid: 1 },
            { id: 'str', label: '力量 (STR)', type: 'number', grid: 1 },
            { id: 'int', label: '智慧 (INT)', type: 'number', grid: 1 },
            { id: 'vit', label: '體質 (VIT)', type: 'number', grid: 1 },
            { id: 'agi', label: '敏捷 (AGI)', type: 'number', grid: 1 },
            { id: 'luk', label: '幸運 (LUK)', type: 'number', grid: 1 },
            { id: 'equipment_new', label: '裝備卡(新專)', type: 'text', grid: 1 },
            { id: 'new_multiplier', label: '新專倍率', type: 'text', grid: 1 },
            { id: 'transformation_skill', label: '生變技能', type: 'text', grid: 1 },
            { id: 'player', label: '光輝掉落(玩家)', type: 'text', grid: 1 },
            { id: 'playerdata', label: '資訊提供者', type: 'text', grid: 1 }
        ]
    },
    awakening: {
        title: '覺醒技能管理',
        tableName: 'awakening',
        tableCols: ['技能名稱', '獲取機率', '對應英雄', '操作'],
        displayFields: ['skill_name', 'probability', 'heros'],
        fields: [
            { id: 'skill_name', label: '技能名稱', type: 'text', required: true, grid: 1 },
            { id: 'sort_id', label: '顯示順序', type: 'number', grid: 1 },
            { id: 'probability', label: '獲取機率', type: 'text', grid: 1 },
            { id: 'heros', label: '對應英雄', type: 'text', grid: 2 }
        ]
    },
    glory_drop: {
        title: '光輝掉落管理',
        tableName: 'glory_drop',
        tableCols: ['地區', '掉落較多', '掉落較低', '操作'],
        displayFields: ['area', 'more', 'low'],
        fields: [
            { id: 'area', label: '地區', type: 'text', required: true, grid: 1 },
            { id: 'sort_id', label: '顯示順序', type: 'number', grid: 1 },
            { id: 'more', label: '掉落較多', type: 'textarea', grid: 3 },
            { id: 'low', label: '掉落較低', type: 'textarea', grid: 3 }
        ]
    }
    // 未來可以在此處直接新增 equipment, items, maps 等配置
};
