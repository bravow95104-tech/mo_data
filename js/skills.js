import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm'
import { SUPABASE_URL, SUPABASE_KEY } from './supabase-config.js'

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

// 狀態管理
let allSkills = []
let allocatedPoints = {}
let remainingPoints = 120
let currentJob = 'valkyrie'
let currentTab = '' // 當前選擇的技能頁籤 (skill_type)

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

// 撈取職業
async function fetchJobs() {
  const { data } = await supabase.from('job_classes').select('*')
  if (!data) return

  const secondTierJobs = data.filter(j => j.job_tier === 2)
  jobSelect.innerHTML = secondTierJobs
    .map(j => `<option value="${j.id}">${j.name}</option>`)
    .join('')

  if (secondTierJobs.length > 0) currentJob = secondTierJobs[0].id
}

// 撈取技能
async function fetchSkills(jobId) {
  const { data: jobData } = await supabase.from('job_classes').select('*').eq('id', jobId).single()
  const parentJobId = jobData ? jobData.parent_id : 'swordsman'
  const commonJobId = `${parentJobId}_adv_common`

  const { data } = await supabase
    .from('skills')
    .select('*')
    .in('job_id', [parentJobId, jobId, commonJobId])

  if (data) {
    allSkills = data
    renderTabs()
    renderTree()
  }
}

// 渲染頂部頁籤
function renderTabs() {
  // 提取不重複的 skill_type
  const types = [...new Set(allSkills.map(s => s.skill_type))]
  if (types.length > 0 && !types.includes(currentTab)) {
    currentTab = types[0]
  }

  tabsContainer.innerHTML = types.map(type => `
    <button class="tab-btn ${type === currentTab ? 'active' : ''}" data-type="${type}">
      ${type}
    </button>
  `).join('')
}

// 渲染技能樹
function renderTree() {
  remainingPointsEl.innerText = remainingPoints

  // 過濾出目前頁籤的技能
  const activeSkills = allSkills.filter(s => s.skill_type === currentTab)

  treeContainer.innerHTML = activeSkills.map(skill => {
    const level = allocatedPoints[skill.id] || 0

    // 檢查前置條件
    let isLocked = false
    if (skill.req_skill_id) {
      const reqLevel = allocatedPoints[skill.req_skill_id] || 0
      if (reqLevel < skill.req_skill_level) isLocked = true
    }

    // 座標預設：如果 Supabase 沒填 grid_x/y，自動按順序排版
    const x = skill.grid_x || 1
    const y = skill.grid_y || 1
    const iconSrc = skill.icon_url || 'https://via.placeholder.com/56/ffd369/000000?text=Skill'

    return `
      <div class="skill-node ${isLocked ? 'locked' : ''}" style="--x: ${x}; --y: ${y};">
        <div class="icon-box" data-id="${skill.id}">
          <img src="${iconSrc}" alt="${skill.name}">
        </div>
        <div class="level-badge">${level}/${skill.max_level}</div>
        
        ${!isLocked && remainingPoints > 0 && level < skill.max_level ? `
          <button class="btn-add" data-id="${skill.id}">+</button>
        ` : ''}
      </div>
    `
  }).join('')
}

// 加減點數
function updatePoint(skillId, delta) {
  const skill = allSkills.find(s => s.id === skillId)
  if (!skill) return

  const cur = allocatedPoints[skillId] || 0
  const next = cur + delta

  if (next < 0 || next > skill.max_level) return
  if (delta > 0 && remainingPoints <= 0) return

  allocatedPoints[skillId] = next
  remainingPoints -= delta
  renderTree()
}

