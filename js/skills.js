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

// 渲染經典天外風格技能樹
function renderTabTree() {
  if (remainingPointsEl) remainingPointsEl.innerText = remainingPoints

  // 1. 過濾當前頁籤技能
  const activeSkills = allSkills.filter(s => (s.skill_type || '通用') === currentTab)

  const defaultIcon = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='54' height='54'><rect width='54' height='54' fill='%23ffd369'/><text x='50%' y='55%' dominant-baseline='middle' text-anchor='middle' font-size='12' font-weight='bold'>SKILL</text></svg>"

  // 2. 直接繪製大網格容器
  treeContainer.innerHTML = `
    <div class="skill-tree-grid">
      ${activeSkills.map(skill => {
        const level = allocatedPoints[skill.id] || 0
        const maxLevel = skill.max_level || 10
        
        // 前置技能判定
        let isLocked = false
        if (skill.req_skill_id) {
          const reqLevel = allocatedPoints[skill.req_skill_id] || 0
          if (reqLevel < skill.req_skill_level) isLocked = true
        }

        const x = skill.grid_x || 1
        const y = skill.grid_y || 1

        // 判斷是否為分歧點 (例如破碎擊 Y=2, X=1 分歧出 刀技修鍊 Y=3, X=2)
        const isBranchRight = (x === 2 && y === 3) 

        return `
          <div class="grid-skill-node ${isLocked ? 'locked' : ''} ${isBranchRight ? 'branch-from-left' : ''}" 
               style="grid-column: ${x}; grid-row: ${y};">
            
            <!-- 技能圖示 -->
            <div class="node-icon-box" data-id="${skill.id}">
              <img src="${skill.icon_url || defaultIcon}" alt="${skill.name}">
            </div>

            <!-- 等級與加點按鈕 UI (比照原圖風格) -->
            <div class="node-status-line">
              <span class="level-text">${level}/${maxLevel}</span>
              <button class="btn-add ${level >= maxLevel || remainingPoints <= 0 || isLocked ? 'disabled' : ''}" 
                      data-action="plus" data-id="${skill.id}">+</button>
            </div>
            
          </div>
        `
      }).join('')}
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

  treeContainer.addEventListener('click', e => {
    const btn = e.target.closest('.btn-step')
    if (!btn) return
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