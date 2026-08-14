import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm'
import { SUPABASE_URL, SUPABASE_KEY } from './supabase-config.js'

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

// 狀態管理
let allSkills = []
let allocatedPoints = {}
let remainingPoints = 120
let currentJob = '' 
let currentTab = ''

// DOM 快取
const tabsContainer = document.getElementById('tabsContainer')
const jobSelect = document.getElementById('jobSelect')
const treeContainer = document.getElementById('treeContainer')
const remainingPointsEl = document.getElementById('remainingPoints')
const resetBtn = document.getElementById('resetBtn')
const tooltip = document.getElementById('tooltip')

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
    
    // 動態拼出對應的進階共用 ID (例如 sorcerer_adv_common)
    const commonJobId = `${parentJobId}_adv_common`
    
    // 撈取：[基礎職, 當前轉職, 對應的進階共用]
    targetJobIds = [parentJobId, jobId, commonJobId]
  } else {
    // 基礎職 (job_tier === 1，例如 sorcerer)：只撈取自己！
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

// 3. 渲染頂部頁籤
function renderTabs() {
  // 取得當前技能池裡所有的 skill_type
  const types = [...new Set(allSkills.map(s => s.skill_type || '通用'))]
  
  // 如果原本選的頁籤不在目前職業的 types 裡，預設切換到第一個頁籤
  if (!types.includes(currentTab)) {
    currentTab = types[0] || ''
  }

  tabsContainer.innerHTML = types.map(type => `
    <button class="tab-btn ${type === currentTab ? 'active' : ''}" data-type="${type}">
      ${type}
    </button>
  `).join('')
}

// 渲染技能樹 (含 SVG 自動動態連線)
function renderTabTree() {
  if (remainingPointsEl) remainingPointsEl.innerText = remainingPoints

  // 1. 當前頁籤技能
  const activeSkills = allSkills.filter(s => (s.skill_type || '通用') === currentTab)
  const defaultIcon = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='54' height='54'><rect width='54' height='54' fill='%23ffd369'/><text x='50%' y='55%' dominant-baseline='middle' text-anchor='middle' font-size='12' font-weight='bold'>SKILL</text></svg>"

  // 2. 計算網格中的座標像素 (基於格子寬 80、高 85、gap-x 50、gap-y 20)
  const getPos = (x, y) => {
    const colWidth = 80 + 50 // 格子寬 + gapX
    const rowHeight = 85 + 20 // 格子高 + gapY
    return {
      // 算出每格圖示正中央的 X 軸像素
      cx: (x - 1) * colWidth + 40 + 20, // 20 為 padding-left
      // 圖示頂部與底部的 Y 軸像素
      topY: (y - 1) * rowHeight + 20, 
      bottomY: (y - 1) * rowHeight + 56 + 20 // 56 為圖示高度
    }
  }

  // 3. 自動計算並產生 SVG 連線 Path
  let svgPaths = ''
  activeSkills.forEach(skill => {
    if (!skill.req_skill_id) return

    // 找到前置技能
    const parent = activeSkills.find(s => s.id === skill.req_skill_id)
    if (!parent) return

    const pX = parent.grid_x ?? parent.x ?? 1
    const pY = parent.grid_y ?? parent.y ?? 1
    const cX = skill.grid_x ?? skill.x ?? 1
    const cY = skill.grid_y ?? skill.y ?? 1

    const start = getPos(pX, pY)
    const end = getPos(cX, cY)

    // 同一欄 (直線向下，不論跨了幾格都會自動拉長)
    if (pX === cX) {
      svgPaths += `<path d="M ${start.cx} ${start.bottomY} L ${end.cx} ${end.topY}" stroke="#8a6d4b" stroke-width="2" fill="none" />`
    } else {
      // 跨欄/分歧 (折線：先垂直向下、再水平折向目標欄、再垂直接進目標頂部)
      const midY = start.bottomY + 12 // 拐角轉折處的高度
      svgPaths += `<path d="M ${start.cx} ${start.bottomY} V ${midY} H ${end.cx} V ${end.topY}" stroke="#8a6d4b" stroke-width="2" fill="none" />`
    }
  })

  // 4. 渲染 HTML (包含 SVG 背景層與技能網格)
  treeContainer.innerHTML = `
    <div class="skill-tree-wrapper" style="position: relative;">
      
      <!-- 動態畫線 SVG 層 -->
      <svg class="tree-svg-layer" style="position: absolute; top:0; left:0; width:100%; height:100%; pointer-events:none; z-index:1;">
        ${svgPaths}
      </svg>

      <!-- 技能網格層 -->
      <div class="skill-tree-grid" style="position: relative; z-index: 2;">
        ${activeSkills.map(skill => {
          const level = allocatedPoints[skill.id] || 0
          const maxLevel = skill.max_level || 10
          
          let isLocked = false
          if (skill.req_skill_id) {
            const reqLevel = allocatedPoints[skill.req_skill_id] || 0
            if (reqLevel < skill.req_skill_level) isLocked = true
          }

          const x = skill.grid_x ?? skill.x ?? 1
          const y = skill.grid_y ?? skill.y ?? 1

          return `
            <div class="grid-skill-node ${isLocked ? 'locked' : ''}" 
                 style="grid-column: ${x}; grid-row: ${y};">
              
              <div class="node-icon-box" data-id="${skill.id}">
                <img src="${skill.icon_url || defaultIcon}" alt="${skill.name}">
              </div>

              <div class="node-status-line">
                <button class="btn-step btn-minus ${level <= 0 ? 'disabled' : ''}" 
                        data-action="minus" data-id="${skill.id}">-</button>
                        
                <span class="level-text">${level}/${maxLevel}</span>

                <button class="btn-step btn-add ${level >= maxLevel || remainingPoints <= 0 || isLocked ? 'disabled' : ''}" 
                        data-action="plus" data-id="${skill.id}">+</button>
              </div>
              
            </div>
          `
        }).join('')}
      </div>
    </div>
  `
}

function updatePoint(skillId, delta) {
  const skill = allSkills.find(s => s.id === skillId)
  if (!skill) return

  const cur = allocatedPoints[skillId] || 0
  const next = cur + delta

  if (next < 0 || next > (skill.max_level || 10)) return
  if (delta > 0 && remainingPoints <= 0) return

  allocatedPoints[skillId] = next
  remainingPoints -= delta
  renderTabTree()
}

function bindEvents() {
  tabsContainer.addEventListener('click', e => {
    if (e.target.classList.contains('tab-btn')) {
      currentTab = e.target.dataset.type
      renderTabs()
      renderTabTree()
    }
  })

  jobSelect.addEventListener('change', e => {
    currentJob = e.target.value
    allocatedPoints = {}
    remainingPoints = 120
    fetchSkills(currentJob)
  })

  resetBtn.addEventListener('click', () => {
    allocatedPoints = {}
    remainingPoints = 120
    renderTabTree()
  })

  // 點擊事件處理
  treeContainer.addEventListener('click', e => {
    const btn = e.target.closest('.btn-step')
    if (!btn || btn.classList.contains('disabled')) return // 避開被禁用的按鈕
    
    const { action, id } = btn.dataset
    if (action === 'plus') updatePoint(id, 1)
    if (action === 'minus') updatePoint(id, -1)
  })

  // Tooltip 滑鼠事件
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
}

init()