import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm'
import { SUPABASE_URL, SUPABASE_KEY } from './supabase-config.js'

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

// 狀態管理
let allSkills = []
let allocatedPoints = {}
let remainingPoints = 120
let currentJob = 'valkyrie'

// DOM 快取
const jobSelect = document.getElementById('jobSelect')
const treeContainer = document.getElementById('treeContainer')
const remainingPointsEl = document.getElementById('remainingPoints')
const resetBtn = document.getElementById('resetBtn')

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
    // ✅ 改呼叫多欄式的渲染函式
    renderMultiColumnTree()
  }
}

// 渲染多欄式技能樹
function renderMultiColumnTree() {
  if (remainingPointsEl) remainingPointsEl.innerText = remainingPoints

  // 1. 依照 skill_type 分群 (武技、強化...)
  const groupedSkills = {}
  allSkills.forEach(skill => {
    const type = skill.skill_type || '通用'
    if (!groupedSkills[type]) groupedSkills[type] = []
    groupedSkills[type].push(skill)
  })

  const defaultIcon = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='54' height='54'><rect width='54' height='54' fill='%23ffd369'/><text x='50%' y='55%' dominant-baseline='middle' text-anchor='middle' font-size='12' font-weight='bold'>SKILL</text></svg>"

  // 2. 繪製每一欄
  treeContainer.innerHTML = Object.keys(groupedSkills).map(type => {
    const skillsInGroup = groupedSkills[type]

    // 依照 grid_y 或 ID 排序
    skillsInGroup.sort((a, b) => (a.grid_y || 0) - (b.grid_y || 0))

    return `
      <div class="skill-column">
        <div class="column-header">${type}</div>
        
        ${skillsInGroup.map(skill => {
          const level = allocatedPoints[skill.id] || 0
          
          // 前置條件檢查
          let isLocked = false
          if (skill.req_skill_id) {
            const reqLevel = allocatedPoints[skill.req_skill_id] || 0
            if (reqLevel < skill.req_skill_level) isLocked = true
          }

          return `
            <div class="skill-tree-node ${isLocked ? 'locked' : ''}">
              <!-- Icon 框，附帶 Hover Tooltip 訊息 -->
              <div class="node-icon-box" title="${skill.name}\n${skill.description || '暫無說明'}">
                <img src="${skill.icon_url || defaultIcon}" alt="${skill.name}">
              </div>
              
              <!-- 點數控制盒 (+ / - 按鈕) -->
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

// 加減點數邏輯
function updatePoint(skillId, delta) {
  const skill = allSkills.find(s => s.id === skillId)
  if (!skill) return

  const cur = allocatedPoints[skillId] || 0
  const next = cur + delta

  // 防呆：不能小於 0、不能超過上限、剩餘點數不足不能加點
  if (next < 0 || next > (skill.max_level || 10)) return
  if (delta > 0 && remainingPoints <= 0) return

  allocatedPoints[skillId] = next
  remainingPoints -= delta
  renderMultiColumnTree()
}

// 事件綁定
function bindEvents() {
  // 切換職業
  jobSelect.addEventListener('change', e => {
    currentJob = e.target.value
    allocatedPoints = {}
    remainingPoints = 120
    fetchSkills(currentJob)
  })

  // 重置按鈕
  resetBtn.addEventListener('click', () => {
    allocatedPoints = {}
    remainingPoints = 120
    renderMultiColumnTree()
  })

  // ✅ 修正：監聽新版的加減按鈕點擊 (+ / -)
  treeContainer.addEventListener('click', e => {
    const btn = e.target.closest('.btn-step')
    if (!btn) return

    const { action, id } = btn.dataset
    if (action === 'plus') {
      updatePoint(id, 1)
    } else if (action === 'minus') {
      updatePoint(id, -1)
    }
  })
}

init()