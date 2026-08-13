import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm'
import { SUPABASE_URL, SUPABASE_KEY } from './supabase-config.js'

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

// ------------------------------------
// 全域狀態管理 (State)
// ------------------------------------
let allSkills = []           // 當前頁面的技能清單
let jobMap = {}              // 職業對照表
let allocatedPoints = {}     // 點數分配配額，例：{ sk_sw_01: 5 }
let remainingPoints = 120    // 剩餘點數
let currentJob = 'valkyrie'  // 預設二轉職業

// DOM 元素快取
const jobSelectEl = document.getElementById('jobSelect')
const skillsContainerEl = document.getElementById('skillsContainer')
const remainingPointsEl = document.getElementById('remainingPoints')
const resetBtnEl = document.getElementById('resetBtn')

// ------------------------------------
// 初始化程序
// ------------------------------------
async function init() {
  await fetchJobs()
  await fetchSkills(currentJob)
  bindEvents()
}

// ------------------------------------
// 資料撈取邏輯 (Supabase)
// ------------------------------------
// 1. 撈取職業
async function fetchJobs() {
  const { data, error } = await supabase.from('job_classes').select('*')
  if (error) return console.error('無法取得職業資料:', error)

  // 整理成 Map 方便查詢父職業
  data.forEach(job => { jobMap[job.id] = job })

  // 渲染二轉職業選單
  const secondTierJobs = data.filter(job => job.job_tier === 2)
  jobSelectEl.innerHTML = secondTierJobs
    .map(job => `<option value="${job.id}">${job.name}</option>`)
    .join('')

  if (secondTierJobs.length > 0) {
    currentJob = secondTierJobs[0].id
  }
}

// 2. 撈取指定職業對應的所有技能（一轉 + 二轉 + 二轉共通）
async function fetchSkills(jobId) {
  const selectedJob = jobMap[jobId]
  if (!selectedJob) return

  const parentJobId = selectedJob.parent_id
  const commonJobId = `${parentJobId}_adv_common` // 對應方案 A 的二轉共通 ID 命名慣例

  // 向 Supabase 查詢 3 個職業 ID 的技能
  const { data, error } = await supabase
    .from('skills')
    .select('*')
    .in('job_id', [parentJobId, jobId, commonJobId])

  if (error) return console.error('無法取得技能資料:', error)

  allSkills = data
  renderSkills()
}

// ------------------------------------
// 點數與邏輯運算
// ------------------------------------
function updateSkillPoint(skillId, delta) {
  const skill = allSkills.find(s => s.id === skillId)
  if (!skill) return

  const currentLevel = allocatedPoints[skillId] || 0
  const newLevel = currentLevel + delta

  // 防呆 1：範圍限制
  if (newLevel < 0 || newLevel > skill.max_level) return

  // 防呆 2：點數不夠
  if (delta > 0 && remainingPoints <= 0) return

  // 防呆 3：前置技能檢查
  if (delta > 0 && skill.req_skill_id) {
    const reqLevel = allocatedPoints[skill.req_skill_id] || 0
    if (reqLevel < skill.req_skill_level) {
      const reqSkill = allSkills.find(s => s.id === skill.req_skill_id)
      const reqName = reqSkill ? reqSkill.name : skill.req_skill_id
      alert(`前置技能未達標！【${reqName}】需要達到 Lv.${skill.req_skill_level}`)
      return
    }
  }

  // 更新 State
  allocatedPoints[skillId] = newLevel
  remainingPoints -= delta

  renderSkills()
}

function resetPoints() {
  allocatedPoints = {}
  remainingPoints = 120
  renderSkills()
}

// ------------------------------------
// UI 畫面渲染 (Render)
// ------------------------------------
function renderSkills() {
  remainingPointsEl.innerText = remainingPoints

  skillsContainerEl.innerHTML = allSkills.map(skill => {
    const level = allocatedPoints[skill.id] || 0

    // 判斷前置條件是否滿足
    let isLocked = false
    if (skill.req_skill_id) {
      const reqLevel = allocatedPoints[skill.req_skill_id] || 0
      if (reqLevel < skill.req_skill_level) isLocked = true
    }

    return `
      <div class="skill-card ${isLocked ? 'locked' : ''} ${level > 0 ? 'available' : ''}">
        <div>
          <div class="skill-title">
            <span>${skill.name}</span>
            <span class="level-display">${level} / ${skill.max_level}</span>
          </div>
          <div class="skill-type">${skill.skill_type} | ${skill.activation_type || '主動'}</div>
          <div class="skill-desc">${skill.description || '暫無說明'}</div>
        </div>
        
        <div class="skill-controls">
          <button class="btn btn-point" data-action="minus" data-id="${skill.id}">-</button>
          <span style="font-size: 0.8rem; color: var(--text-muted)">
            ${skill.req_character_level ? '角色需求 Lv.' + skill.req_character_level : ''}
          </span>
          <button class="btn btn-point" data-action="plus" data-id="${skill.id}" ${isLocked ? 'disabled' : ''}>+</button>
        </div>
      </div>
    `
  }).join('')
}

// ------------------------------------
// 事件監聽 (Event Delegation)
// ------------------------------------
function bindEvents() {
  // 切換職業
  jobSelectEl.addEventListener('change', (e) => {
    currentJob = e.target.value
    resetPoints()
    fetchSkills(currentJob)
  })

  // 重置按鈕
  resetBtnEl.addEventListener('click', resetPoints)

  // 技能 +/- 按鈕 (使用代理監聽)
  skillsContainerEl.addEventListener('click', (e) => {
    const btn = e.target.closest('.btn-point')
    if (!btn) return

    const { action, id } = btn.dataset
    if (action === 'plus') updateSkillPoint(id, 1)
    if (action === 'minus') updateSkillPoint(id, -1)
  })
}

// 啟動應用程式
init()