import * as THREE from 'three';
import { OrbitControls } from 'https://cdn.jsdelivr.net/npm/three@0.164.1/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'https://cdn.jsdelivr.net/npm/three@0.164.1/examples/jsm/loaders/GLTFLoader.js';

const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
let frozen = reduced;
const GOLD = 0xd6a15d;
const SAND = 0xc78955;
const CLAY = 0x8d5038;
const WATER = 0x6f9c91;
const NIGHT = 0x1b130f;

function setupRenderer(renderer, exposure = 1.12) {
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.8));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = exposure;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
}

function stoneTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 256;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#a66d49';
  ctx.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 1800; i++) {
    const x = Math.random() * 256;
    const y = Math.random() * 256;
    const v = 80 + Math.random() * 100;
    ctx.fillStyle = `rgba(${v + 35},${v},${v - 18},${0.03 + Math.random() * 0.11})`;
    ctx.fillRect(x, y, 1 + Math.random() * 3, 1 + Math.random() * 2);
  }
  ctx.strokeStyle = 'rgba(66,37,25,.18)';
  ctx.lineWidth = 1;
  for (let i = 0; i < 28; i++) {
    ctx.beginPath();
    ctx.moveTo(Math.random() * 256, Math.random() * 256);
    ctx.lineTo(Math.random() * 256, Math.random() * 256);
    ctx.stroke();
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(2, 2);
  return texture;
}

function glowTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 128;
  const ctx = canvas.getContext('2d');
  const gradient = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
  gradient.addColorStop(0, 'rgba(255,220,151,.9)');
  gradient.addColorStop(.18, 'rgba(214,161,93,.38)');
  gradient.addColorStop(1, 'rgba(214,161,93,0)');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 128, 128);
  return new THREE.CanvasTexture(canvas);
}

