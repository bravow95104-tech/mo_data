import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm'
import { SUPABASE_URL, SUPABASE_KEY } from './supabase-config.js'

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

// 狀態管理
let allSkills = []
let allocatedPoints = {}
let remainingPoints = 200
let currentJob = '' 
let currentParentJobId = ''
let currentTab = ''
let currentTabSkills = []

// DOM 快取
const tabsContainer = document.getElementById('tabsContainer')
const jobSelect = document.getElementById('jobSelect')
const treeContainer = document.getElementById('treeContainer')
const remainingPointsEl = document.getElementById('remainingPoints')
const resetBtn = document.getElementById('resetBtn')
const tooltip = document.getElementById('tooltip')
const usedPointsEl = document.getElementById('usedPoints')
const baseJobPointsTextEl = document.getElementById('baseJobPointsText') // 若有加子標籤的話

async function init() {
  await fetchJobs()
  await fetchSkills(currentJob)
  bindEvents()
}

// 1. 撈取下拉選單 (排除 _adv_common 這些內部用的共用類別)
async function fetchJobs() {
  const { data } = await supabase
    .from('job_classes')
    .select('*')
    .order('job_tier', { ascending: true })

  if (!data || data.length === 0) return

  // 過濾掉 id 結尾包含 _adv_common 的項目，只留真正能選的職業
  const selectableJobs = data.filter(j => !j.id.endsWith('_adv_common'))

  jobSelect.innerHTML = selectableJobs
    .map(j => `<option value="${j.id}">${j.job_tier === 1 ? '[基礎] ' : '[轉職] '}${j.name}</option>`)
    .join('')

  currentJob = selectableJobs[0].id
  jobSelect.value = currentJob
}

// 2. 撈取技能 (動態對應 parent_id 的共用技能)
async function fetchSkills(jobId) {
  if (!jobId) return

  // 1. 撈取當前選擇職業的詳細資訊
  const { data: jobData } = await supabase
    .from('job_classes')
    .select('*')
    .eq('id', jobId)
    .single()

  if (!jobData) return

  let targetJobIds = []

  // 2. 判斷是否為轉職後 (job_tier === 2)
  if (jobData.job_tier === 2) {
    // 取得基礎職 ID (例如 sorcerer)
    const parentJobId = jobData.parent_id 
    currentParentJobId = parentJobId
    
    // 動態拼出對應的進階共用 ID (例如 sorcerer_adv_common)
    const commonJobId = `${parentJobId}_adv_common`
    
    // 撈取：[基礎職, 當前轉職, 對應的進階共用]
    targetJobIds = [parentJobId, jobId, commonJobId, 'global_adv_common']
  } else {
    // 基礎職 (job_tier === 1，例如 sorcerer)：只撈取自己！
    currentParentJobId = jobId
    targetJobIds = [jobId]
  }

  console.log('當前查詢的 targetJobIds:', targetJobIds) // 方便你在 F12 Console 觀察

  // 3. 查詢 Supabase 技能表
  const { data } = await supabase
    .from('skills')
    .select('*')
    .in('job_id', targetJobIds)

  if (data) {
    allSkills = data
    currentTab = '' // 重置頁籤
    renderTabs()
    renderTabTree()
  }
}
// 動態渲染技能頁籤 (Tabs)
function renderTabs() {
  if (!tabsContainer || !allSkills || allSkills.length === 0) return

  // 1. 從當前職業的所有技能中，收集出不重複的 skill_type 列表
  const rawTypes = [...new Set(allSkills.map(s => s.skill_type || '通用'))]

  // 2. 頁籤排序邏輯 (可依遊戲習慣自訂順序)
  const typeOrder = [
  // 基礎職系
  '武技', '強化技', '五行', '咒術', '恢復技', '霧擊技', '箭技', '體技',
  
  // 五行細分
  '金', '木', '水', '火', '土',

  // 轉職二轉進階系 (戰士/刺客/弓手/巧匠系)
  '御武術', '神武術', '斬刀技', '兵法學', '霸槍法', 
  '神射術', '機關術', '裝甲術', '影體術', '暗殺術',

  // 轉職二轉進階系 (術士/策士/風水/藥師系)
  '靈行術', '活祭', '血魔術', '法寶', '仙靈術', 
  '符打術', '天壇術', '遁甲學', '元武術', '真道學', 
  '天醫術', '秘藥學', '經絡學', '蠱毒術', '毒霧術',

  // 共用 / 合體
  '合體技'
]
  const categories = rawTypes.sort((a, b) => {
    const idxA = typeOrder.indexOf(a)
    const idxB = typeOrder.indexOf(b)
    if (idxA !== -1 && idxB !== -1) return idxA - idxB
    if (idxA !== -1) return -1
    if (idxB !== -1) return 1
    return a.localeCompare(b, 'zh-TW')
  })

  // 3. 如果預設當前頁籤為空，或是當前頁籤不在該職業的分類裡，預設選第一個
  if (!currentTab || !categories.includes(currentTab)) {
    currentTab = categories[0]
  }

  // 4. 渲染 HTML 頁籤按鈕
  tabsContainer.innerHTML = categories
    .map(type => `
      <button class="tab-btn ${type === currentTab ? 'active' : ''}" data-type="${type}">
        ${type}
      </button>
    `)
    .join('')
}

