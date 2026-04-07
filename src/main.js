import * as THREE from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import { Line2 } from 'three/addons/lines/Line2.js'
import { LineGeometry } from 'three/addons/lines/LineGeometry.js'
import { LineMaterial } from 'three/addons/lines/LineMaterial.js'

// === Constants ===
const BALL_RADIUS = 1.125
const POCKET_RADIUS = 2.25

// === Scene Setup ===
const scene = new THREE.Scene()
scene.background = new THREE.Color(0x1a1a2e)

const camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 500)
const renderer = new THREE.WebGLRenderer({ antialias: true })
renderer.setSize(window.innerWidth, window.innerHeight)
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
renderer.shadowMap.enabled = true
renderer.shadowMap.type = THREE.PCFSoftShadowMap
document.body.appendChild(renderer.domElement)

// === Table dimensions (declared early for lighting) ===
const tableWidth = 30
const tableLength = 40

// === Lighting ===
scene.add(new THREE.AmbientLight(0xffffff, 1.2))

// Main overhead pool hall lamp
const mainLight = new THREE.SpotLight(0xffe4b5, 15, 80, Math.PI / 3, 0.5, 1.0)
mainLight.position.set(0, 14, -5)
mainLight.target.position.set(0, 0, -5)
mainLight.castShadow = true
scene.add(mainLight)
scene.add(mainLight.target)

// Second spot from the other side
const secondSpot = new THREE.SpotLight(0xfff0d0, 10, 60, Math.PI / 4, 0.5, 1.0)
secondSpot.position.set(-5, 12, 5)
secondSpot.target.position.set(3, 0, -8)
scene.add(secondSpot)
scene.add(secondSpot.target)

// Rim light near the pocket
const rimLight = new THREE.PointLight(0xffd080, 0.5, 30)
rimLight.position.set(tableWidth / 2 - 1, 3, -tableLength / 2 + 1)
scene.add(rimLight)

// === Table Surface ===
const table = new THREE.Mesh(
  new THREE.PlaneGeometry(tableWidth, tableLength),
  new THREE.MeshStandardMaterial({ color: 0x0d6b3d })
)
table.rotation.x = -Math.PI / 2
table.receiveShadow = true
scene.add(table)

// === Cushions ===
const cushionHeight = 1.5
const cushionDepth = 1.5
const cushionMat = new THREE.MeshStandardMaterial({ color: 0x0a5c2f })

const sideCushion = new THREE.Mesh(new THREE.BoxGeometry(tableWidth, cushionHeight, cushionDepth), cushionMat)
sideCushion.position.set(0, cushionHeight / 2, -tableLength / 2)
scene.add(sideCushion)

const endCushion = new THREE.Mesh(new THREE.BoxGeometry(cushionDepth, cushionHeight, tableLength), cushionMat)
endCushion.position.set(tableWidth / 2, cushionHeight / 2, 0)
scene.add(endCushion)

// === Pocket ===
const pocketMesh = new THREE.Mesh(
  new THREE.CircleGeometry(POCKET_RADIUS, 32),
  new THREE.MeshBasicMaterial({ color: 0x111111 })
)
pocketMesh.rotation.x = -Math.PI / 2
pocketMesh.position.set(tableWidth / 2 - 1, 0.01, -tableLength / 2 + 1)
scene.add(pocketMesh)

// === Fixed positions ===
const objBallDistFromPocket = 12
const pocketPos = new THREE.Vector3(tableWidth / 2 - 1, BALL_RADIUS, -tableLength / 2 + 1)
const pocketToTableDir = new THREE.Vector3(-1, 0, 1).normalize()
const objectBallPos = pocketPos.clone().add(pocketToTableDir.clone().multiplyScalar(objBallDistFromPocket))
const pocketToObj = objectBallPos.clone().sub(pocketPos).normalize()
const ghostBallPos = objectBallPos.clone().add(pocketToObj.clone().multiplyScalar(BALL_RADIUS * 2))
const objToPocket = pocketPos.clone().sub(objectBallPos).normalize()

