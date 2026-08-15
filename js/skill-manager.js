// ==========================================
// 專屬技能與等級母子表編輯器 (Skill Manager)
// ==========================================
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm'
import { SUPABASE_URL, SUPABASE_KEY } from './supabase-config.js'

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)
let currentSkillLevelsData = []; // 暫存從資料庫撈回來的各等級資料

// 1. 動態注入專屬 Modal HTML
function initSkillManagerModal() {
    if (document.getElementById('skillManagerModal')) return;

    const modalHTML = `
    <div id="skillManagerModal" class="skill-modal-backdrop" style="
        display: none; position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; 
        background: rgba(0, 0, 0, 0.65); backdrop-filter: blur(3px); z-index: 9999;
    ">
        <div class="skill-modal-container" style="
            position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); 
            width: 90%; max-width: 1000px; max-height: 88vh; background: #ffffff; 
            border-radius: 12px; box-shadow: 0 10px 30px rgba(0,0,0,0.3); padding: 25px; 
            overflow-y: auto; box-sizing: border-box; color: #333;
        ">
            <span class="close" onclick="closeSkillManager()" style="position: absolute; right: 20px; top: 15px; font-size: 28px; cursor: pointer; color: #888;">&times;</span>

            <h2 style="margin-top: 0; margin-bottom: 20px; border-bottom: 2px solid #4a90e2; padding-bottom: 10px;">
                ⚔️ 技能進階編輯器
            </h2>

            <!-- 💡 上半部：改為動態渲染容器 -->
            <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px; border: 1px solid #e9ecef;">
                <h3 style="margin-top:0; font-size: 1.1em; color: #333; border-bottom: 1px dashed #ccc; padding-bottom: 8px;">📖 基礎技能設定</h3>
                
                <!-- 這裡會由 JS 讀取 TABLE_CONFIGS 動態帶入所有欄位 -->
                <div id="sm-base-fields-container"></div>
            </div>

            <!-- 下半部：各等級數據設定 -->
            <div>
                <div style="display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 10px;">
                    <h3 style="margin:0; font-size: 1.1em; color: #333;">📊 各等級數據設定 (skill_levels)</h3>
                    <small style="color: #d9534f; font-weight: bold;">修改上方「最高等級」會自動增減下方列表</small>
                </div>
                <div style="overflow-x: auto; border: 1px solid #ddd; border-radius: 8px;">
                    <table style="width: 100%; border-collapse: collapse; font-size: 0.9em; text-align: left;">
                        <thead>
                            <tr style="background: #343a40; color: white;">
                                <th style="padding: 10px;">等級</th>
                                <th style="padding: 10px;">冷卻(s)</th>
                                <th style="padding: 10px;">MP消耗</th>
                                <th style="padding: 10px;">威力倍率(%)</th>
                                <th style="padding: 10px;">施法(s)</th>
                                <th style="padding: 10px;">專屬說明</th>
                            </tr>
                        </thead>
                        <tbody id="sm-levels-tbody"></tbody>
                    </table>
                </div>
            </div>

            <!-- 底部操作按鈕 -->
            <div style="margin-top: 25px; text-align: right;">
                <button onclick="closeSkillManager()" style="padding: 10px 20px; background: #6c757d; color: white; border: none; border-radius: 4px; cursor: pointer; margin-right: 10px;">取消</button>
                <button onclick="saveSkillAndLevels()" style="padding: 10px 20px; background: #28a745; color: white; border: none; border-radius: 4px; cursor: pointer; font-weight: bold;">💾 儲存所有變更</button>
            </div>
        </div>
    </div>
    `;
    document.body.insertAdjacentHTML('beforeend', modalHTML);
}