function addDust(scene, count, spread, color = 0xd6a15d, size = .035) {
  const positions = new Float32Array(count * 3);
  const sizes = new Float32Array(count);
  for (let i = 0; i < count; i++) {
    positions[i * 3] = (Math.random() - .5) * spread.x;
    positions[i * 3 + 1] = Math.random() * spread.y + spread.y * .08;
    positions[i * 3 + 2] = (Math.random() - .5) * spread.z - 2;
    sizes[i] = size * (.4 + Math.random() * 1.8);
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('size', new THREE.Float32BufferAttribute(sizes, 1));
  const material = new THREE.PointsMaterial({ color, size, transparent: true, opacity: .48, depthWrite: false, blending: THREE.AdditiveBlending });
  const points = new THREE.Points(geometry, material);
  scene.add(points);
  return points;
}

function steppedPyramid(parent, material, levels = 6, base = 1.55, step = .2) {
  const group = new THREE.Group();
  for (let i = 0; i < levels; i++) {
    const width = base - i * step;
    const height = .22;
    const mesh = new THREE.Mesh(new THREE.CylinderGeometry(width * .42, width * .5, height, 4, 1), material);
    mesh.rotation.y = Math.PI / 4;
    mesh.position.y = i * height + height / 2;
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    group.add(mesh);
    const edge = new THREE.LineSegments(new THREE.EdgesGeometry(mesh.geometry), new THREE.LineBasicMaterial({ color: GOLD, transparent: true, opacity: .16 }));
    edge.rotation.copy(mesh.rotation); edge.position.copy(mesh.position); group.add(edge);
  }
  const cap = new THREE.Mesh(new THREE.ConeGeometry(base * .2, .48, 4), material);
  cap.position.y = levels * .22 + .18;
  cap.rotation.y = Math.PI / 4;
  cap.castShadow = true;
  group.add(cap);
  group.position.y = -.95;
  parent.add(group);
  return group;
}

function addArch(parent, material, scale = 1) {
  const arch = new THREE.Group();
  const left = new THREE.Mesh(new THREE.BoxGeometry(.18 * scale, 1.65 * scale, .22 * scale), material);
  const right = left.clone();
  left.position.x = -.48 * scale;
  right.position.x = .48 * scale;
  [left, right].forEach(mesh => { mesh.castShadow = true; arch.add(mesh); });
  const curve = new THREE.Mesh(new THREE.TorusGeometry(.48 * scale, .09 * scale, 12, 48, Math.PI), material);
  curve.rotation.z = Math.PI;
  curve.position.y = .82 * scale;
  curve.castShadow = true;
  arch.add(curve);
  parent.add(arch);
  return arch;
}

function sceneHero() {
  const host = document.getElementById('hero3d');
  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog(NIGHT, 7, 23);
  const camera = new THREE.PerspectiveCamera(42, innerWidth / innerHeight, .1, 80);
  camera.position.set(0, 1.5, 8.8);
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
  setupRenderer(renderer, 1.2);
  renderer.setSize(innerWidth, innerHeight);
  host.appendChild(renderer.domElement);

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = .045;
  controls.enablePan = false;
  controls.enableZoom = false;
  controls.minPolarAngle = 1.05;
  controls.maxPolarAngle = 2.12;
  controls.target.set(0, .45, 0);

  scene.add(new THREE.HemisphereLight(0xffdcb0, 0x24140f, 2.1));
  const sun = new THREE.DirectionalLight(0xffc982, 5.2);
  sun.position.set(-4, 7, 5);
  sun.castShadow = true;
  sun.shadow.mapSize.set(1024, 1024);
  sun.shadow.camera.left = -8; sun.shadow.camera.right = 8; sun.shadow.camera.top = 8; sun.shadow.camera.bottom = -6;
  scene.add(sun);
  const moon = new THREE.DirectionalLight(0x7ea79a, 1.45);
  moon.position.set(5, 3, -4);
  scene.add(moon);
  const ember = new THREE.PointLight(GOLD, 12, 11, 2);
  ember.position.set(0, 2.6, 1.8);
  scene.add(ember);

  const texture = stoneTexture();
  const sandstone = new THREE.MeshPhysicalMaterial({ map: texture, color: SAND, roughness: .82, metalness: .04, clearcoat: .08, clearcoatRoughness: .8 });
  const clay = new THREE.MeshPhysicalMaterial({ map: texture, color: CLAY, roughness: .92, metalness: 0, sheen: .18, sheenColor: 0x9b5b40 });
  const darkStone = new THREE.MeshStandardMaterial({ map: texture, color: 0x4b3427, roughness: .9, metalness: .08 });
  const brass = new THREE.MeshPhysicalMaterial({ color: GOLD, roughness: .3, metalness: .62, clearcoat: .28, clearcoatRoughness: .34 });

  const world = new THREE.Group();
  scene.add(world);
  const monument = new THREE.Group();
  world.add(monument);
  steppedPyramid(monument, sandstone, 7, 2.0, .22);
  enhancePyramid(monument, sandstone, brass, clay);
  const crown = new THREE.Mesh(new THREE.ConeGeometry(.33, .72, 4), brass);
  crown.position.y = .82;
  crown.rotation.y = Math.PI / 4;
  crown.castShadow = true;
  monument.add(crown);
  const arch = addArch(monument, clay, 1.05);
  arch.position.set(0, -.43, .92);
  const inner = addArch(monument, darkStone, .56);
  inner.position.set(0, -.36, 1.045);
  const ring = new THREE.Mesh(new THREE.TorusGeometry(1.88, .028, 10, 160), brass);
  ring.rotation.x = Math.PI / 2;
  ring.position.y = .18;
  ring.material.transparent = true;
  ring.material.opacity = .76;
  monument.add(ring);
  const ring2 = ring.clone();
  ring2.scale.set(.72, .72, .72);
  ring2.position.y = .64;
  ring2.material = new THREE.MeshBasicMaterial({ color: WATER, transparent: true, opacity: .5 });
  monument.add(ring2);
  const sanctuaryLoader = new GLTFLoader();
  sanctuaryLoader.load('/assets/nubia-sanctuary.gltf', gltf => {
    const sanctuary = gltf.scene;
    sanctuary.scale.setScalar(.62);
    sanctuary.position.set(0, .02, -.72);
    sanctuary.rotation.y = Math.PI / 4;
    sanctuary.traverse(node => { if (node.isMesh) { node.castShadow = true; node.receiveShadow = true; } });
    world.add(sanctuary);
  }, undefined, error => console.warn('Nubia Sanctuary GLTF fallback:', error));

  for (let i = 0; i < 5; i++) {
    const distant = new THREE.Mesh(new THREE.ConeGeometry(.33 + Math.random() * .18, .95 + Math.random() * .6, 4), clay);
    distant.position.set(-3.8 + i * 1.9, -.96, -2.8 - Math.random() * 1.6);
    distant.rotation.y = Math.PI / 4;
    distant.castShadow = true;
    world.add(distant);
  }

  const terrain = new THREE.Mesh(new THREE.PlaneGeometry(24, 18), new THREE.MeshStandardMaterial({ map: texture, color: 0x51372a, roughness: 1 }));
  terrain.rotation.x = -Math.PI / 2;
  terrain.position.y = -1.1;
  terrain.position.z = -2.3;
  terrain.receiveShadow = true;
  scene.add(terrain);

  const waterGeometry = new THREE.PlaneGeometry(22, 7, 120, 32);
  const waterMaterial = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    uniforms: { uTime: { value: 0 } },
    vertexShader: `uniform float uTime; varying float vWave; void main(){ vec3 p=position; float wave=sin(p.x*1.25+uTime*0.65)*0.05+sin(p.x*3.6-uTime*.42)*0.018; p.z+=wave; vWave=wave; gl_Position=projectionMatrix*modelViewMatrix*vec4(p,1.0); }`,
    fragmentShader: `varying float vWave; void main(){ float a=.22+abs(vWave)*2.1; gl_FragColor=vec4(.30,.56,.53,a); }`
  });
  const water = new THREE.Mesh(waterGeometry, waterMaterial);
  water.rotation.x = -Math.PI / 2;
  water.position.set(0, -1.0, -.55);
  scene.add(water);
  for (let i = 0; i < 4; i++) {
    const line = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([new THREE.Vector3(-10, -1.0 + i * .008, -.4 + i * .16), new THREE.Vector3(-3, -1.01 + i * .008, -.52 + i * .18), new THREE.Vector3(3, -1.0 + i * .008, -.35 + i * .16), new THREE.Vector3(10, -1.0 + i * .008, -.52 + i * .14)]), 80, .012 + i * .004, 5, false), new THREE.MeshBasicMaterial({ color: i % 2 ? GOLD : WATER, transparent: true, opacity: .22 - i * .025 }));
    scene.add(line);
  }

  const halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTexture(), color: GOLD, transparent: true, opacity: .42, depthWrite: false, blending: THREE.AdditiveBlending }));
  halo.scale.set(5.5, 5.5, 1);
  halo.position.set(0, 2.5, -2.6);
  scene.add(halo);
  const dust = addDust(scene, 1200, { x: 18, y: 8, z: 16 }, GOLD, .026);
  const nearDust = addDust(scene, 220, { x: 9, y: 4, z: 8 }, 0xf3dfb8, .045);

  const clock = new THREE.Clock();
  function loop(t) {
    const elapsed = clock.getElapsedTime();
    if (!frozen) {
      world.rotation.y = Math.sin(elapsed * .14) * .045;
      monument.position.y = Math.sin(elapsed * .7) * .045;
      if (monument.userData.detail) monument.userData.detail.rotation.y = -elapsed * .22;
      ring.rotation.z = elapsed * .18;
      ring2.rotation.z = -elapsed * .26;
      waterMaterial.uniforms.uTime.value = elapsed;
      dust.rotation.y = elapsed * .012;
      nearDust.rotation.y = -elapsed * .022;
      halo.material.opacity = .34 + Math.sin(elapsed * .8) * .05;
      controls.update();
      renderer.render(scene, camera);
    }
    requestAnimationFrame(loop);
  }
  loop(0);
  addEventListener('resize', () => { camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix(); renderer.setSize(innerWidth, innerHeight); });
  return () => { frozen = !frozen; };
}

