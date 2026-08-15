// ==========================================
// 專屬技能與等級母子表編輯器 (Skill Manager)
// ==========================================
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm'
import { SUPABASE_URL, SUPABASE_KEY } from './supabase-config.js'

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)
let currentSkillLevelsData = []; // 暫存從資料庫撈回來的各等級資料

// 1. 動態注入專屬的 Modal HTML 到畫面上
function initSkillManagerModal() {
    // 如果已經建立過了，就不要重複建立
    if (document.getElementById('skillManagerModal')) return;

    const modalHTML = `
    <div id="skillManagerModal" class="modal" style="display:none; z-index: 2000;">
        <div class="modal-content" style="max-width: 900px; max-height: 90vh; overflow-y: auto;">
            <span class="close" onclick="closeSkillManager()">&times;</span>
            <h2 style="margin-bottom: 20px; border-bottom: 2px solid #4a90e2; padding-bottom: 10px;">
                ⚔️ 技能進階編輯器
            </h2>

            <!-- 上半部：主技能設定 -->
            <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
                <h3 style="margin-top:0; font-size: 1.1em; color: #333;">📖 基礎技能設定</h3>
                <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px;">
                    <div>
                        <label style="display:block; font-weight:bold; margin-bottom:5px;">技能 ID (不可改)</label>
                        <input type="text" id="sm-skill-id" readonly style="width:100%; padding:8px; background:#e9ecef; border:1px solid #ccc; border-radius:4px;">
                    </div>
                    <div>
                        <label style="display:block; font-weight:bold; margin-bottom:5px;">技能名稱</label>
                        <input type="text" id="sm-skill-name" style="width:100%; padding:8px; border:1px solid #ccc; border-radius:4px;">
                    </div>
                    <div>
                        <label style="display:block; font-weight:bold; margin-bottom:5px;">最高等級 (Max Level)</label>
                        <!-- 當修改最高等級時，自動重新計算下方的表格列數 -->
                        <input type="number" id="sm-skill-max-level" min="1" max="30" onchange="generateLevelRows()" style="width:100%; padding:8px; border:1px solid #ccc; border-radius:4px;">
                    </div>
                </div>
            </div>

            <!-- 下半部：各等級數據設定 -->
            <div>
                <div style="display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 10px;">
                    <h3 style="margin:0; font-size: 1.1em; color: #333;">📊 各等級數據設定</h3>
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
                        <tbody id="sm-levels-tbody">
                            <!-- 這裡會由 JS 迴圈動態產生 -->
                        </tbody>
                    </table>
                </div>
            </div>

            <div style="margin-top: 30px; text-align: right;">
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
    // 確保 HTML 已經注入
    initSkillManagerModal(); 
    
    try {
        console.log("開始讀取技能資料...");
        // 同時去 Supabase 撈取技能主表與所有的等級子表
        const [skillRes, levelsRes] = await Promise.all([
            supabase.from('skills').select('*').eq('id', skillId).single(),
            supabase.from('skill_levels').select('*').eq('skill_id', skillId).order('level', { ascending: true })
        ]);

        if (skillRes.error) throw skillRes.error;
        
        const skillData = skillRes.data;
        currentSkillLevelsData = levelsRes.data || []; // 存入全域變數供後續比對使用

        // 填入上半部基礎資料
        document.getElementById('sm-skill-id').value = skillData.id || skillId;
        document.getElementById('sm-skill-name').value = skillData.name || '';
        // 如果原本沒有設定最高等級，預設給 5
        document.getElementById('sm-skill-max-level').value = skillData.max_level || 5;

        // 觸發下半部表格渲染
        generateLevelRows();

        // 顯示 Modal
        document.getElementById('skillManagerModal').style.display = 'block';

    } catch (err) {
        console.error("讀取技能數據失敗:", err);
        alert("讀取技能數據失敗，請檢查網路或 F12 Console。");
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

// 5. 儲存邏輯 (下一步實作)
async function saveSkillAndLevels() {
    alert("介面渲染成功！準備進入下一步：實作批次儲存邏輯。");
    console.log("按下儲存按鈕");
}