// 2. 開啟編輯器並讀取資料
async function openSkillManager(skillId) {
    initSkillManagerModal(); 
    
    try {
        console.log("開始讀取技能資料...", skillId);
        const [skillRes, levelsRes] = await Promise.all([
            supabase.from('skills').select('*').eq('id', skillId).single(),
            supabase.from('skill_levels').select('*').eq('skill_id', skillId).order('level', { ascending: true })
        ]);

        if (skillRes.error) throw skillRes.error;
        const skillData = skillRes.data || {};
        currentSkillLevelsData = levelsRes.data || [];

        // 💡 讀取 TABLE_CONFIGS 中的 skills 欄位定義
        const skillConfig = (typeof TABLE_CONFIGS !== 'undefined' && TABLE_CONFIGS.skills) ? TABLE_CONFIGS.skills : null;
        const container = document.getElementById('sm-base-fields-container');

        if (skillConfig && skillConfig.fields) {
            // 1. 根據 group 分類欄位
            const groups = {};
            skillConfig.fields.forEach(f => {
                const groupName = f.group || '一般設定';
                if (!groups[groupName]) groups[groupName] = [];
                groups[groupName].push(f);
            });

            // 2. 動態生成 HTML
            container.innerHTML = Object.keys(groups).map(groupName => {
                const fieldsHtml = groups[groupName].map(f => {
                    const value = skillData[f.id] ?? '';
                    const isReadOnly = (f.id === 'id') ? 'readonly style="background:#e9ecef;"' : '';
                    const onChangeAttr = (f.id === 'max_level') ? 'onchange="generateLevelRows()"' : '';
                    
                    let input = '';
                    if (f.type === 'textarea') {
                        input = `<textarea id="sm-skill-${f.id}" rows="2" style="width:100%; padding:6px; border:1px solid #ccc; border-radius:4px; box-sizing:border-box;">${value}</textarea>`;
                    } else {
                        input = `<input type="${f.type || 'text'}" id="sm-skill-${f.id}" value="${value}" ${isReadOnly} ${onChangeAttr} placeholder="${f.placeholder || ''}" style="width:100%; padding:6px; border:1px solid #ccc; border-radius:4px; box-sizing:border-box;">`;
                    }

                    return `
                        <div style="grid-column: span ${f.grid || 1};">
                            <label style="display:block; font-weight:bold; font-size:0.85em; margin-bottom:4px; color:#555;">${f.label}</label>
                            ${input}
                        </div>
                    `;
                }).join('');

                return `
                    <div style="margin-bottom: 12px;">
                        <div style="font-weight:bold; color:#4a90e2; font-size:0.9em; margin-bottom:6px;">📌 ${groupName}</div>
                        <div style="display:grid; grid-template-columns: repeat(4, 1fr); gap: 10px;">
                            ${fieldsHtml}
                        </div>
                    </div>
                `;
            }).join('');
        }

        // 渲染下半部等級表格
        generateLevelRows();

        // 顯示 Modal
        document.getElementById('skillManagerModal').style.display = 'block';

    } catch (err) {
        console.error("讀取技能數據失敗:", err);
        alert("讀取技能數據失敗，請檢查 F12 Console。");
    }
}