const toggle = sceneHero();
document.getElementById('motion').onclick = () => { toggle(); document.getElementById('motion').textContent = frozen ? '▶' : '◌'; };

function sceneArtifact() {
  const canvas = document.getElementById('artifact');
  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog(0x241812, 4, 13);
  const camera = new THREE.PerspectiveCamera(34, 1, .1, 60);
  camera.position.set(0, 1.55, 5.4);
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
  setupRenderer(renderer, 1.08);
  const fit = () => { const box = canvas.getBoundingClientRect(); renderer.setSize(box.width, box.height, false); camera.aspect = box.width / box.height; camera.updateProjectionMatrix(); };
  fit();
  addEventListener('resize', fit);
  const controls = new OrbitControls(camera, canvas);
  controls.enableDamping = true;
  controls.dampingFactor = .06;
  controls.enablePan = false;
  controls.minDistance = 3.2;
  controls.maxDistance = 7;
  controls.target.set(0, .45, 0);
  scene.add(new THREE.HemisphereLight(0xffe1ba, 0x28140e, 2.5));
  const key = new THREE.SpotLight(0xffc77c, 42, 14, Math.PI / 5, .42, 1.5);
  key.position.set(3.6, 5.2, 4.4); key.castShadow = true; key.shadow.mapSize.set(1024, 1024); scene.add(key);
  const fill = new THREE.PointLight(WATER, 11, 8, 2); fill.position.set(-3, 1.5, -2); scene.add(fill);
  const texture = stoneTexture();
  const material = new THREE.MeshPhysicalMaterial({ map: texture, color: 0xb4764d, roughness: .78, metalness: .06, clearcoat: .12, clearcoatRoughness: .7 });
  const dark = new THREE.MeshStandardMaterial({ color: 0x37231a, roughness: .91, metalness: .05 });
  const accent = new THREE.MeshPhysicalMaterial({ color: GOLD, roughness: .28, metalness: .7, clearcoat: .3 });
  const spectral = new THREE.Group();
  const spectralMat = new THREE.MeshBasicMaterial({ color: 0xf6d49a, transparent: true, opacity: .42, wireframe: true, blending: THREE.AdditiveBlending });
  const spectralShell = new THREE.Mesh(new THREE.ConeGeometry(1.24, 2.52, 4, 1, true), spectralMat);
  spectralShell.position.y = .08; spectralShell.rotation.y = Math.PI / 4; spectral.add(spectralShell);
  for (let i = 0; i < 4; i++) { const orbit = new THREE.Mesh(new THREE.TorusGeometry(1.18 - i * .18, .012, 8, 96), new THREE.MeshBasicMaterial({ color: i % 2 ? WATER : GOLD, transparent: true, opacity: .7, blending: THREE.AdditiveBlending })); orbit.rotation.set(Math.PI / 2 + i * .18, i * .3, i * .45); orbit.position.y = -.55 + i * .44; spectral.add(orbit); }
  spectral.visible = true; scene.add(spectral);
  const sculpture = new THREE.Group();
  scene.add(sculpture);
  steppedPyramid(sculpture, material, 8, 1.65, .16);
  const doorGroup = new THREE.Group();
  const shape = new THREE.Shape();
  shape.moveTo(-.46, -.64); shape.lineTo(-.46, .3); shape.quadraticCurveTo(-.46, .9, 0, 1.02); shape.quadraticCurveTo(.46, .9, .46, .3); shape.lineTo(.46, -.64); shape.closePath();
  const doorGeo = new THREE.ExtrudeGeometry(shape, { depth: .12, bevelEnabled: true, bevelSize: .025, bevelThickness: .025, bevelSegments: 2 });
  const door = new THREE.Mesh(doorGeo, dark);
  door.position.set(0, -.62, .86);
  door.scale.set(.72, .72, .72);
  door.rotation.y = Math.PI;
  doorGroup.add(door);
  for (let i = 0; i < 3; i++) {
    const line = new THREE.Mesh(new THREE.BoxGeometry(.028, .75, .018), accent);
    line.position.set(-.22 + i * .22, -.31, .94);
    doorGroup.add(line);
  }
  sculpture.add(doorGroup);
  for (let i = 0; i < 3; i++) {
    const band = new THREE.Mesh(new THREE.TorusGeometry(.95 - i * .2, .018, 8, 96), i === 1 ? accent : material);
    band.rotation.x = Math.PI / 2;
    band.position.y = -.78 + i * .29;
    sculpture.add(band);
  }
  const base = new THREE.Mesh(new THREE.CylinderGeometry(1.45, 1.6, .12, 64), dark);
  base.position.y = -1.02; base.receiveShadow = true; sculpture.add(base);
  const innerGlow = new THREE.PointLight(GOLD, 2.5, 2.2, 2); innerGlow.position.set(0, .15, .9); sculpture.add(innerGlow);
  window.nubiaArtifactFocus = layer => {
    const n = Number(layer) || 0;
    spectral.scale.setScalar(1 + n * .018);
    spectral.rotation.z = n * .12;
    sculpture.rotation.z = -n * .018;
    innerGlow.intensity = 2.5 + n * .35;
  };
  const artifactLoader = new GLTFLoader();
  artifactLoader.load('/assets/nubia-sanctuary.gltf', gltf => {
    const sanctuary = gltf.scene;
    sanctuary.scale.setScalar(.34);
    sanctuary.position.set(0, -.18, 0);
    sanctuary.rotation.y = Math.PI / 4;
    sanctuary.traverse(node => { if (node.isMesh) { node.castShadow = true; node.receiveShadow = true; } });
    sanctuary.traverse(node => { if (node.isMesh && node.material) { node.material = node.material.clone(); node.material.emissive = new THREE.Color(0x5e3828); node.material.emissiveIntensity = .16; } });
    scene.add(sanctuary);
    spectral.visible = true;
  }, undefined, error => console.warn('Artifact GLTF fallback:', error));
  const dust = addDust(scene, 180, { x: 5, y: 3.5, z: 5 }, GOLD, .028);
  const clock = new THREE.Clock();
  function tick() {
    const elapsed = clock.getElapsedTime();
    if (!reduced) { sculpture.rotation.y = elapsed * .16; spectral.rotation.y = -elapsed * .12; spectral.rotation.x = Math.sin(elapsed * .35) * .04; spectral.children.forEach((child, i) => { if (i > 0) child.rotation.z += .003 * (i % 2 ? -1 : 1); }); }
    dust.rotation.y = elapsed * .05;
    controls.update();
    renderer.render(scene, camera);
    requestAnimationFrame(tick);
  }
  tick();
}
sceneArtifact();

