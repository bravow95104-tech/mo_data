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
const tooltip = document.getElementById('tooltip') // ✅ 補上 Tooltip DOM

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
    renderMultiColumnTree()
  }
}

// 渲染多欄式技能樹
function renderMultiColumnTree() {
  if (remainingPointsEl) remainingPointsEl.innerText = remainingPoints

  const groupedSkills = {}
  allSkills.forEach(skill => {
    const type = skill.skill_type || '通用'
    if (!groupedSkills[type]) groupedSkills[type] = []
    groupedSkills[type].push(skill)
  })

  const defaultIcon = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='54' height='54'><rect width='54' height='54' fill='%23ffd369'/><text x='50%' y='55%' dominant-baseline='middle' text-anchor='middle' font-size='12' font-weight='bold'>SKILL</text></svg>"

  treeContainer.innerHTML = Object.keys(groupedSkills).map(type => {
    const skillsInGroup = groupedSkills[type]
    skillsInGroup.sort((a, b) => (a.grid_y || 0) - (b.grid_y || 0))

    return `
      <div class="skill-column">
        <div class="column-header">${type}</div>
        
        ${skillsInGroup.map(skill => {
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
  }).join('')
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
  renderMultiColumnTree()
}

function bindEvents() {
  jobSelect.addEventListener('change', e => {
    currentJob = e.target.value
    allocatedPoints = {}
    remainingPoints = 120
    fetchSkills(currentJob)
  })

  resetBtn.addEventListener('click', () => {
    allocatedPoints = {}
    remainingPoints = 120
    renderMultiColumnTree()
  })

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

  // ✅ 補上 Tooltip 浮動說明監聽
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