// 渲染技能樹 (含 DOM 實體座標精準算線)
function renderTabTree() {
    // 1. 計算點數
  const totalUsed = 200 - remainingPoints // 總已點點數

  // 計算「基礎職業」累積點數 (對照 120 點門檻)
  let baseJobUsed = 0
  allSkills.forEach(s => {
    if (s.job_id === currentParentJobId) {
      baseJobUsed += (allocatedPoints[s.id] || 0)
    }
  })

  // 2. 更新 DOM 顯示
  if (remainingPointsEl) remainingPointsEl.innerText = remainingPoints
  if (usedPointsEl) usedPointsEl.innerText = totalUsed
  
  if (baseJobPointsTextEl) {
    baseJobPointsTextEl.innerText = `(基礎: ${baseJobUsed}/120)`
    // 如果基礎點數已經滿 120，可以順便變色 highlight
    if (baseJobUsed >= 120) {
      baseJobPointsTextEl.style.color = '#00ff88' // 綠色代表達標
    } else {
      baseJobPointsTextEl.style.color = '#aaa'
    }
  }

  if (remainingPointsEl) remainingPointsEl.innerText = remainingPoints

currentTabSkills = allSkills.filter(s => (s.skill_type || '通用') === currentTab)
  
  const defaultIcon = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='54' height='54'><rect width='54' height='54' fill='%23ffd369'/><text x='50%' y='55%' dominant-baseline='middle' text-anchor='middle' font-size='12' font-weight='bold'>SKILL</text></svg>"
  // 1. 先繪製 HTML 結構
  treeContainer.innerHTML = `
    <div class="skill-tree-wrapper" style="position: relative;">
      <!-- 🔥 將 SVG ID 統一改為 skillLinesSvg -->
      <svg class="tree-svg-layer" id="skillLinesSvg" style="position: absolute; top:0; left:0; width:100%; height:100%; pointer-events:none; z-index:1;">
      </svg>

      <!-- 技能網格層 -->
      <div class="skill-tree-grid" id="skillGrid" style="position: relative; z-index: 2;">
        ${currentTabSkills.map(skill => {
          const level = allocatedPoints[skill.id] || 0
          const maxLevel = skill.max_level || 10
          
          // 判斷前置技能是否未達標 (僅作為樣式輔助，不再鎖死按鈕)
          let isReqNotMet = false
          if (skill.req_skill_id) {
            const reqLevel = allocatedPoints[skill.req_skill_id] || 0
            if (reqLevel < skill.req_skill_level) isReqNotMet = true
          }

          const x = skill.grid_x ?? skill.x ?? 1
          const y = skill.grid_y ?? skill.y ?? 1

          return `
            <div class="grid-skill-node ${isReqNotMet ? 'not-met' : ''}" 
                 id="node-${skill.id}"
                 data-x="${x}" data-y="${y}"
                 style="grid-column: ${x}; grid-row: ${y};">
              
              <div class="node-icon-box" data-id="${skill.id}">
                <img src="/mo_data/pic/skills/${skill.name}.png" 
       alt="${skill.name}" 
       onerror="this.onerror=null; this.src='${defaultIcon}';">
              </div>

              <div class="node-status-line">
                <button class="btn-step btn-minus ${level <= 0 ? 'disabled' : ''}" 
                        data-action="minus" data-id="${skill.id}">-</button>
                        
                <span class="level-text">${level}/${maxLevel}</span>

                <!-- 🔥 這裡把 isLocked 拿掉！只要滿級或點數為 0 才禁用 -->
                <button class="btn-step btn-add ${level >= maxLevel || remainingPoints <= 0 ? 'disabled' : ''}" 
                        data-action="plus" data-id="${skill.id}">+</button>
              </div>
              
            </div>
          `
        }).join('')}
      </div>
    </div>
  `

  // 2. 渲染完成後，動態量測 DOM 節點的真實座標並繪製 SVG
  requestAnimationFrame(() => {
  requestAnimationFrame(drawLines)
})
}