const eras = [
  ['3800–2400 ق.م.', 'البدايات النيلية', 'زراعة، رعي، تبادل، وفنون سبقت ظهور الممالك.'],
  ['2400–1500 ق.م.', 'كرمة', 'مملكة كبرى، تجارة واسعة، وعمارة طينية مميزة.'],
  ['1550–1070 ق.م.', 'عصر الدولة الحديثة', 'تداخل سياسي واقتصادي وديني مع مصر القديمة.'],
  ['850–593 ق.م.', 'نبتة وكوش', 'صعود كوش حول جبل البركل وتحولها إلى قوة إقليمية.'],
  ['744–656 ق.م.', 'الأسرة الخامسة والعشرون', 'فصل مشترك من تاريخ وادي النيل يقوده ملوك كوش.'],
  ['300 ق.م.–350 م.', 'مروي', 'حديد، تجارة، أهرام، وتطور الكتابة المروية.'],
  ['350–1500 م.', 'الممالك المسيحية', 'نوباتيا ومقُرّة وعلوة تحافظ على تقاليد نوبية قوية.'],
  ['القرن 16–اليوم', 'الذاكرة الحديثة', 'لغة، قرية، تهجير، وإعادة بناء للهوية بعد السد العالي.']
];
document.getElementById('eras').innerHTML = eras.map((era, i) => `<article class="era-card glass"><small>${era[0]}</small><h3>${era[1]}</h3><p>${era[2]}</p><button>افتح الطبقة ${String(i + 1).padStart(2, '0')} ↗</button></article>`).join('');

