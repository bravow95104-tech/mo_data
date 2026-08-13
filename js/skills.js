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

// 1. 撈取所有職業 (確保基礎職與轉職後職都有放入下拉選單)
async function fetchJobs() {
  const { data } = await supabase
    .from('job_classes')
    .select('*')
    .order('job_tier', { ascending: true })

  if (!data || data.length === 0) return

  // 整理選單：分組顯示或直接依階級排列
  jobSelect.innerHTML = data
    .map(j => `<option value="${j.id}">${j.job_tier === 1 ? '[基礎] ' : '[轉職] '}${j.name}</option>`)
    .join('')

  // 預設選取第一個職業
  currentJob = data[0].id
  jobSelect.value = currentJob
}

// 2. 撈取技能 (嚴格區分轉職前與轉職後)
async function fetchSkills(jobId) {
  if (!jobId) return

  // 撈取當前選擇職業的 job_tier 與 parent_id
  const { data: jobData } = await supabase
    .from('job_classes')
    .select('*')
    .eq('id', jobId)
    .single()

  if (!jobData) return

  let targetJobIds = []

  // 判斷是否為進階職 (job_tier === 2)
  if (jobData.job_tier === 2) {
    // 轉職後：基礎職 + 進階職 + 進階共用
    const parentJobId = jobData.parent_id || 'swordsman'
    const commonJobId = `${parentJobId}_adv_common`
    targetJobIds = [parentJobId, jobId, commonJobId]
  } else {
    // 轉職前 (基礎職)：僅包含基礎職自己，絕對不含 common
    targetJobIds = [jobId]
  }

  // 查詢資料庫
  const { data } = await supabase
    .from('skills')
    .select('*')
    .in('job_id', targetJobIds)

  if (data) {
    allSkills = data
    // 重新撈取技能時，把 currentTab 重置，避免吃到上個職業的頁籤名稱
    currentTab = ''
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

// 4. 渲染當前頁籤的垂直技能樹
function renderTabTree() {
  if (remainingPointsEl) remainingPointsEl.innerText = remainingPoints

  // 過濾出當前頁籤的技能，並依 grid_y 由小到大排序
  const activeSkills = allSkills
    .filter(s => (s.skill_type || '通用') === currentTab)
    .sort((a, b) => (a.grid_y || 0) - (b.grid_y || 0))

  const defaultIcon = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='54' height='54'><rect width='54' height='54' fill='%23ffd369'/><text x='50%' y='55%' dominant-baseline='middle' text-anchor='middle' font-size='12' font-weight='bold'>SKILL</text></svg>"

  treeContainer.innerHTML = `
    <div class="skill-single-column">
      ${activeSkills.map(skill => {
        const level = allocatedPoints[skill.id] || 0
        
        let isLocked = false
        if (skill.req_skill_id) {
          const reqLevel = allocatedPoints[skill.req_skill_id] || 0
          if (reqLevel < skill.req_skill_level) isLocked = true
        }

        return `
          <div class="skill-tree-node ${isLocked ? 'locked' : ''}">
            <div class="node-icon-box" data-id="${skill.id}">
              <img src="${skill.icon_url || defaultIcon}" alt="${skill.name}">
            </div>
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