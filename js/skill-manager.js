// ==========================================
// 專屬技能與等級母子表編輯器 (Skill Manager)
// ==========================================
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm'
import { SUPABASE_URL, SUPABASE_KEY } from './supabase-config.js'

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
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

            <!-- 上半部：基礎技能設定 -->
            <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px; border: 1px solid #e9ecef;">
                <h3 style="margin-top:0; font-size: 1.1em; color: #333; border-bottom: 1px dashed #ccc; padding-bottom: 8px;">📖 基礎技能設定</h3>
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
export async function openSkillManager(skillId) {
    initSkillManagerModal(); 
    
    try {
        const [skillRes, levelsRes] = await Promise.all([
            supabase.from('skills').select('*').eq('id', skillId).single(),
            supabase.from('skill_levels').select('*').eq('skill_id', skillId).order('level', { ascending: true })
        ]);

        if (skillRes.error) throw skillRes.error;
        const skillData = skillRes.data || {};
        currentSkillLevelsData = levelsRes.data || [];

        const configs = window.TABLE_CONFIGS || (typeof TABLE_CONFIGS !== 'undefined' ? TABLE_CONFIGS : null);
        const skillConfig = configs ? configs.skills : null;
        const container = document.getElementById('sm-base-fields-container');

        if (skillConfig && skillConfig.fields) {
            const groups = {};
            skillConfig.fields.forEach(f => {
                const groupName = f.group || '一般設定';
                if (!groups[groupName]) groups[groupName] = [];
                groups[groupName].push(f);
            });

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
                        <div style="font-weight:bold; color:#4a90e2; font-size:0.9em; margin-bottom: 8px;">${groupName}</div>
                        <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px;">${fieldsHtml}</div>
                    </div>
                `;
            }).join('');
        }

        generateLevelRows();
        document.getElementById('skillManagerModal').style.display = 'block';

    } catch (err) {
        alert('載入技能資料失敗: ' + err.message);
    }
}

// 3. 動態渲染 skill_levels 表格列
export function generateLevelRows() {
    const maxLevel = parseInt(document.getElementById('sm-skill-max_level')?.value || 1);
    const tbody = document.getElementById('sm-levels-tbody');
    let html = '';

    for (let lvl = 1; lvl <= maxLevel; lvl++) {
        const existData = currentSkillLevelsData.find(d => d.level === lvl) || {};

        html += `
            <tr style="border-bottom: 1px solid #eee;">
                <td style="padding: 8px 10px; font-weight: bold; background: #fdfdfd;">Lv.${lvl}</td>
                <td style="padding: 6px;"><input type="number" step="0.1" class="sm-lvl-cooldown" data-lvl="${lvl}" value="${existData.cooldown ?? 0}" style="width: 70px; padding: 4px;"></td>
                <td style="padding: 6px;"><input type="number" class="sm-lvl-mp_cost" data-lvl="${lvl}" value="${existData.mp_cost ?? 0}" style="width: 70px; padding: 4px;"></td>
                <td style="padding: 6px;"><input type="text" class="sm-lvl-power_rate" data-lvl="${lvl}" value="${existData.power_rate ?? ''}" style="width: 90px; padding: 4px;"></td>
                <td style="padding: 6px;"><input type="number" step="0.1" class="sm-lvl-cast_time" data-lvl="${lvl}" value="${existData.cast_time ?? 0}" style="width: 70px; padding: 4px;"></td>
                <td style="padding: 6px;"><input type="text" class="sm-lvl-description" data-lvl="${lvl}" value="${existData.description ?? ''}" style="width: 100%; padding: 4px; box-sizing: border-box;"></td>
            </tr>
        `;
    }
    tbody.innerHTML = html;
}

// 4. 關閉彈窗
export function closeSkillManager() {
    const modal = document.getElementById('skillManagerModal');
    if (modal) modal.style.display = 'none';
}

// 5. 儲存 Skills 與 Skill_levels (解決 NOT NULL 限制問題)
export async function saveSkillAndLevels() {
    const skillId = document.getElementById('sm-skill-id')?.value;
    const maxLevelInput = document.getElementById('sm-skill-max_level')?.value;
    const maxLevel = parseInt(maxLevelInput, 10) || 1;

    const configs = window.TABLE_CONFIGS || (typeof TABLE_CONFIGS !== 'undefined' ? TABLE_CONFIGS : null);
    const skillConfig = configs ? configs.skills : null;

    if (!skillConfig) {
        alert('❌ 找不到 skills 表的設定檔 (TABLE_CONFIGS.skills)');
        return;
    }

    // 收集主表資料 (skills)
    const skillUpdates = {};
    skillConfig.fields.forEach(f => {
        const el = document.getElementById(`sm-skill-${f.id}`);
        if (el) {
            let val = el.value.trim();

            if (f.type === 'number') {
                // 1. 如果設定檔明確標示為 number，空字串轉 null (或 0)
                skillUpdates[f.id] = val === '' ? null : Number(val);
            } else {
                // 2. 如果非 number，但欄位填了空字串 ""，一律轉成 null
                // 這樣就算 admin-config.js 型態寫錯，也不會拿 "" 去硬塞 Supabase 的整數欄位
                skillUpdates[f.id] = val === '' ? null : val;
            }
        }
    });
 

    // 收集副表資料 (skill_levels)
    const levelUpdates = [];
    for (let lvl = 1; lvl <= maxLevel; lvl++) {
        const cooldownVal = document.querySelector(`.sm-lvl-cooldown[data-lvl="${lvl}"]`)?.value.trim();
        const mpCostVal = document.querySelector(`.sm-lvl-mp_cost[data-lvl="${lvl}"]`)?.value.trim();
        const castTimeVal = document.querySelector(`.sm-lvl-cast_time[data-lvl="${lvl}"]`)?.value.trim();

        levelUpdates.push({
            skill_id: skillId,
            level: lvl,
            cooldown: (cooldownVal === '' || isNaN(cooldownVal)) ? 0 : parseFloat(cooldownVal),
            mp_cost: (mpCostVal === '' || isNaN(mpCostVal)) ? 0 : parseInt(mpCostVal, 10),
            power_rate: document.querySelector(`.sm-lvl-power_rate[data-lvl="${lvl}"]`)?.value.trim() || '',
            cast_time: (castTimeVal === '' || isNaN(castTimeVal)) ? 0 : parseFloat(castTimeVal),
            description: document.querySelector(`.sm-lvl-description[data-lvl="${lvl}"]`)?.value.trim() || ''
        });
    }

    try {
        console.log("📤 準備寫入 skills 表的 Payload:", skillUpdates);

        // 更新 Skills 主表
        const { error: skillErr } = await supabase.from('skills').upsert(skillUpdates);
        if (skillErr) throw skillErr;

        // 更新 Skill_levels 副表
        const { error: lvlErr } = await supabase.from('skill_levels').upsert(levelUpdates, { onConflict: 'skill_id,level' });
        if (lvlErr) throw lvlErr;

        alert('✅ 技能與各等級數據儲存成功！');
        closeSkillManager();
        if (typeof window.loadTableData === 'function') window.loadTableData();

    } catch (err) {
        console.error("❌ 儲存失敗完整錯誤:", err);
        alert('❌ 儲存失敗: ' + err.message);
    }
}

// 🚀 將重要函式掛載至全局全域 (window)，讓 HTML 觸發能直接抓到
window.openSkillManager = openSkillManager;
window.closeSkillManager = closeSkillManager;
window.generateLevelRows = generateLevelRows;
window.saveSkillAndLevels = saveSkillAndLevels;