const canvas = document.getElementById('stars');
const ctx = canvas.getContext('2d');
const nodeNames = ['أسوان / الشلال الأول','فيلة','أبو سمبل','بوهين','أمادا','الدبيرة / Toshka / أنيبة','قُسطل وبلّانة وأدندان','وادي حلفا','كرمة','جبل البركل / نبتة','الكرو ونوري','دنقلا القديمة','فَرَس','مروي','ناقا','موسورات الصفراء','سجل القرى النوبية الحديثة','قرى إعادة التوطين بعد السد العالي'];
const nodes = Array.from({ length: 29 }, (_, i) => ({ x: Math.random(), y: Math.random(), r: 2 + Math.random() * 3, phase: Math.random() * Math.PI * 2, name: nodeNames[i] || `عقدة ذاكرة قيد التوثيق ${String(i + 1).padStart(2, '0')}` }));
function drawStars(time = 0) {
  const dpr = Math.min(devicePixelRatio, 2);
  canvas.width = canvas.clientWidth * dpr; canvas.height = canvas.clientHeight * dpr;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, canvas.clientWidth, canvas.clientHeight);
  ctx.lineWidth = 1; ctx.strokeStyle = '#76a69a22';
  nodes.forEach((node, i) => { const next = nodes[(i + 1) % nodes.length]; ctx.beginPath(); ctx.moveTo(node.x * canvas.clientWidth, node.y * canvas.clientHeight); ctx.lineTo(next.x * canvas.clientWidth, next.y * canvas.clientHeight); ctx.stroke(); });
  nodes.forEach((node, i) => { const pulse = reduced ? 0 : Math.sin(time * .002 + node.phase) * .8; ctx.beginPath(); ctx.arc(node.x * canvas.clientWidth, node.y * canvas.clientHeight, node.r + pulse, 0, Math.PI * 2); ctx.fillStyle = i === 0 ? '#d6a15d' : '#76a69a'; ctx.shadowBlur = 18; ctx.shadowColor = ctx.fillStyle; ctx.fill(); });
  ctx.shadowBlur = 0;
  if (!reduced) requestAnimationFrame(drawStars);
}
drawStars();
addEventListener('resize', () => drawStars());
const index = document.getElementById('node-index');
nodes.forEach((node, i) => { const button = document.createElement('button'); button.innerHTML = `<span>${String(i + 1).padStart(2, '0')}</span><small>${escapeHtml(node.name)}</small>`; button.title = node.name; button.setAttribute('aria-label', node.name); button.className = i === 0 ? 'active' : ''; button.onclick = () => { document.querySelectorAll('.node-index button').forEach(item => item.classList.remove('active')); button.classList.add('active'); document.getElementById('node-title').textContent = node.name; document.getElementById('node-copy').textContent = `${node.name} — عقدة في شبكة الذاكرة. تُعرض الحالة كما هي: موقع موثق أو سجل يحتاج إلى مصدر محلي وشهادة يراجعها المجتمع.`; }; index.appendChild(button); });

const observer = new IntersectionObserver(entries => entries.forEach(entry => entry.isIntersecting && entry.target.classList.add('in')), { threshold: .08 });
document.querySelectorAll('.reveal').forEach(item => observer.observe(item));

const messages = document.getElementById('messages');
const form = document.getElementById('form');
const question = document.getElementById('question');
form.onsubmit = async event => { event.preventDefault(); const value = question.value.trim(); if (!value) return; question.value = ''; add(value, 'user'); const pending = add('أفكك السؤال إلى طبقات تاريخية…', 'bot'); try { const response = await fetch('/api/nvidia/chat', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ message: value, context: 'Nubian cultural heritage. Separate evidence from oral history. Answer Arabic.' }) }); if (!response.ok) throw Error(); const data = await response.json(); pending.remove(); add(data.answer || data.message || 'لا توجد إجابة.', 'bot'); } catch { pending.remove(); add('تعذر الوصول إلى طبقة الذكاء الآن. جرّب السؤال مرة أخرى بعد لحظات.', 'bot'); } };
function add(text, type) { const bubble = document.createElement('div'); bubble.className = `bubble ${type}`; bubble.textContent = text; messages.appendChild(bubble); messages.scrollTop = messages.scrollHeight; return bubble; }
document.getElementById('clear').onclick = () => { messages.innerHTML = ''; add('جلسة جديدة. اسأل عن كرمة، كوش، مروي، أو اللغة النوبية.', 'bot'); };

// Site-wide cinematic interaction layer
const progress = document.createElement('div');
progress.className = 'scroll-progress';
document.body.appendChild(progress);
const aura = document.createElement('div');
aura.className = 'cursor-aura';
document.body.appendChild(aura);
const topbar = document.querySelector('.top');
const heroContent = document.querySelector('.hero-content');
let rafScroll = false;
function updateScrollSystem() {
  const max = Math.max(1, document.documentElement.scrollHeight - innerHeight);
  const ratio = scrollY / max;
  progress.style.width = `${ratio * 100}%`;
  topbar.classList.toggle('scrolled', scrollY > 34);
  if (heroContent && !reduced && scrollY < innerHeight) heroContent.style.setProperty('--hero-shift', `${scrollY * .08}px`);
  rafScroll = false;
}
addEventListener('scroll', () => { if (!rafScroll) { rafScroll = true; requestAnimationFrame(updateScrollSystem); } }, { passive: true });
updateScrollSystem();

if (!reduced && matchMedia('(pointer:fine)').matches) {
  addEventListener('pointermove', event => { aura.style.left = `${event.clientX}px`; aura.style.top = `${event.clientY}px`; aura.style.opacity = '.9'; });
  addEventListener('pointerleave', () => { aura.style.opacity = '0'; });
  document.querySelectorAll('.era-card').forEach(card => {
    card.addEventListener('pointermove', event => {
      const rect = card.getBoundingClientRect();
      const x = (event.clientX - rect.left) / rect.width - .5;
      const y = (event.clientY - rect.top) / rect.height - .5;
      card.style.setProperty('--rx', `${-y * 4}deg`);
      card.style.setProperty('--ry', `${x * 5}deg`);
    });
    card.addEventListener('pointerleave', () => { card.style.setProperty('--rx', '0deg'); card.style.setProperty('--ry', '0deg'); });
  });
}

const sectionLinks = [...document.querySelectorAll('.nav a[href^="#"]')];
const sections = sectionLinks.map(link => document.querySelector(link.getAttribute('href'))).filter(Boolean);
const activeObserver = new IntersectionObserver(entries => entries.forEach(entry => {
  if (!entry.isIntersecting) return;
  sectionLinks.forEach(link => link.classList.toggle('active', link.getAttribute('href') === `#${entry.target.id}`));
}), { rootMargin: '-35% 0px -55% 0px', threshold: 0 });
sections.forEach(section => activeObserver.observe(section));