// 動態繪製 SVG 畫線函數 (縱向技能樹專用精準版)
function drawLines() {
  const svg = document.getElementById('skillLinesSvg')
  if (!svg) return
  svg.innerHTML = '' // 清空舊線

  const activeSkills = (currentTabSkills && currentTabSkills.length > 0)
    ? currentTabSkills
    : allSkills.filter(s => (s.skill_type || '通用') === currentTab)

  if (!activeSkills || activeSkills.length === 0) return

  // 1. 將技能依前置技能 (req_skill_id 或 parent_id) 分組
  const parentMap = {}
  activeSkills.forEach(skill => {
    const parentId = skill.req_skill_id || skill.parent_id
    if (parentId) {
      if (!parentMap[parentId]) parentMap[parentId] = []
      parentMap[parentId].push(skill)
    }
  })

  // 2. 遍歷每個父技能，繪製連接線
  Object.keys(parentMap).forEach(parentId => {
    const parentNode = document.querySelector(`.node-icon-box[data-id="${parentId}"]`) 
                       || document.getElementById(`node-${parentId}`)
    if (!parentNode) return

    const children = parentMap[parentId]
    const parentRect = parentNode.getBoundingClientRect()
    const containerRect = svg.getBoundingClientRect()

    // 父技能「正下方中央」座標
    const px = parentRect.left + parentRect.width / 2 - containerRect.left
    const py = parentRect.bottom - containerRect.top

    // A. 一對一連線 (直向下連)
    if (children.length === 1) {
      const childNode = document.querySelector(`.node-icon-box[data-id="${children[0].id}"]`)
                        || document.getElementById(`node-${children[0].id}`)
      if (childNode) {
        const cRect = childNode.getBoundingClientRect()
        // 子技能「正上方中央」座標
        const cx = cRect.left + cRect.width / 2 - containerRect.left
        const cy = cRect.top - containerRect.top

        // 如果 X 軸幾乎重合，畫垂直直線；否則畫 ⚡ 折線
        if (Math.abs(px - cx) < 5) {
          createLine(svg, px, py, cx, cy)
        } else {
          const midY = py + (cy - py) / 2
          createPath(svg, `M ${px} ${py} V ${midY} H ${cx} V ${cy}`)
        }
      }
      return
    }

    // B. 一對多連線 (向下 T 型 / 樹狀分叉)
    let minCx = Infinity, maxCx = -Infinity
    let minCy = Infinity
    const childCoords = []

    children.forEach(child => {
      const cNode = document.querySelector(`.node-icon-box[data-id="${child.id}"]`)
                    || document.getElementById(`node-${child.id}`)
      if (cNode) {
        const cRect = cNode.getBoundingClientRect()
        const cx = cRect.left + cRect.width / 2 - containerRect.left // 頂部中央
        const cy = cRect.top - containerRect.top
        childCoords.push({ cx, cy })

        if (cx < minCx) minCx = cx
        if (cx > maxCx) maxCx = cx
        if (cy < minCy) minCy = cy
      }
    })

    if (childCoords.length === 0) return

    // 計算橫向幹線的 Y 軸位置 (位於父技能底部與子技能頂部的正中間)
    const midY = py + (minCy - py) / 2

    // 1. 父技能往下拉到中間高度
    let pathD = `M ${px} ${py} V ${midY}`
    // 2. 橫向橫跨最左子技能到最右子技能
    pathD += ` M ${minCx} ${midY} H ${maxCx}`
    // 3. 從橫向幹線往下接到各個子技能頂部
    childCoords.forEach(({ cx, cy }) => {
      pathD += ` M ${cx} ${midY} V ${cy}`
    })

    createPath(svg, pathD)
  })
}