// === Object Ball (fixed) ===
const objectBall = new THREE.Mesh(
  new THREE.SphereGeometry(BALL_RADIUS, 32, 32),
  new THREE.MeshStandardMaterial({ color: 0xf5c518, roughness: 0.3, metalness: 0.1 })
)
objectBall.position.copy(objectBallPos)
objectBall.castShadow = true
scene.add(objectBall)

// === Ghost Ball (fixed) ===
const ghostBall = new THREE.Mesh(
  new THREE.SphereGeometry(BALL_RADIUS, 32, 32),
  new THREE.MeshPhysicalMaterial({
    color: 0xffffff,
    transparent: true,
    opacity: 0.15,
    roughness: 0.05,
    metalness: 0.0,
    clearcoat: 1.0,
    clearcoatRoughness: 0.1,
    ior: 1.5,
    thickness: 2,
    transmission: 0.6,
    depthWrite: false,
  })
)
ghostBall.position.copy(ghostBallPos)
scene.add(ghostBall)

const ghostWire = new THREE.Mesh(
  new THREE.SphereGeometry(BALL_RADIUS * 1.005, 16, 16),
  new THREE.MeshBasicMaterial({ color: 0xffffff, wireframe: true, transparent: true, opacity: 0.14 })
)
ghostWire.position.copy(ghostBallPos)
scene.add(ghostWire)

// === Cue Ball (moves with angle) ===
const cueBall = new THREE.Mesh(
  new THREE.SphereGeometry(BALL_RADIUS, 32, 32),
  new THREE.MeshStandardMaterial({ color: 0xf0f0f0, roughness: 0.2, metalness: 0.05 })
)
cueBall.castShadow = true
scene.add(cueBall)

// === Line height (table vs mid-air) ===
let lineHeight = BALL_RADIUS - Math.sqrt(BALL_RADIUS * BALL_RADIUS - (BALL_RADIUS * 25 / 50) ** 2) // base by default

// === Pocket Line (fixed - object ball to pocket) ===
const pocketLineGeo = new THREE.BufferGeometry().setFromPoints([
  new THREE.Vector3(objectBallPos.x + objToPocket.x * -40, BALL_RADIUS, objectBallPos.z + objToPocket.z * -40),
  new THREE.Vector3(objectBallPos.x + objToPocket.x * 40, BALL_RADIUS, objectBallPos.z + objToPocket.z * 40),
])
const pocketLine = new THREE.Line(pocketLineGeo, new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.35 }))
scene.add(pocketLine)

// === Reference Line (fixed - parallel to pocket line, offset left) ===
const perpDir = new THREE.Vector3().crossVectors(objToPocket, new THREE.Vector3(0, 1, 0)).normalize()
// We'll compute the sign once based on a default angle and keep it consistent
// "Left side" means opposite side from where cue ball approaches
let currentSign = 1 // will be set in setCutAngle

const refLineMat = new LineMaterial({ color: 0xff4444, linewidth: 3, transparent: true, opacity: 0.5, resolution: new THREE.Vector2(window.innerWidth, window.innerHeight) })
const refLineGeo = new LineGeometry()
refLineGeo.setPositions([0, 0, 0, 1, 0, 0]) // placeholder
const refLine = new Line2(refLineGeo, refLineMat)
scene.add(refLine)

// === Reference Spot ===
const refSpot = new THREE.Mesh(
  new THREE.SphereGeometry(0.075, 16, 16),
  new THREE.MeshBasicMaterial({ color: 0x4488ff })
)
refSpot.visible = false
scene.add(refSpot)

// === Ghost Ref Spot ===
const ghostRefSpot = new THREE.Mesh(
  new THREE.SphereGeometry(0.075, 16, 16),
  new THREE.MeshBasicMaterial({ color: 0x4488ff })
)
ghostRefSpot.visible = false
scene.add(ghostRefSpot)

// === Controls ===
const controls = new OrbitControls(camera, renderer.domElement)
controls.enableDamping = true
controls.dampingFactor = 0.08
controls.minDistance = 3
controls.maxDistance = 60
controls.maxPolarAngle = Math.PI / 2 - 0.05

// === Current state ===
let currentAngle = 30
const cueBallDist = 15
const defaultCamPos = new THREE.Vector3()
const defaultTarget = ghostBallPos.clone()
let refLinePercent = 25

