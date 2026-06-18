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
            { id: 'promotion', label: '拜官', type: 'text', grid: 1 , group: '基本數值'},
            { id: 'element', label: '屬性', type: 'select', options: ['火', '水', '木', '金', '土'], grid: 1 , group: '基本數值'},
            { id: 'str', label: '力量 (STR)', type: 'number', grid: 1 , group: '基本數值'},
            { id: 'int', label: '智慧 (INT)', type: 'number', grid: 1 , group: '基本數值'},
            { id: 'vit', label: '體質 (VIT)', type: 'number', grid: 1 , group: '基本數值'},
            { id: 'agi', label: '敏捷 (AGI)', type: 'number', grid: 1 , group: '基本數值'},
            { id: 'luk', label: '幸運 (LUK)', type: 'number', grid: 1 , group: '基本數值'},
            { id: 'equipment_new', label: '裝備卡(新專)', type: 'text', grid: 1 },
            { id: 'new_multiplier', label: '新專倍率', type: 'text', grid: 1 },
            { id: 'transformation_skill', label: '生變技能', type: 'text', grid: 1 },
            { id: 'player', label: '光輝掉落(玩家提供)', type: 'text', grid: 1 },
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
        title: '光輝掉落(官方)管理',
        tableName: 'glory_drop',
        tableCols: ['地區', '掉落較多', '掉落較低', '操作'],
        displayFields: ['area', 'more', 'low'],
        fields: [
            { id: 'area', label: '地區', type: 'textarea', required: true, grid: 1 },
            { id: 'sort_id', label: '顯示順序', type: 'number', grid: 1 },
            { id: 'more', label: '掉落較多', type: 'textarea', grid: 3 },
            { id: 'low', label: '掉落較低', type: 'textarea', grid: 3 }
        ]
    },
    glory_drop_player: {
        title: '光輝掉落(玩家)管理',
        tableName: 'glory_drop_player',
        tableCols: ['地區', '顯示順序', '掉落名稱', '操作'],
        displayFields: ['area', 'sort_id', 'drop_content'],
        fields: [
            { id: 'area', label: '地區', type: 'text', required: true, grid: 1 },
            { id: 'sort_id', label: '顯示順序', type: 'number', grid: 1 },
            { id: 'drop_content', label: '掉落名稱', type: 'textarea', grid: 3 },
        ]
    },
    'equip-combo': {
        title: '文片組合管理',
        tableName: 'equip_combo',
        tableCols: ['技能名稱', '職業', '文片組合', '操作'],
        displayFields: ['skillname', 'class', 'combinationmethod'],
        fields: [
            { id: 'skillname', label: '技能名稱', type: 'text', required: true, grid: 1 },
            { id: 'sort_id', label: '顯示順序', type: 'number', grid: 1 },
            { id: 'category', label: '類別', type: 'select', options: ['傷害', '減CD', '施法', '特殊'], grid: 1 },
            { id: 'class', label: '職業', type: 'text', grid: 1 },
            { id: 'classskill', label: '職業技能', type: 'text', grid: 1 },
            { id: 'equipmenttype1', label: '裝備類型1', type: 'select', options: ['武器', '盔甲', '共用', '坐騎', '眼睛', '嘴巴','頭盔','鞋子'], grid: 1 },
            { id: 'equipmenttype2', label: '裝備類型2', type: 'text', grid: 1 },
            { id: 'combinationmethod', label: '文片組合', type: 'text', grid: 2 },
            { id: 'description', label: '說明', type: 'textarea', grid: 3 },
            { id: 'commonly', label: '常用', type: 'select', options: ['','TRUE'], grid: 1 }
        ]
    },
    runereset: {
        title: '文片重鑄管理',
        tableName: 'runereset',
        tableCols: ['道具', '材料1', '材料2', '材料3','材料4','材料5','操作'],
        displayFields: ['item', 'material1', 'material2', 'material3', 'material4', 'material5'],
        fields: [
            { id: 'item', label: '道具', type: 'text', required: true, grid: 1 },
            { id: 'sort_id', label: '顯示順序', type: 'number', grid: 1 },
            { id: 'material1', label: '材料1', type: 'text', grid: 1 , group: '材料'},
            { id: 'material2', label: '材料2', type: 'text', grid: 1 , group: '材料'},
            { id: 'material3', label: '材料3', type: 'text', grid: 1 , group: '材料'},
            { id: 'material4', label: '材料4', type: 'text', grid: 1 , group: '材料'},
            { id: 'material5', label: '材料5', type: 'text', grid: 1 , group: '材料'}
        ]
    },
    'card-equip': {
        title: '裝備卡管理',
        tableName: 'card_equip',
        tableCols: ['類型','卡片ID', '卡片屬性','卡片數據', '操作'],
        displayFields: [ 'type','card_id', 'card_property','card_data'],
        fields: [
            { id: 'sort_id', label: '顯示順序', type: 'number', grid: 1 },
            { id: 'type', label: '類型', type: 'select', options: ['裝備卡'], grid: 1 },
            { id: 'check_use', label: '確認用', type: 'text', grid: 1 },
            { id: 'new_old', label: '新舊', type: 'select', options: ['','新專','舊專','馬卡'], grid: 1 },
            { id: 'card_id', label: '卡片ID', type: 'text', grid: 1 },
            { id: 'card_property', label: '卡片屬性', type: 'select', options: ['力量','智慧','體質','敏捷','運氣','HP','MP',''], grid: 1 },
            { id: 'card_data', label: '卡片數據', type: 'text', grid: 1 },
            { id: 'card_lv', label: '卡片等級', type: 'text', grid: 1 },
            { id: 'card_class', label: '拜官', type: 'select', options: ['全職','武者','響馬','仙士','策士','工匠',''], grid: 1 },
            { id: 'nemultiplier', label: '倍率', type: 'select', options: ['','2.5倍','2倍'], grid: 1 },
            { id: 'card_mp', label: '卡片MP', type: 'text', grid: 1 },
            { id: 'directions', label: '說明', type: 'textarea', grid: 3 },
            { id: 'hero_name', label: '英雄名稱(專卡)', type: 'text', grid: 1 },
            { id: 'drop', label: '掉落', type: 'text', grid: 1 },
            { id: 'player', label: '玩家', type: 'text', grid: 1 }
        ]
    },
    'card-active': {
        title: '主動技能卡管理',
        tableName: 'card_active',
        tableCols: ['類型','卡片ID', '卡片屬性','卡片MP', '操作'],
        displayFields: [ 'type','card_id', 'card_property','card_mp'],
        fields: [
            { id: 'sort_id', label: '顯示順序', type: 'number', grid: 1 },
            { id: 'type', label: '類型', type: 'select', options: ['主動技能卡'], grid: 1 },
            { id: 'check_use', label: '確認用', type: 'text', grid: 1 },
            { id: 'new_old', label: '新舊(暫無用處)', type: 'select', options: ['','新專','舊專','馬卡'], grid: 1 },
            { id: 'card_id', label: '卡片ID', type: 'text', grid: 1 },
            { id: 'card_property', label: '卡片屬性', type: 'select', options: ['金','木','水','火','土','無',''], grid: 1 },
            { id: 'card_data', label: '卡片數據(暫無用處)', type: 'text', grid: 1 },
            { id: 'card_lv', label: '卡片等級', type: 'text', grid: 1 },
            { id: 'card_class', label: '拜官', type: 'select', options: ['武者','響馬','仙士','策士','工匠','通用',''], grid: 1 },
            { id: 'nemultiplier', label: '倍率(暫無用處)', type: 'select', options: ['','2.5倍','2倍'], grid: 1 },
            { id: 'card_mp', label: '卡片MP', type: 'text', grid: 1 },
            { id: 'directions', label: '說明', type: 'textarea', grid: 3 },
            { id: 'hero_name', label: '英雄名稱(暫無用處)', type: 'text', grid: 1 },
            { id: 'drop', label: '掉落', type: 'text', grid: 1 },
            { id: 'player', label: '玩家', type: 'text', grid: 1 }
        ]
    },
    'card-passive': {
        title: '被動技能卡管理',
        tableName: 'card_passive',
        tableCols: ['類型','卡片ID', '卡片屬性', '操作'],
        displayFields: [ 'type','card_id', 'card_property'],
        fields: [
            { id: 'sort_id', label: '顯示順序', type: 'number', grid: 1 },
            { id: 'type', label: '類型', type: 'select', options: ['被動技能卡'], grid: 1 },
            { id: 'check_use', label: '確認用', type: 'text', grid: 1 },
            { id: 'new_old', label: '新舊(暫無用處)', type: 'select', options: ['','新專','舊專','馬卡'], grid: 1 },
            { id: 'card_id', label: '卡片ID', type: 'text', grid: 1 },
            { id: 'card_property', label: '卡片屬性', type: 'select', options: ['金','木','水','火','土','無',''], grid: 1 },
            { id: 'card_data', label: '卡片數據(暫無用處)', type: 'text', grid: 1 },
            { id: 'card_lv', label: '卡片等級', type: 'text', grid: 1 },
            { id: 'card_class', label: '拜官', type: 'select', options: ['武者','響馬','仙士','策士','工匠','通用',''], grid: 1 },
            { id: 'nemultiplier', label: '倍率(暫無用處)', type: 'select', options: ['','2.5倍','2倍'], grid: 1 },
            { id: 'card_mp', label: '卡片MP(暫無用處)', type: 'text', grid: 1 },
            { id: 'directions', label: '說明', type: 'textarea', grid: 3 },
            { id: 'hero_name', label: '英雄名稱(暫無用處)', type: 'text', grid: 1 },
            { id: 'drop', label: '掉落', type: 'text', grid: 1 },
            { id: 'player', label: '玩家', type: 'text', grid: 1 }
        ]
    },
    'card-spirit': {
        title: '靈具卡管理',
        tableName: 'card_spirit',
        tableCols: ['類型','卡片ID', '卡片等級', '操作'],
        displayFields: [ 'type','card_id', 'card_lv'],
        fields: [
            { id: 'sort_id', label: '顯示順序', type: 'number', grid: 1 },
            { id: 'type', label: '類型', type: 'select', options: ['靈具卡'], grid: 1 },
            { id: 'check_use', label: '確認用', type: 'text', grid: 1 },
            { id: 'new_old', label: '新舊(暫無用處)', type: 'select', options: ['','新專','舊專','馬卡'], grid: 1 },
            { id: 'card_id', label: '卡片ID', type: 'text', grid: 1 },
            { id: 'card_property', label: '卡片屬性(暫無用處)', type: 'text', grid: 1 },
            { id: 'card_data', label: '卡片數據(暫無用處)', type: 'text', grid: 1 },
            { id: 'card_lv', label: '卡片等級', type: 'text', grid: 1 },
            { id: 'card_class', label: '卡片階級', type: 'text', grid: 1 },
            { id: 'nemultiplier', label: '倍率(暫無用處)', type: 'select', options: ['','2.5倍','2倍'], grid: 1 },
            { id: 'property_first', label: '第一屬性', type: 'text', grid: 1 },
            { id: 'property_second', label: '第二屬性', type: 'text', grid: 1 },
            { id: 'property_third', label: '第三屬性', type: 'text', grid: 1 },
            { id: 'card_mp', label: '卡片MP(暫無用處)', type: 'text', grid: 1 },
            { id: 'directions', label: '說明', type: 'textarea', grid: 3 },
            { id: 'hero_name', label: '英雄名稱(暫無用處)', type: 'text', grid: 1 },
            { id: 'drop', label: '掉落', type: 'text', grid: 1 },
            { id: 'player', label: '玩家', type: 'text', grid: 1 }
        ]
    },
    accessories: {
        title: '飾品管理',
        tableName: 'accessories',
        tableCols: ['名稱','部位', '等級', '說明','材料1', '操作'],
        displayFields: ['item','sort', 'lv','material1', 'illustrate'],
        fields: [
            { id: 'item', label: '名稱', type: 'text', required: true, grid: 1 },
            { id: 'sort_id', label: '顯示順序', type: 'number', grid: 1 },
            { id: 'class', label: '分類', type: 'select', options: ['飾品'], grid: 1 },
            { id: 'sort', label: '部位', type: 'select', options: ['嘴巴','頭飾','眼鏡','座騎'], grid: 1 },
            { id: 'type', label: '類型(暫無作用 原意分類道具)', type: 'text', grid: 1 },
            { id: 'lv', label: '等級', type: 'text', grid: 1 },
            { id: 'property1', label: '屬性1(防禦/攻擊)', type: 'text', grid: 1 },
            { id: 'property2', label: '屬性2(閃避/命中)', type: 'text', grid: 1 },
            { id: 'durability', label: '耐用', type: 'text', grid: 1 },
            { id: 'material1', label: '材料1', type: 'text', grid: 1 , group: '材料'},
            { id: 'material2', label: '材料2', type: 'text', grid: 1 , group: '材料'},
            { id: 'material3', label: '材料3', type: 'text', grid: 1 , group: '材料'},
            { id: 'material4', label: '材料4', type: 'text', grid: 1 , group: '材料'},
            { id: 'material5', label: '材料5', type: 'text', grid: 1 , group: '材料'},
            { id: 'illustrate', label: '說明(如要觸發modelbox請增加^&12&^)', type: 'textarea', grid: 3 },
            { id: 'gain', label: '特殊效果說明(modelbox)', type: 'textarea', grid: 1 }
        ]
    },
    beautiful: {
        title: '美容院管理',
        tableName: 'beautiful',
        tableCols: ['ID', '類型', '材料1','材料2','材料3','材料4','材料5', '操作'],
        displayFields: ['beauty_id', 'type', 'material1','material2','material3','material4','material5'],
        fields: [
            { id: 'beauty_id', label: 'ID', type: 'text', required: true, grid: 1 },
            { id: 'sort_id', label: '顯示順序', type: 'number', grid: 1 },
            { id: 'type', label: '類型', type: 'text', grid: 1 },
            { id: 'material1', label: '材料1', type: 'text', grid: 1 , group: '材料'},
            { id: 'material2', label: '材料2', type: 'text', grid: 1 , group: '材料'},
            { id: 'material3', label: '材料3', type: 'text', grid: 1 , group: '材料'},
            { id: 'material4', label: '材料4', type: 'text', grid: 1 , group: '材料'},
            { id: 'material5', label: '材料5', type: 'text', grid: 1 , group: '材料'}
        ]
    },
    garbage: {
        title: '垃圾名聲管理',
        tableName: 'garbage',
        tableCols: ['名稱', '分類', '家族', '名聲', '貢獻', '操作'],
        displayFields: ['name', 'class', 'family', 'renown', 'contribute'],
        fields: [
            { id: 'name', label: '名稱', type: 'text', required: true, grid: 1 },
            { id: 'sort_id', label: '顯示順序', type: 'number', grid: 1 },
            { id: 'class', label: '分類', type: 'text', grid: 1 },
            { id: 'family', label: '家族', type: 'text', grid: 1 },
            { id: 'renown', label: '名聲', type: 'text', grid: 1 },
            { id: 'contribute', label: '貢獻', type: 'text', grid: 1 }
        ]
    },
    works: {
        title: '工作管理',
        tableName: 'works',
        tableCols: ['名稱', '類型', '等級','地區', '操作'],
        displayFields: ['name', 'type', 'lv', 'area'],
        fields: [
            { id: 'name', label: '名稱', type: 'text', required: true, grid: 1 },
            { id: 'sort_id', label: '顯示順序', type: 'number', grid: 1 },
            { id: 'type', label: '類型', type: 'text', grid: 1 },
            { id: 'lv', label: '等級', type: 'text', grid: 1 },
            { id: 'area', label: '地區', type: 'text', grid: 1 }
        ]
    },
    items: {
        title: '道具管理',
        tableName: 'items',
        tableCols: ['項目', '類型', '說明', '操作'],
        displayFields: ['items', 'type', 'illustrate'],
        fields: [
            { id: 'items', label: '項目', type: 'text', required: true, grid: 1 },
            { id: 'sort_id', label: '顯示順序', type: 'number', grid: 1 },
            { id: 'type', label: '類型', type: 'text', grid: 1 },
            { id: 'illustrate', label: '說明', type: 'textarea', grid: 3 }
        ]
    },
    medicine: {
        title: '藥品管理',
        tableName: 'medicine',
        tableCols: ['名稱', '等級', '職業', '部位','操作'],
        displayFields: ['item', 'lv', 'job', 'sort'],
        fields: [
            { id: 'item', label: '名稱', type: 'text', required: true, grid: 1 },
            { id: 'sort_id', label: '顯示順序', type: 'number', grid: 1 },
            { id: 'class', label: '分類', type: 'text', grid: 1 },
            { id: 'job', label: '職業', type: 'text', grid: 1 },
            { id: 'sort', label: '部位', type: 'text', grid: 1 },
            { id: 'lv', label: '等級', type: 'text', grid: 1 },
            { id: 'material1', label: '材料1', type: 'text', grid: 1 , group: '材料'},
            { id: 'material2', label: '材料2', type: 'text', grid: 1 , group: '材料'},
            { id: 'material3', label: '材料3', type: 'text', grid: 1 , group: '材料'},
            { id: 'material4', label: '材料4', type: 'text', grid: 1 , group: '材料'},
            { id: 'material5', label: '材料5', type: 'text', grid: 1 , group: '材料'},
            { id: 'illustrate', label: '說明', type: 'textarea', grid: 3 },
            { id: 'obtain', label: '獲得方式', type: 'text', grid: 1 }
        ]
    },
    changelog: {
        title: '更新日誌管理',
        tableName: 'changelog',
        tableCols: ['日期', '內容', '操作'],
        displayFields: ['date', 'content'],
        fields: [
            { id: 'date', label: '日期', type: 'text', placeholder: 'YYYY-MM-DD', required: true, grid: 1 },
            { id: 'sort_id', label: '顯示順序', type: 'number', grid: 1 },
            { id: 'is_tips', label: '是否為 Tips', type: 'select', options: ['是', '否'], grid: 1 },
            { id: 'content', label: '內容(^&特殊文字&^)', type: 'textarea', required: true, grid: 3 }
        ]
    },
    thank: {
        title: '特別感謝管理',
        tableName: 'thanks',
        tableCols: ['類別', '名單', '操作'],
        displayFields: ['category', 'names'],
        fields: [
            { id: 'category', label: '類別', type: 'text', placeholder: '如：網站製作、技術指導', required: true, grid: 1 },
            { id: 'sort_id', label: '顯示順序', type: 'number', grid: 1 },
            { id: 'names', label: '名單', type: 'textarea', placeholder: '多個名稱請用、隔開', required: true, grid: 3 }
        ]
    },
    releases: {
        title: '改版資訊管理',
        tableName: 'releases',
        tableCols: ['日期', '標題', '操作'],
        displayFields: ['date', 'title'],
        fields: [
            { id: 'date', label: '日期', type: 'text', placeholder: 'YYYY-MM-DD', required: true, grid: 1 },
            { id: 'sort_id', label: '顯示順序', type: 'number', grid: 1 },
            { id: 'title', label: '標題', type: 'text', required: true, grid: 3 },
            { id: 'url', label: '連結 URL', type: 'text', grid: 3 }
        ]
    },
    page_hints: {
        title: '頁面提示管理',
        tableName: 'page_hints',
        tableCols: ['頁面路徑', '提示文字', '操作'],
        displayFields: ['page_path', 'hint_text'],
        fields: [
            { id: 'page_path', label: '頁面路徑 (如: /equipment/refine.html)', type: 'text', required: true, grid: 2 },
            { id: 'sort_id', label: '顯示順序', type: 'number', grid: 1 },
            { id: 'target_selector', label: '目標選擇器 (可選，如: .hero-card h2 或 #my-id)', type: 'text', grid: 3, placeholder: '留空則自動尋找標題' },
            { id: 'hint_text', label: '提示文字', type: 'textarea', required: true, grid: 3 }
        ]
    },
    weapons: {
        title: '武器管理',
        tableName: 'weapons',
        tableCols: ['名稱','職業類型', '等級', '說明', '操作'],
        displayFields: ['item','job', 'lv', 'illustrate'],
        fields: [
            { id: 'item', label: '名稱', type: 'text', required: true, grid: 1 },
            { id: 'sort_id', label: '顯示順序', type: 'number', grid: 1 },
            { id: 'class', label: '分類', type: 'select', options: ['武器'], grid: 1 , group: '分類'},
            { id: 'sort', label: '部位', type: 'text', grid: 1 , group: '分類'},
            { id: 'job', label: '職業類型', type: 'select', options: ['基礎職業','進階職業','極限裝備','新城寨裝備'], grid: 1 , group: '分類'},
            { id: 'pic', label: '無作用', type: 'text', grid: 1 },
            { id: 'lv', label: '等級', type: 'text', grid: 1 },
            { id: 'property1', label: '屬性1(防禦/攻擊)', type: 'text', grid: 1 },
            { id: 'property2', label: '屬性2(閃避/命中)', type: 'text', grid: 1 },
            { id: 'durability', label: '耐用', type: 'text', grid: 1 },
            { id: 'material1', label: '材料1', type: 'text', grid: 1 , group: '材料'},
            { id: 'material2', label: '材料2', type: 'text', grid: 1 , group: '材料'},
            { id: 'material3', label: '材料3', type: 'text', grid: 1 , group: '材料'},
            { id: 'material4', label: '材料4', type: 'text', grid: 1 , group: '材料'},
            { id: 'material5', label: '材料5', type: 'text', grid: 1 , group: '材料'},
            { id: 'material6', label: '材料6', type: 'text', grid: 1 , group: '材料'},
            { id: 'material7', label: '材料7', type: 'text', grid: 1 , group: '材料'},
            { id: 'material8', label: '材料8', type: 'text', grid: 1 , group: '材料'},
            { id: 'material9', label: '材料9', type: 'text', grid: 1 , group: '材料'},
            { id: 'material10', label: '材料10', type: 'text', grid: 1 , group: '材料'},
            { id: 'material11', label: '材料11', type: 'text', grid: 1 , group: '材料'},
            { id: 'illustrate', label: '說明(如要觸發modelbox請增加^&12&^)', type: 'textarea', grid: 3 },
            { id: 'gain', label: '特殊效果說明(modelbox)', type: 'textarea', grid: 3 },
        ]
    },
    equipment: {
        title: '防具管理',
        tableName: 'equipment',
        tableCols: ['名稱','職業類型', '等級', '說明', '操作'],
        displayFields: ['item','job', 'lv', 'illustrate'],
        fields: [
            { id: 'item', label: '名稱', type: 'text', required: true, grid: 1 },
            { id: 'sort_id', label: '顯示順序', type: 'number', grid: 1 },
            { id: 'class', label: '分類', type: 'select', options: ['防具'], grid: 1 , group: '分類'},
            { id: 'sort', label: '部位', type: 'text', grid: 1 , group: '分類'},
            { id: 'job', label: '職業類型', type: 'select', options: ['基礎職業','進階職業','極限裝備','新城寨裝備'], grid: 1 , group: '分類'},
            { id: 'pic', label: '無作用', type: 'text', grid: 1 },
            { id: 'lv', label: '等級', type: 'text', grid: 1 },
            { id: 'property1', label: '屬性1(防禦/攻擊)', type: 'text', grid: 1 },
            { id: 'property2', label: '屬性2(閃避/命中)', type: 'text', grid: 1 },
            { id: 'durability', label: '耐用', type: 'text', grid: 1 , group: '材料'},
            { id: 'material1', label: '材料1', type: 'text', grid: 1 , group: '材料'},
            { id: 'material2', label: '材料2', type: 'text', grid: 1 , group: '材料'},
            { id: 'material3', label: '材料3', type: 'text', grid: 1 , group: '材料'},
            { id: 'material4', label: '材料4', type: 'text', grid: 1 , group: '材料'},
            { id: 'material5', label: '材料5', type: 'text', grid: 1 , group: '材料'},
            { id: 'material6', label: '材料6', type: 'text', grid: 1 , group: '材料'},
            { id: 'material7', label: '材料7', type: 'text', grid: 1 , group: '材料'},
            { id: 'material8', label: '材料8', type: 'text', grid: 1 , group: '材料'},
            { id: 'material9', label: '材料9', type: 'text', grid: 1 , group: '材料'},
            { id: 'material10', label: '材料10', type: 'text', grid: 1 , group: '材料'},
            { id: 'material11', label: '材料11', type: 'text', grid: 1 , group: '材料'},
            { id: 'illustrate', label: '說明(如要觸發modelbox請增加^&12&^)', type: 'textarea', grid: 3 },
            { id: 'gain', label: '特殊效果說明(modelbox)', type: 'text', grid: 1 },
        ]
    },
    detailed_map: {
        title: '地圖資訊',
        tableName: 'detailed_map',
        tableCols: ['地圖名稱','特別顯示', '等級', '最大X', '最大Y', '操作'],
        displayFields: ['mapid','approach_a', 'lv', 'game_max_x', 'game_max_y'],
        fields: [
            { id: 'mapid', label: '地圖名稱', type: 'text', required: true, grid: 1, group: '基礎資訊' },
            { id: 'sort_id', label: '顯示順序', type: 'number', grid: 1, group: '基礎資訊' },
            { id: 'maplv', label: '地圖等級', type: 'text', grid: 1, group: '基礎資訊' },
            { id: 'game_max_x', label: '遊戲最大X (比例尺)', type: 'number', grid: 1, group: '基礎資訊' },
            { id: 'game_max_y', label: '遊戲最大Y (比例尺)', type: 'number', grid: 1, group: '基礎資訊' },

            { id: 'def', label: '建議防禦', type: 'number', grid: 1, group: '地圖數值' },
            { id: 'dodge', label: '建議閃避', type: 'number', grid: 1, group: '地圖數值' },
            { id: 'monster', label: '主要怪物', type: 'text', grid: 1, group: '地圖數值' },
            { id: 'monster_atk', label: '怪物攻擊類型', type: 'text', grid: 1, group: '地圖數值' },

            { id: 'approach_a', label: '特別顯示(洞窟暫無作用)', type: 'checkbox', options: ['要','城鎮','說明','洞窟'], grid: 1, group: '地圖導航' },
            { id: 'approach', label: '迷宮走法', type: 'textarea', grid: 3, group: '地圖導航' },
            { id: 'illustrate', label: '說明', type: 'text', grid: 2, group: '地圖導航' },
            
            { id: 'drop_rubbish', label: '垃圾掉落', type: 'textarea', grid: 1, group: '一般掉落' },
            { id: 'drop_othrt', label: '其他掉落', type: 'textarea', grid: 1, group: '一般掉落' },
            { id: 'drop_glory_player', label: '光輝(玩家提供)', type: 'text', grid: 1, group: '一般掉落' },
            
            { id: 'drop_hero', label: '英雄卡掉落', type: 'textarea', grid: 1, group: '卡片掉落' },
            { id: 'drop_equidcard', label: '裝備卡掉落', type: 'textarea', grid: 1, group: '卡片掉落' },
            { id: 'drop_skillcard', label: '技能卡掉落', type: 'textarea', grid: 1, group: '卡片掉落' },
            
            { id: 'drop_combo_old', label: '舊文片掉落', type: 'textarea', grid: 1, group: '文片掉落' },
            { id: 'drop_combo_new', label: '新文片掉落', type: 'textarea', grid: 1, group: '文片掉落' }
        ]
    },
    map_resources: {
        title: '採集點位管理',
        tableName: 'map_resources',
        tableCols: ['所屬地圖', '資源名稱', '遊戲座標', '操作'],
        displayFields: ['map_id', 'resource_name', 'game_coords'],
        fields: [
            { id: 'map_id', label: '所屬地圖 (完全對應)', type: 'text', required: true, grid: 1 },
            { id: 'resource_name', label: '資源名稱', type: 'text', required: true, grid: 1 },
            { id: 'game_coords', label: '遊戲真實座標 (顯示給玩家看)', type: 'text', placeholder: '例如: 20, 36', grid: 1 },
            { id: 'x', label: '圖片像素 X (定位用)', type: 'number', required: true, grid: 1 },
            { id: 'y', label: '圖片像素 Y (定位用)', type: 'number', required: true, grid: 1 },
            { id: 'category', label: '類別', type: 'select', options: ['挖礦', '狩獵', '伐木', '紡織', '採砂', '採集', '其他'], grid: 1 },
            { id: 'sort_id', label: '顯示順序', type: 'number', grid: 1 }
        ]
    },
    quests: {
        title: '任務管理',
        tableName: 'quests',
        tableCols: ['任務ID', '地區', '限制', '塞選條件', '操作'],
        displayFields: ['quest_id', 'area', 'restriction', 'star'],
        fields: [
            { id: 'quest_id', label: '任務ID (名稱)', type: 'text', required: true, grid: 1 },
            { id: 'sort_id', label: '顯示順序', type: 'number', grid: 1 },
            { id: 'area', label: '地區', type: 'text', grid: 1 },
            { id: 'star', label: '塞選條件', type: 'text', grid: 1 },
            { id: 'start', label: '開始 (NPC/地點)', type: 'text', grid: 2 },
            { id: 'restriction', label: '限制條件', type: 'text', grid: 2 },
            { id: 'award', label: '任務流程(道具可用^&3條老鼠尾巴&^)會有標記', type: 'textarea', grid: 3 },
            { id: 'process', label: '獎勵內容(多)', type: 'textarea', grid: 3 },
            { id: 'process_exp', label: '經驗值', type: 'text', grid: 1, group: '獲得數值' },
            { id: 'process_renown', label: '名聲', type: 'text', grid: 1, group: '獲得數值' },
            { id: 'process_money', label: '金錢', type: 'text', grid: 1, group: '獲得數值' },
            { id: 'process_item', label: '獲得道具', type: 'textarea', grid: 2, group: '獲得數值' },
            { id: 'remark', label: '備註', type: 'textarea', grid: 3 },
            { id: 'image', label: '圖片連結', type: 'text', grid: 3 }
        ]
    },
};