const revealItems = document.querySelectorAll('.reveal');
revealItems.forEach((item, index) => item.style.transitionDelay = `${Math.min(index * 55, 330)}ms`);

async function loadArchiveContent() {
  try {
    const response = await fetch('/content/nubia-content.json');
    if (!response.ok) throw new Error('content unavailable');
    const content = await response.json();
    const archive = document.createElement('section');
    archive.id = 'archive';
    archive.className = 'section archive-section';
    archive.innerHTML = `
      <div class="wrap">
        <div class="section-head reveal in">
          <div><div class="eyebrow">05 / THE LIVING MUSEUM</div><h2>المتحف<br><em class="serif">يُراجع نفسه.</em></h2></div>
          <p>${escapeHtml(content.editorial_note)}</p>
        </div>
        <div class="academic-banner glass reveal in"><div><span class="academic-seal">NB / 01</span><strong>${escapeHtml(content.academic_framework.review_status)}</strong></div><div class="evidence-legend">${content.academic_framework.evidence_levels.map(level => `<button class="evidence-filter" data-evidence="${escapeHtml(level.key)}"><i class="legend-dot ${escapeHtml(level.key)}"></i>${escapeHtml(level.label)}</button>`).join('')}</div></div>
        <div class="academic-method glass reveal in"><div><div class="eyebrow">EDITORIAL PROTOCOL</div><h3>كيف نعرف ما نعرفه؟</h3></div><div class="protocol-list">${content.academic_framework.editorial_protocol.map((item, i) => `<div><b>${String(i + 1).padStart(2, '0')}</b><span>${escapeHtml(item)}</span></div>`).join('')}</div></div>
        <div class="archive-layout glass reveal in">
          <aside class="archive-index"><div class="eyebrow">CHRONICLE / 08 CHAPTERS</div><div id="archive-chapters"></div></aside>
          <article class="archive-reader" id="archive-reader"></article>
        </div>
        <div class="atlas-head"><div><div class="eyebrow">ATLAS / PLACES & MEMORY</div><h3>أطلس النيل والقرى</h3></div><span class="archive-badge">سجل موثق · قابل للتوسع</span></div>
        <div class="atlas-grid" id="atlas-grid"></div>
        <div class="archive-sources"><div class="eyebrow">SOURCE ROOM</div><div class="source-list">${content.sources.map(source => `<a href="${source.url}" target="_blank" rel="noreferrer">${escapeHtml(source.title)} <span>${escapeHtml(source.kind)}</span></a>`).join('')}</div></div>
      </div>`;
    document.getElementById('time').after(archive);
    const reader = document.getElementById('archive-reader');
    const chapterHost = document.getElementById('archive-chapters');
    const renderChapter = index => {
      const chapter = content.periods[index];
      chapterFlare?.classList.remove('flash'); void chapterFlare?.offsetWidth; chapterFlare?.classList.add('flash');
      chapterHost.querySelectorAll('button').forEach((button, i) => button.classList.toggle('active', i === index));
      const sourceCards = chapter.source_ids.map(id => content.sources.find(source => source.id === id)).filter(Boolean);
      reader.innerHTML = `<div class="archive-kicker">${escapeHtml(chapter.chapter_id)} · ${escapeHtml(chapter.date)} · ${escapeHtml(chapter.evidence)}</div><h3>${escapeHtml(chapter.title)}</h3><div class="archive-chapter">${escapeHtml(chapter.cinematic)}</div><p>${escapeHtml(chapter.summary)}</p><div class="fact-stack">${chapter.facts.map((fact, factIndex) => `<div class="fact-row"><span>✦</span><p>${escapeHtml(fact)} <sup class="claim-marker">${escapeHtml(chapter.source_ids[factIndex % Math.max(chapter.source_ids.length, 1)] || 'تحرير')}</sup></p></div>`).join('')}</div><div class="claim-note">${escapeHtml(chapter.claim_note)}</div><div class="archive-foot"><span class="evidence-pill ${chapter.evidence}">${escapeHtml(chapter.status)}</span><span class="review-state">${escapeHtml(chapter.review_state)}</span><div class="chapter-sources">${sourceCards.map(source => `<a href="${source.url}" target="_blank" rel="noreferrer">${escapeHtml(source.id)} · ${escapeHtml(source.institution)} ↗</a>`).join('')}</div></div>`;
    };
    content.periods.forEach((chapter, index) => { const button = document.createElement('button'); button.className = 'archive-chapter-btn'; button.innerHTML = `<span>${String(index + 1).padStart(2, '0')}</span><b>${escapeHtml(chapter.title)}</b><small>${escapeHtml(chapter.date)}</small>`; button.onclick = () => renderChapter(index); chapterHost.appendChild(button); });
    renderChapter(0);
    const atlasGrid = document.getElementById('atlas-grid');
    atlasGrid.innerHTML = content.atlas.map(region => `<article class="atlas-region"><div class="atlas-region-head"><div><span class="eyebrow">${escapeHtml(region.type)}</span><h4>${escapeHtml(region.region)}</h4></div><span class="atlas-count">${region.places.length} مواقع</span></div><div class="place-list">${region.places.map(place => `<div class="place-card" data-evidence="${escapeHtml(place.evidence)}"><div class="place-card-top"><b>${escapeHtml(place.name)}</b><span class="place-status ${place.status.includes('قيد') ? 'review' : ''}">${escapeHtml(place.status)}</span></div><small>${escapeHtml(place.kind)} · ${escapeHtml(place.evidence)}</small><p>${escapeHtml(place.note)}</p><em>${escapeHtml(place.review_state)}</em></div>`).join('')}</div></article>`).join('');
    document.querySelectorAll('.evidence-filter').forEach(filter => filter.addEventListener('click', () => {
      const selected = filter.dataset.evidence;
      document.querySelectorAll('.evidence-filter').forEach(item => item.classList.toggle('active', item === filter));
      document.querySelectorAll('.place-card').forEach(card => card.classList.toggle('evidence-muted', selected !== 'all' && card.dataset.evidence !== selected));
    }));
    const archiveLink = document.querySelector('.nav a[href="#archive"]');
    if (archiveLink) { const archiveObserver = new IntersectionObserver(entries => entries.forEach(entry => entry.isIntersecting && archiveLink.classList.add('active')), { rootMargin: '-35% 0px -55% 0px' }); archiveObserver.observe(archive); }
  } catch (error) { console.warn('Nubia archive content:', error); }
}
function escapeHtml(value) { return String(value).replace(/[&<>"']/g, character => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[character])); }
loadArchiveContent();

// Museum-grade micro-interactions
const museum = document.querySelector('.museum');
if (museum) {
  const ribbon = document.createElement('div');
  ribbon.className = 'museum-ribbon';
  ribbon.innerHTML = '<i></i><b>LIVE COLLECTION</b><span>OBJECT 01 · MEROE / VISUAL STUDY</span><span>ACADEMIC EDITION · 2026</span>';
  museum.parentElement.insertBefore(ribbon, museum);
  if (!reduced && matchMedia('(pointer:fine)').matches) {
    museum.addEventListener('pointermove', event => {
      const box = museum.getBoundingClientRect();
      const x = (event.clientX - box.left) / box.width - .5;
      const y = (event.clientY - box.top) / box.height - .5;
      museum.style.transform = `perspective(1400px) rotateX(${-y * 1.2}deg) rotateY(${x * 1.4}deg)`;
    });
    museum.addEventListener('pointerleave', () => { museum.style.transform = ''; });
  }
}
const chapterFlare = document.createElement('div');
chapterFlare.className = 'chapter-flare';
chapterFlare.setAttribute('aria-hidden', 'true');
document.body.appendChild(chapterFlare);

// Monumental pyramid detail pass: every glow is a measurement cue, not decoration.
function enhancePyramid(parent, stone, brass, clay) {
  const detail = new THREE.Group();
  const glyph = new THREE.MeshBasicMaterial({ color: GOLD, transparent: true, opacity: .62 });
  const river = new THREE.MeshBasicMaterial({ color: WATER, transparent: true, opacity: .58 });
  const dark = new THREE.MeshStandardMaterial({ color: 0x35231b, roughness: .96 });
  const base = 2.15;
  const plinth = new THREE.Mesh(new THREE.CylinderGeometry(1.18, 1.34, .12, 4), dark);
  plinth.rotation.y = Math.PI / 4; plinth.position.y = -.91; plinth.receiveShadow = true; detail.add(plinth);
  for (let i = 0; i < 4; i++) {
    const angle = i * Math.PI / 2 + Math.PI / 4;
    const marker = new THREE.Mesh(new THREE.CylinderGeometry(.035, .07, 1.08, 6), brass);
    marker.position.set(Math.cos(angle) * 1.02, -.28, Math.sin(angle) * 1.02);
    marker.rotation.z = Math.PI / 2; marker.rotation.y = angle; marker.castShadow = true; detail.add(marker);
    const beacon = new THREE.Mesh(new THREE.OctahedronGeometry(.075, 0), glyph);
    beacon.position.set(Math.cos(angle) * 1.05, .32, Math.sin(angle) * 1.05); detail.add(beacon);
  }
  const surveyRing = new THREE.Mesh(new THREE.TorusGeometry(1.32, .012, 8, 96), river);
  surveyRing.rotation.x = Math.PI / 2; surveyRing.position.y = -.84; detail.add(surveyRing);
  const halo = new THREE.Mesh(new THREE.TorusGeometry(.88, .009, 8, 96), glyph);
  halo.rotation.x = Math.PI / 2; halo.position.y = 1.05; detail.add(halo);
  const axis = new THREE.Mesh(new THREE.CylinderGeometry(.008, .008, 3.35, 6), river);
  axis.position.y = .62; detail.add(axis);
  const gate = addArch(detail, clay, .62);
  gate.position.set(0, -.55, .79);
  gate.rotation.y = Math.PI;
  parent.add(detail);
  parent.userData.detail = detail;
}

// Interactive academic artifact lab
const artifactCanvas = document.querySelector('.museum-canvas');
if (artifactCanvas) {
  const layers = [
    ['01','القاعدة والمنصة','طبقة العرض البصري؛ لا تعني وحدها وظيفة طقسية.','مادي / يحتاج قراءة معمارية'],
    ['02','المصاطب المتدرجة','ترجمة هندسية تجريبية لفكرة الكتلة والارتفاع في الهرم.','تمثيل بصري'],
    ['03','المدخل المقوّس','تفصيل تصميمي مستوحى من العمارة النوبية؛ ليس إعادة بناء مؤكدة.','تفسير / مراجعة'],
    ['04','محور القياس','علامة تفاعلية لربط الشكل بالاتجاه والضوء والموقع.','أداة تعليمية'],
    ['05','الحلقة المدارية','طبقة بيانات مرئية تمثل تعدد القراءات لا حقيقة أثرية مستقلة.','واجهة / غير أثري'],
    ['06','التاج','إشارة إلى قمة الهرم؛ التفاصيل التاريخية تحتاج مقارنة بمسوحات الموقع.','فرضية بصرية']
  ];
  const lab = document.createElement('div'); lab.className = 'artifact-lab';
  lab.innerHTML = `<div class="artifact-lab-copy"><small>ARTIFACT LAB / EVIDENCE LENS</small><b id="artifact-layer-title">${layers[0][1]}</b><p id="artifact-layer-copy">${layers[0][2]}</p><em id="artifact-layer-status">${layers[0][3]}</em></div><div class="artifact-layers">${layers.map((layer, i) => `<button class="artifact-layer ${i === 0 ? 'active' : ''}" data-layer="${i}" aria-label="${layer[1]}">${layer[0]}</button>`).join('')}</div>`;
  artifactCanvas.appendChild(lab);
  const title = lab.querySelector('#artifact-layer-title'); const copy = lab.querySelector('#artifact-layer-copy'); const status = lab.querySelector('#artifact-layer-status');
  lab.querySelectorAll('.artifact-layer').forEach(button => button.addEventListener('click', () => {
    const i = Number(button.dataset.layer), layer = layers[i];
    lab.querySelectorAll('.artifact-layer').forEach(item => item.classList.toggle('active', item === button));
    title.textContent = layer[1]; copy.textContent = layer[2]; status.textContent = layer[3];
    window.nubiaArtifactFocus?.(i);
  }));
  const copyBlock = document.querySelector('.museum-copy');
  if (copyBlock) {
    const proof = document.createElement('div'); proof.className = 'academic-proof';
    proof.innerHTML = '<div class="academic-proof-mark">E</div><div><strong>قاعدة العرض الأكاديمي</strong><span>نميز بين الأثر المادي، والتمثيل البصري، والتفسير التحريري. اضغط طبقة لتعرف حدودها.</span></div>';
    copyBlock.appendChild(proof);
    const lens = document.createElement('div'); lens.className = 'research-lens';
    lens.innerHTML = '<button class="active">الدليل المادي</button><button>التفسير</button><button>الذاكرة الحية</button>';
    copyBlock.appendChild(lens);
    lens.querySelectorAll('button').forEach(button => button.addEventListener('click', () => {
      lens.querySelectorAll('button').forEach(item => item.classList.toggle('active', item === button));
      const mode = button.textContent;
      status.textContent = mode === 'الدليل المادي' ? 'قراءة مادية / افصل الشكل عن الاستنتاج' : mode === 'التفسير' ? 'تفسير تحريري / قابل للمراجعة' : 'ذاكرة حية / تحتاج مشاركة المجتمع';
    }));
  }
}

// Village archive slideshow: evidence-first, with explicit gaps for family records.
(async function initVillageArchive(){
  const stage=document.querySelector('.village-stage'); if(!stage) return;
  try{
    const data=await fetch('/content/village-cards.json').then(r=>r.json());
    const cards=data.cards||[]; let current=Math.max(0,cards.findIndex(x=>x.name==='أدندان'));
    const image=document.getElementById('village-image'), name=document.getElementById('village-name'), kind=document.getElementById('village-kind'), history=document.getElementById('village-history'), families=document.getElementById('village-families'), houses=document.getElementById('village-houses'), note=document.getElementById('village-note'), counter=document.getElementById('village-counter'), source=document.getElementById('village-source'), strip=document.getElementById('archive-strip');
    function render(){
      const c=cards[current], photo=c.images?.[0]; if(!c) return;
      image.style.opacity='0'; setTimeout(()=>{image.src=photo?.src||'';image.alt=c.name+' — '+(photo?.caption||'أرشيف النوبة');image.style.opacity='1'},120);
      name.textContent=c.name; kind.textContent=(c.evidence||'review').toUpperCase()+' / '+c.kind; history.textContent=c.history+' '+(c.archaeology||''); families.textContent=c.families?.length?c.families.join('، '):c.family_status; houses.textContent=c.houses||'قيد التوثيق'; note.textContent=(photo?.caption||'الصورة سياقية حتى يثبت المصدر أنها تخص القرية نفسها.')+' — '+(photo?.credit||'مصدر غير محدد')+' '+(c.family_status||''); counter.textContent=String(current+1).padStart(2,'0')+' / '+String(cards.length).padStart(2,'0'); source.href=c.family_source||c.sources?.[0]||'#'; source.target='_blank';
      [...strip.children].forEach((b,i)=>b.classList.toggle('active',i===current));
    }
    cards.forEach((c,i)=>{const b=document.createElement('button');b.innerHTML='<small>'+String(i+1).padStart(2,'0')+'</small>'+c.name;b.onclick=()=>{current=i;render()};strip.appendChild(b)});
    document.getElementById('village-prev').onclick=()=>{current=(current-1+cards.length)%cards.length;render()}; document.getElementById('village-next').onclick=()=>{current=(current+1)%cards.length;render()}; render();
  }catch(error){document.getElementById('village-history').textContent='تعذر تحميل طبقة الأرشيف؛ راجع ملف البيانات قبل نشر النسخة.'; console.warn('Village archive unavailable',error)}
})();