function setCutAngle(deg, { resetCamera = true } = {}) {
  currentAngle = deg
  const cutAngleRad = (deg * Math.PI) / 180

  // Cue ball position
  const cueApproachDir = pocketToObj.clone()
  cueApproachDir.applyAxisAngle(new THREE.Vector3(0, 1, 0), cutAngleRad)
  const cueBallPos = ghostBallPos.clone().add(cueApproachDir.clone().multiplyScalar(cueBallDist))
  cueBall.position.copy(cueBallPos)

  // Reference line sign: opposite side of cue ball
  const objToCue = cueBallPos.clone().sub(objectBallPos).normalize()
  currentSign = perpDir.dot(objToCue) > 0 ? -1 : 1
  const refOffset = perpDir.clone().multiplyScalar(currentSign * BALL_RADIUS * refLinePercent / 50)

  // Update reference line geometry
  const rStart = objectBallPos.clone().add(refOffset).add(objToPocket.clone().multiplyScalar(-40))
  const rEnd = objectBallPos.clone().add(refOffset).add(objToPocket.clone().multiplyScalar(40))
  refLineGeo.setPositions([rStart.x, lineHeight, rStart.z, rEnd.x, lineHeight, rEnd.z])

  // Update reference spot
  const refOffsetDist = BALL_RADIUS * refLinePercent / 50
  const chordHalf = Math.sqrt(BALL_RADIUS * BALL_RADIUS - refOffsetDist * refOffsetDist)
  const refSpotPos = objectBallPos.clone()
    .add(perpDir.clone().multiplyScalar(currentSign * refOffsetDist))
    .add(pocketToObj.clone().multiplyScalar(chordHalf))
  refSpotPos.y = BALL_RADIUS
  refSpot.position.copy(refSpotPos)

  // Update ghost ref spot
  const ghostRefSpotPos = ghostBallPos.clone()
    .add(perpDir.clone().multiplyScalar(currentSign * refOffsetDist))
    .add(pocketToObj.clone().multiplyScalar(chordHalf))
  ghostRefSpotPos.y = BALL_RADIUS
  ghostRefSpot.position.copy(ghostRefSpotPos)

  // Update camera default position
  defaultCamPos.copy(cueBallPos.clone().add(cueApproachDir.clone().multiplyScalar(8)))
  defaultCamPos.y = 5

  // Reset camera to shot line view
  if (resetCamera) {
    camera.position.copy(defaultCamPos)
    controls.target.copy(defaultTarget)
    controls.update()
  }
}

// Initialize
setCutAngle(30)

// === UI Button Styles ===
const btnStyle = {
  padding: '12px 20px',
  fontSize: '16px',
  background: 'rgba(255,255,255,0.15)',
  color: '#fff',
  border: '1px solid rgba(255,255,255,0.3)',
  borderRadius: '8px',
  backdropFilter: 'blur(8px)',
  cursor: 'pointer',
  zIndex: '100',
  touchAction: 'manipulation',
}

// === Cut Angle Selector ===
const angles = [10, 30, 45, 75]
const angleContainer = document.createElement('div')
Object.assign(angleContainer.style, {
  position: 'fixed',
  top: '20px',
  left: '50%',
  transform: 'translateX(-50%)',
  display: 'flex',
  gap: '6px',
  zIndex: '100',
})
document.body.appendChild(angleContainer)

const angleBtns = angles.map(deg => {
  const btn = document.createElement('button')
  btn.textContent = `${deg}\u00B0`
  Object.assign(btn.style, {
    ...btnStyle,
    padding: '10px 16px',
    fontSize: '15px',
  })
  btn.addEventListener('click', () => {
    setCutAngle(deg)
    updateAngleBtnStyles()
  })
  angleContainer.appendChild(btn)
  return { btn, deg }
})

function updateAngleBtnStyles() {
  angleBtns.forEach(({ btn, deg }) => {
    if (deg === currentAngle) {
      btn.style.background = 'rgba(255,255,255,0.4)'
      btn.style.borderColor = '#fff'
    } else {
      btn.style.background = 'rgba(255,255,255,0.15)'
      btn.style.borderColor = 'rgba(255,255,255,0.3)'
    }
  })
}
updateAngleBtnStyles()