// 事件綁定
function bindEvents() {
  // 切換頁籤
  tabsContainer.addEventListener('click', e => {
    if (e.target.classList.contains('tab-btn')) {
      currentTab = e.target.dataset.type
      renderTabs()
      renderTree()
    }
  })

  // 切換職業
  jobSelect.addEventListener('change', e => {
    currentJob = e.target.value
    allocatedPoints = {}
    remainingPoints = 120
    fetchSkills(currentJob)
  })

  // 重置
  resetBtn.addEventListener('click', () => {
    allocatedPoints = {}
    remainingPoints = 120
    renderTree()
  })

  // 左鍵加點（點擊加號按鈕）與 右鍵退點（點擊 Icon 框）
  treeContainer.addEventListener('click', e => {
    if (e.target.classList.contains('btn-add')) {
      updatePoint(e.target.dataset.id, 1)
    }
  })

  treeContainer.addEventListener('contextmenu', e => {
    e.preventDefault() // 阻擋預設右鍵選單
    const iconBox = e.target.closest('.icon-box')
    if (iconBox) {
      updatePoint(iconBox.dataset.id, -1)
    }
  })

  // Hover Tooltip 浮動說明
  treeContainer.addEventListener('mouseover', e => {
    const iconBox = e.target.closest('.icon-box')
    if (!iconBox) return

    const skill = allSkills.find(s => s.id === iconBox.dataset.id)
    if (!skill) return

    document.getElementById('ttName').innerText = skill.name
    document.getElementById('ttType').innerText = `${skill.skill_type} (${skill.activation_type || '主動'})`
    document.getElementById('ttReq').innerText = skill.req_character_level ? `需求角色等級: Lv.${skill.req_character_level}` : ''
    document.getElementById('ttDesc').innerText = skill.description || '暫無說明'

    tooltip.classList.remove('hidden')
  })

  treeContainer.addEventListener('mousemove', e => {
    tooltip.style.left = `${e.clientX + 15}px`
    tooltip.style.top = `${e.clientY + 15}px`
  })

  treeContainer.addEventListener('mouseout', e => {
    if (e.target.closest('.icon-box')) {
      tooltip.classList.add('hidden')
    }
  })
}

// 渲染多欄式技能樹
function renderMultiColumnTree() {
  const container = document.getElementById('treeContainer')
  
  // 1. 依照 skill_type 分群 (例如: { "武技": [...], "強化": [...] })
  const groupedSkills = {}
  allSkills.forEach(skill => {
    const type = skill.skill_type || '通用'
    if (!groupedSkills[type]) groupedSkills[type] = []
    groupedSkills[type].push(skill)
  })

  // 2. 繪製每一欄
  container.innerHTML = Object.keys(groupedSkills).map(type => {
    const skillsInGroup = groupedSkills[type]

    // 依照 grid_y 或預設順序排序
    skillsInGroup.sort((a, b) => (a.grid_y || 0) - (b.grid_y || 0))

    return `
      <div class="skill-column">
        <div class="column-header">${type}</div>
        
        ${skillsInGroup.map(skill => {
          const level = allocatedPoints[skill.id] || 0
          
          // 前置鎖定判斷
          let isLocked = false
          if (skill.req_skill_id) {
            const reqLevel = allocatedPoints[skill.req_skill_id] || 0
            if (reqLevel < skill.req_skill_level) isLocked = true
          }

          const defaultIcon = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='54' height='54'><rect width='54' height='54' fill='%23ffd369'/><text x='50%' y='55%' dominant-baseline='middle' text-anchor='middle' font-size='12' font-weight='bold'>SKILL</text></svg>"

          return `
            <div class="skill-tree-node ${isLocked ? 'locked' : ''}">
              <!-- Icon -->
              <div class="node-icon-box" title="${skill.name}\n${skill.description || ''}">
                <img src="${skill.icon_url || defaultIcon}" alt="${skill.name}">
              </div>
              
              <!-- 點數控制列 (+ / - 按鈕與數字) -->
              <div class="node-control-box">
                <button class="btn-step" data-action="minus" data-id="${skill.id}">-</button>
                <div class="node-level-num">${level}</div>
                <button class="btn-step" data-action="plus" data-id="${skill.id}">+</button>
              </div>
            </div>
          `
        }).join('')}
      </div>
    `
  }).join('')
}

init()