// 輔助函式：創建 SVG Path
function createPath(svg, d) {
  const path = document.createElementNS('http://www.w3.org/2000/svg', 'path')
  path.setAttribute('d', d)
  path.setAttribute('stroke', '#d4af37') // 金色線條
  path.setAttribute('stroke-width', '2')
  path.setAttribute('fill', 'none')
  svg.appendChild(path)
}

// 輔助函式：創建直線
function createLine(svg, x1, y1, x2, y2) {
  const line = document.createElementNS('http://www.w3.org/2000/svg', 'line')
  line.setAttribute('x1', x1)
  line.setAttribute('y1', y1)
  line.setAttribute('x2', x2)
  line.setAttribute('y2', y2)
  line.setAttribute('stroke', '#d4af37')
  line.setAttribute('stroke-width', '2')
  svg.appendChild(line)
}

// 點數加減邏輯 (含跨職業自動前置補點)
function updatePoint(skillId, delta) {
  const skill = allSkills.find(s => s.id === skillId)
  if (!skill) return

  const currentLevel = allocatedPoints[skillId] || 0
  const maxLevel = skill.max_level || 10
  const newLevel = currentLevel + delta

  // 1. 退點限制
  if (newLevel < 0) return

  // 2. 單技能上限
  if (delta > 0 && newLevel > maxLevel) return

  // 3. 🔥 加點時的「自動前置補點」與「轉職門檻」檢查
  if (delta > 0) {
    const requiredAdds = {}

    // 遞迴收集所有未達標的前置技能 (可跨基礎/轉職)
    function collectPrereqs(targetSkillId) {
      const target = allSkills.find(s => s.id === targetSkillId)
      if (!target || !target.req_skill_id) return

      const parentId = target.req_skill_id
      const minReqLevel = target.req_skill_level || 1
      const currentParentLevel = (allocatedPoints[parentId] || 0) + (requiredAdds[parentId] || 0)

      if (currentParentLevel < minReqLevel) {
        const needed = minReqLevel - currentParentLevel
        requiredAdds[parentId] = (requiredAdds[parentId] || 0) + needed
      }

      collectPrereqs(parentId)
    }

    collectPrereqs(skillId)

    // 計算完成此技能與所有前置補點共需幾點
    let totalNeededPoints = delta
    Object.values(requiredAdds).forEach(pts => totalNeededPoints += pts)

    // A. 剩餘總點數檢查
    if (remainingPoints < totalNeededPoints) {
      alert(`點數不足！完成此技能及其前置需求共需要 ${totalNeededPoints} 點（目前剩餘 ${remainingPoints} 點）。`)
      return
    }

    // B. 🔥 檢查點擊的是否為轉職技能 (含轉職通用)
    const isAdvSkill = skill.job_id !== currentParentJobId

    if (isAdvSkill) {
      // 計算「基礎職業技能」在補完點後累積消耗了多少點
      let baseJobAllocated = 0
      allSkills.forEach(s => {
        if (s.job_id === currentParentJobId) {
          const currentPts = allocatedPoints[s.id] || 0
          const addPts = requiredAdds[s.id] || 0
          baseJobAllocated += (currentPts + addPts)
        }
      })

      // 基礎技能累積未滿 120 點，不給點轉職技能
      if (baseJobAllocated < 120) {
        alert(`無法點擊轉職技能！基礎職業技能累積需滿 120 點（補點後目前僅 ${baseJobAllocated}/120 點）。`)
        return
      }
    }

    // C. 執行自動補點
    for (const [reqId, pts] of Object.entries(requiredAdds)) {
      allocatedPoints[reqId] = (allocatedPoints[reqId] || 0) + pts
      remainingPoints -= pts
    }
  }

  // 4. 更新目標技能點數
  allocatedPoints[skillId] = newLevel
  remainingPoints -= delta

  // 5. 重新渲染
  renderTabTree()
}