// === Ghost Ball Toggle (cycles: Wire -> Solid -> OFF) ===
const ghostModes = ['Wire', 'Solid', 'OFF']
let ghostModeIndex = 1

const ghostBallBtn = document.createElement('button')
ghostBallBtn.textContent = 'Ghost: Solid'
Object.assign(ghostBallBtn.style, {
  ...btnStyle,
  position: 'fixed',
  bottom: '370px',
  right: '20px',
})
document.body.appendChild(ghostBallBtn)

function applyGhostMode() {
  const mode = ghostModes[ghostModeIndex]
  if (mode === 'Wire') {
    ghostBall.visible = false
    ghostWire.visible = true
    ghostBallBtn.style.opacity = '1'
  } else if (mode === 'Solid') {
    ghostBall.visible = true
    ghostWire.visible = false
    ghostBallBtn.style.opacity = '1'
  } else {
    ghostBall.visible = false
    ghostWire.visible = false
    ghostBallBtn.style.opacity = '0.5'
  }
  ghostBallBtn.textContent = `Ghost: ${mode}`
}
applyGhostMode()

ghostBallBtn.addEventListener('click', () => {
  ghostModeIndex = (ghostModeIndex + 1) % ghostModes.length
  applyGhostMode()
})

// === Ghost Ref Spot Toggle ===
const ghostRefSpotBtn = document.createElement('button')
ghostRefSpotBtn.textContent = 'Ghost Spot: OFF'
ghostRefSpotBtn.style.opacity = '0.5'
Object.assign(ghostRefSpotBtn.style, {
  ...btnStyle,
  position: 'fixed',
  bottom: '320px',
  right: '20px',
})
document.body.appendChild(ghostRefSpotBtn)

ghostRefSpotBtn.addEventListener('click', () => {
  ghostRefSpot.visible = !ghostRefSpot.visible
  ghostRefSpotBtn.textContent = `Ghost Spot: ${ghostRefSpot.visible ? 'ON' : 'OFF'}`
  ghostRefSpotBtn.style.opacity = ghostRefSpot.visible ? '1' : '0.5'
})

// === Reference Spot Toggle ===
const refSpotBtn = document.createElement('button')
refSpotBtn.textContent = 'Ref Spot: OFF'
refSpotBtn.style.opacity = '0.5'
Object.assign(refSpotBtn.style, {
  ...btnStyle,
  position: 'fixed',
  bottom: '270px',
  right: '20px',
})
document.body.appendChild(refSpotBtn)

refSpotBtn.addEventListener('click', () => {
  refSpot.visible = !refSpot.visible
  refSpotBtn.textContent = `Ref Spot: ${refSpot.visible ? 'ON' : 'OFF'}`
  refSpotBtn.style.opacity = refSpot.visible ? '1' : '0.5'
})

// === Reference Line Toggle ===
const refLineBtn = document.createElement('button')
refLineBtn.textContent = 'Ref Line: ON'
Object.assign(refLineBtn.style, {
  ...btnStyle,
  position: 'fixed',
  bottom: '220px',
  right: '20px',
})
document.body.appendChild(refLineBtn)

refLineBtn.addEventListener('click', () => {
  refLine.visible = !refLine.visible
  refLineBtn.textContent = `Ref Line: ${refLine.visible ? 'ON' : 'OFF'}`
  refLineBtn.style.opacity = refLine.visible ? '1' : '0.5'
  refSliderWrap.style.display = refLine.visible ? 'flex' : 'none'
})

// === Reference Line Offset Slider ===
const refSliderWrap = document.createElement('div')
Object.assign(refSliderWrap.style, {
  position: 'fixed',
  bottom: '170px',
  right: '20px',
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  zIndex: '100',
})
document.body.appendChild(refSliderWrap)

const refSlider = document.createElement('input')
refSlider.type = 'range'
refSlider.min = '0'
refSlider.max = '50'
refSlider.value = '25'
Object.assign(refSlider.style, {
  width: '100px',
  accentColor: '#ff4444',
  touchAction: 'manipulation',
})
refSliderWrap.appendChild(refSlider)