// 3. 根據「最高等級」動態產生對應的輸入列
function generateLevelRows() {
    const maxLevel = parseInt(document.getElementById('sm-skill-max-level').value) || 1;
    const tbody = document.getElementById('sm-levels-tbody');
    tbody.innerHTML = ''; // 清空原本的列表

    // 從 Lv 1 跑到最高等級
    for (let i = 1; i <= maxLevel; i++) {
        // 尋找資料庫撈回來的資料中，有沒有這個等級的舊資料？
        const existingData = currentSkillLevelsData.find(d => d.level === i) || {};

        const tr = document.createElement('tr');
        tr.style.borderBottom = "1px solid #dee2e6";
        
        // 建立每一格的 input，並利用 data-level 和 data-field 標記它們，方便儲存時抓取
        tr.innerHTML = `
            <td style="padding: 8px 10px; font-weight: bold; color: #4a90e2;">
                Lv ${i}
                <!-- 隱藏欄位記錄該等級原始的 UUID (如果有的話) -->
                <input type="hidden" class="sm-lvl-input" data-level="${i}" data-field="id" value="${existingData.id || ''}">
            </td>
            <td style="padding: 8px;"><input type="number" step="0.1" class="sm-lvl-input" data-level="${i}" data-field="cooldown" value="${existingData.cooldown || 0}" style="width: 70px; padding: 4px;"></td>
            <td style="padding: 8px;"><input type="number" class="sm-lvl-input" data-level="${i}" data-field="mp_cost" value="${existingData.mp_cost || 0}" style="width: 70px; padding: 4px;"></td>
            <td style="padding: 8px;"><input type="text" class="sm-lvl-input" data-level="${i}" data-field="power_rate" value="${existingData.power_rate || '100'}" style="width: 90px; padding: 4px;"></td>
            <td style="padding: 8px;"><input type="number" step="0.1" class="sm-lvl-input" data-level="${i}" data-field="cast_time" value="${existingData.cast_time || 0}" style="width: 70px; padding: 4px;"></td>
            <td style="padding: 8px;"><input type="text" class="sm-lvl-input" data-level="${i}" data-field="description" value="${existingData.description || ''}" style="width: 95%; padding: 4px;" placeholder="該等級說明..."></td>
        `;
        tbody.appendChild(tr);
    }
}

// 4. 關閉視窗
function closeSkillManager() {
    document.getElementById('skillManagerModal').style.display = 'none';
}

// 5. 儲存邏輯
async function saveSkillAndLevels() {
    try {
        const skillId = document.getElementById('sm-skill-id').value;
        const skillConfig = (typeof TABLE_CONFIGS !== 'undefined' && TABLE_CONFIGS.skills) ? TABLE_CONFIGS.skills : null;
        
        // 動態收集上半部所有技能主表的欄位數值
        const updateSkillData = {};
        if (skillConfig && skillConfig.fields) {
            skillConfig.fields.forEach(f => {
                const el = document.getElementById(`sm-skill-${f.id}`);
                if (el) {
                    let val = el.value;
                    if (f.type === 'number') {
                        val = val !== '' ? Number(val) : null;
                    }
                    updateSkillData[f.id] = val;
                }
            });
        }

        // 1. 更新主表 (skills)
        const { error: skillError } = await supabase
            .from('skills')
            .update(updateSkillData)
            .eq('id', skillId);

        if (skillError) throw skillError;

        // 2. 收集下半部 (skill_levels)
        const rows = document.querySelectorAll('#sm-levels-tbody tr');
        const levelsToUpsert = [];

        rows.forEach(row => {
            const inputs = row.querySelectorAll('.sm-lvl-input');
            let rowData = { skill_id: skillId };

            inputs.forEach(input => {
                const field = input.getAttribute('data-field');
                const level = parseInt(input.getAttribute('data-level'));
                rowData.level = level;

                let val = input.value;
                if (field === 'id') {
                    if (val) rowData.id = val;
                } else if (field === 'cooldown' || field === 'cast_time') {
                    rowData[field] = parseFloat(val) || 0;
                } else if (field === 'mp_cost') {
                    rowData[field] = parseInt(val) || 0;
                } else {
                    rowData[field] = val;
                }
            });

            levelsToUpsert.push(rowData);
        });

        // 3. 批次寫入等級表
        const { error: levelsError } = await supabase
            .from('skill_levels')
            .upsert(levelsToUpsert);

        if (levelsError) throw levelsError;

        alert("🎉 所有技能數據與等級數值儲存成功！");
        closeSkillManager();

        if (typeof loadTableData === 'function') {
            loadTableData();
        }

    } catch (err) {
        console.error("儲存失敗:", err);
        alert("儲存失敗，請檢查 F12 Console。");
    }
}

// ==========================================
// 🔗 將需要讓 HTML 或其他腳本呼叫的函式暴露至 window 全域
// ==========================================
window.openSkillManager = openSkillManager;
window.closeSkillManager = closeSkillManager;
window.generateLevelRows = generateLevelRows;
window.saveSkillAndLevels = saveSkillAndLevels;