function bindEvents() {
  // 1. 頁籤點擊事件[cite: 5]
  tabsContainer.addEventListener('click', e => {
    if (e.target.classList.contains('tab-btn')) {
      currentTab = e.target.dataset.type
      renderTabs()
      renderTabTree()
    }
  })

  // 2. 職業下拉選單改變[cite: 5]
  jobSelect.addEventListener('change', e => {
    currentJob = e.target.value
    allocatedPoints = {}
    remainingPoints = 200
    fetchSkills(currentJob)
  })

  // 3. 重置按鈕[cite: 5]
  resetBtn.addEventListener('click', () => {
    allocatedPoints = {}
    remainingPoints = 200
    renderTabTree()
  })

  // 4. 技能樹點擊 (+/-)[cite: 5]
  treeContainer.addEventListener('click', e => {
    const btn = e.target.closest('.btn-step')
    if (!btn || btn.classList.contains('disabled')) return
    
    const { action, id } = btn.dataset
    if (action === 'plus') updatePoint(id, 1)
    if (action === 'minus') updatePoint(id, -1)
  })

  // 5. Tooltip 滑鼠事件[cite: 5]
  treeContainer.addEventListener('mouseover', e => {
    const iconBox = e.target.closest('.node-icon-box')
    if (!iconBox) return

    const skill = allSkills.find(s => s.id === iconBox.dataset.id)
    if (!skill || !tooltip) return

    document.getElementById('ttName').innerText = skill.name
    document.getElementById('ttType').innerText = `${skill.skill_type || '技能'} (${skill.activation_type || '主動'})`
    document.getElementById('ttReq').innerText = skill.req_character_level ? `需求角色等級: Lv.${skill.req_character_level}` : ''
    document.getElementById('ttDesc').innerText = skill.description || '暫無說明'

    tooltip.classList.remove('hidden')
  })

  treeContainer.addEventListener('mousemove', e => {
    if (tooltip && !tooltip.classList.contains('hidden')) {
      tooltip.style.left = `${e.clientX + 15}px`
      tooltip.style.top = `${e.clientY + 15}px`
    }
  })

  treeContainer.addEventListener('mouseout', e => {
    if (e.target.closest('.node-icon-box') && tooltip) {
      tooltip.classList.add('hidden')
    }
  })

  // 🔥 6. 視窗縮放事件 (獨立放在最外層，只綁定一次！)
  window.addEventListener('resize', () => {
    requestAnimationFrame(drawLines)
  })
}

init()