const refSliderLabel = document.createElement('span')
refSliderLabel.textContent = '25%'
Object.assign(refSliderLabel.style, {
  color: '#fff',
  fontSize: '14px',
  minWidth: '36px',
})
refSliderWrap.appendChild(refSliderLabel)

refSlider.addEventListener('input', () => {
  refLinePercent = Number(refSlider.value)
  refSliderLabel.textContent = `${refLinePercent}%`
  if (lineHeightModes[lineHeightIndex] === 'Base') {
    lineHeight = getLineHeight('Base')
    updatePocketLineHeight()
  }
  setCutAngle(currentAngle, { resetCamera: false })
})

// === Pocket Line Toggle ===
const pocketLineBtn = document.createElement('button')
pocketLineBtn.textContent = 'Pocket Line: ON'
Object.assign(pocketLineBtn.style, {
  ...btnStyle,
  position: 'fixed',
  bottom: '120px',
  right: '20px',
})
document.body.appendChild(pocketLineBtn)

pocketLineBtn.addEventListener('click', () => {
  pocketLine.visible = !pocketLine.visible
  pocketLineBtn.textContent = `Pocket Line: ${pocketLine.visible ? 'ON' : 'OFF'}`
  pocketLineBtn.style.opacity = pocketLine.visible ? '1' : '0.5'
})

// === Line Height Toggle ===
const lineHeightBtn = document.createElement('button')
lineHeightBtn.textContent = 'Lines: Base'
Object.assign(lineHeightBtn.style, {
  ...btnStyle,
  position: 'fixed',
  bottom: '70px',
  right: '20px',
})
document.body.appendChild(lineHeightBtn)

function updatePocketLineHeight() {
  pocketLineGeo.setFromPoints([
    new THREE.Vector3(objectBallPos.x + objToPocket.x * -40, lineHeight, objectBallPos.z + objToPocket.z * -40),
    new THREE.Vector3(objectBallPos.x + objToPocket.x * 40, lineHeight, objectBallPos.z + objToPocket.z * 40),
  ])
}

const lineHeightModes = ['Mid-Air', 'Base', 'Table']
let lineHeightIndex = 1

function getLineHeight(mode) {
  if (mode === 'Mid-Air') return BALL_RADIUS
  if (mode === 'Table') return 0.02
  // Base: bottom of ball at current offset
  const offsetDist = BALL_RADIUS * refLinePercent / 50
  return BALL_RADIUS - Math.sqrt(BALL_RADIUS * BALL_RADIUS - offsetDist * offsetDist)
}

lineHeightBtn.addEventListener('click', () => {
  lineHeightIndex = (lineHeightIndex + 1) % lineHeightModes.length
  lineHeight = getLineHeight(lineHeightModes[lineHeightIndex])
  lineHeightBtn.textContent = `Lines: ${lineHeightModes[lineHeightIndex]}`
  updatePocketLineHeight()
  setCutAngle(currentAngle, { resetCamera: false })
})

// === Reset Button ===
const resetBtn = document.createElement('button')
resetBtn.textContent = 'Reset View'
Object.assign(resetBtn.style, {
  ...btnStyle,
  position: 'fixed',
  bottom: '20px',
  right: '20px',
})
document.body.appendChild(resetBtn)

resetBtn.addEventListener('click', () => {
  const startPos = camera.position.clone()
  const startTarget = controls.target.clone()
  const duration = 400
  const startTime = performance.now()

  function animateReset(now) {
    const t = Math.min((now - startTime) / duration, 1)
    const ease = t * (2 - t)
    camera.position.lerpVectors(startPos, defaultCamPos, ease)
    controls.target.lerpVectors(startTarget, defaultTarget, ease)
    controls.update()
    if (t < 1) requestAnimationFrame(animateReset)
  }
  requestAnimationFrame(animateReset)
})

// === Render Loop ===
function animate() {
  requestAnimationFrame(animate)
  controls.update()
  renderer.render(scene, camera)
}
animate()

// === Resize ===
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight
  camera.updateProjectionMatrix()
  renderer.setSize(window.innerWidth, window.innerHeight)
  refLineMat.resolution.set(window.innerWidth, window.innerHeight)
})
