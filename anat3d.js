import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

const ANAT_DATA = {
  skull: {
    name: "Череп и головной мозг",
    layer: "skeleton",
    desc: "Мозговой отдел защищает головной мозг, лицевой формирует челюсти. Кости черепа соединены неподвижно (швами), кроме нижней челюсти.",
    trap: "Ловушка ОГЭ: единственная подвижная кость черепа — нижняя челюсть (сустав)."
  },
  spine: {
    name: "Позвоночник",
    layer: "skeleton",
    desc: "Состоит из 33–34 позвонков (5 отделов: шейный — 7, грудной — 12, поясничный — 5, крестцовый — 5, копчиковый — 4–5). Имеет 4 S-образных изгиба.",
    trap: "Ловушка ОГЭ: у всех млекопитающих (и у человека, и у жирафа) в шейном отделе ровно 7 позвонков."
  },
  ribs: {
    name: "Грудная клетка",
    layer: "skeleton",
    desc: "Образована грудными позвонками, 12 парами рёбер и грудиной. Защищает сердце и лёгкие, участвует в дыхательных движениях.",
    trap: "Ловушка ОГЭ: 11-я и 12-я пары рёбер — колеблющиеся, они не прикрепляются к грудине."
  },
  heart: {
    name: "Сердце",
    layer: "organs",
    desc: "Четырёхкамерный мышечный орган (2 предсердия, 2 желудочка). Обеспечивает движение крови по большому и малому кругам кровообращения.",
    trap: "Ловушка ОГЭ: стенка левого желудочка самая толстая, так как он выталкивает кровь в большой круг кровообращения."
  },
  lungs: {
    name: "Лёгкие",
    layer: "organs",
    desc: "Парный орган дыхания, состоящий из миллионов альвеол, оплетённых капиллярами. Здесь происходит газообмен между воздухом и кровью.",
    trap: "Ловушка ОГЭ: в лёгких нет мышечной ткани — они расширяются пассивно за счёт сокращения диафрагмы и межрёберных мышц."
  },
  liver: {
    name: "Печень",
    layer: "organs",
    desc: "Самая крупная железа организма. Вырабатывает желчь (эмульгирует жиры), обезвреживает токсины, запасает гликоген.",
    trap: "Ловушка ОГЭ: желчь НЕ содержит пищеварительных ферментов — она только дробит жиры на мелкие капли."
  },
  stomach: {
    name: "Желудок",
    layer: "organs",
    desc: "Расширенный отдел ЖКТ. Желудочный сок содержит соляную кислоту (HCl) и фермент пепсин, расщепляющий белки.",
    trap: "Ловушка ОГЭ: пепсин активен только в кислой среде (pH ≈ 1,5–2), а амилаза слюны в желудке прекращает работу."
  },
  kidneys: {
    name: "Почки",
    layer: "organs",
    desc: "Парный орган выделительной системы. Структурно-функциональная единица — нефрон. Очищают кровь и образуют мочу.",
    trap: "Ловушка ОГЭ: в норме во вторичной моче НЕ должно быть белков и глюкозы — глюкоза полностью всасывается обратно в канальцах."
  },
  pelvis: {
    name: "Тазовый пояс",
    layer: "skeleton",
    desc: "Образован двумя тазовыми костями и крестцом. Служит опорой для внутренних органов и передаёт массу тела на нижние конечности.",
    trap: "Ловушка ОГЭ: у человека таз широкий и чашеобразный — это прямое следствие прямохождения."
  },
  limbs: {
    name: "Скелет конечностей",
    layer: "skeleton",
    desc: "Верхние (плечо, предплечье, кисть) и нижние (бедро, голень, стопа) конечности образованы преимущественно длинными трубчатыми костями.",
    trap: "Ловушка ОГЭ: бедренная кость — самая длинная и прочная трубчатая кость в организме человека."
  }
};

export function openAnat3D() {
  if (document.getElementById("anat-overlay")) return;

  const ov = document.createElement("div");
  ov.id = "anat-overlay";
  ov.className = "anat-ov";
  ov.innerHTML = `
    <div class="anat-ui-top">
      <button type="button" class="anat-btn" id="anat-close">← Назад</button>
      <div class="anat-layers">
        <button type="button" class="anat-tab on" data-layer="all">Всё</button>
        <button type="button" class="anat-tab" data-layer="skeleton">Скелет</button>
        <button type="button" class="anat-tab" data-layer="organs">Органы</button>
      </div>
    </div>
    <div id="anat-canvas-wrap" style="width:100%;height:100%;touch-action:none;"></div>
    <div class="anat-card" id="anat-card">
      <span class="anat-kicker">3D-АНАТОМИЯ · ОГЭ</span>
      <b id="anat-title">Нажми на орган или кость</b>
      <p id="anat-desc">Вращай модель одним пальцем, приближай двумя. Выбери любую часть тела, чтобы увидеть разбор и ловушку ОГЭ.</p>
      <div class="anat-trap" id="anat-trap" hidden></div>
    </div>
  `;
  document.body.appendChild(ov);
  document.body.style.overflow = "hidden";

  const wrap = ov.querySelector("#anat-canvas-wrap");
  const width = wrap.clientWidth || window.innerWidth;
  const height = wrap.clientHeight || window.innerHeight;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x0b1210);

  const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
  camera.position.set(0, 0.4, 5.2);

  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(width, height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  wrap.appendChild(renderer.domElement);

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.target.set(0, 0.1, 0);
  controls.minDistance = 2.2;
  controls.maxDistance = 8.5;

  // Освещение
  scene.add(new THREE.AmbientLight(0xffffff, 0.65));
  const dirLight = new THREE.DirectionalLight(0xffffff, 1.1);
  dirLight.position.set(4, 6, 5);
  scene.add(dirLight);
  const rimLight = new THREE.DirectionalLight(0x4cc380, 0.5);
  rimLight.position.set(-4, 2, -4);
  scene.add(rimLight);

  const root = new THREE.Group();
  scene.add(root);

  const clickable = [];
  const groups = { skeleton: new THREE.Group(), organs: new THREE.Group() };
  root.add(groups.skeleton, groups.organs);

  function addPart(geo, color, pos, key, rot = [0, 0, 0], scale = [1, 1, 1]) {
    const mat = new THREE.MeshStandardMaterial({
      color,
      roughness: ANAT_DATA[key].layer === "skeleton" ? 0.45 : 0.35,
      metalness: 0.05
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(...pos);
    mesh.rotation.set(...rot);
    mesh.scale.set(...scale);
    mesh.userData = { key, baseColor: color };
    groups[ANAT_DATA[key].layer].add(mesh);
    clickable.push(mesh);
    return mesh;
  }

  // ── СКЕЛЕТ ──
  const boneCol = 0xe8e4d8;
  addPart(new THREE.SphereGeometry(0.32, 24, 20), boneCol, [0, 1.58, 0], "skull", [0, 0, 0], [0.92, 1.08, 1]);
  addPart(new THREE.BoxGeometry(0.26, 0.18, 0.28), boneCol, [0, 1.32, 0.06], "skull");
  for (let i = 0; i < 14; i++) {
    addPart(new THREE.CylinderGeometry(0.08, 0.085, 0.09, 12), boneCol, [0, 1.18 - i * 0.115, -0.08], "spine");
  }
  addPart(new THREE.BoxGeometry(0.11, 0.52, 0.05), boneCol, [0, 0.72, 0.24], "ribs");
  for (let i = 0; i < 6; i++) {
    const r = 0.34 + Math.sin((i / 5) * Math.PI) * 0.08;
    addPart(new THREE.TorusGeometry(r, 0.025, 8, 24, Math.PI * 1.45), boneCol, [0, 0.96 - i * 0.11, 0.02], "ribs", [Math.PI / 2, 0, Math.PI * 0.78]);
  }
  addPart(new THREE.TorusGeometry(0.28, 0.09, 12, 20), boneCol, [0, -0.35, 0], "pelvis", [Math.PI / 2, 0, 0], [1.25, 0.75, 1]);
  [-1, 1].forEach(side => {
    addPart(new THREE.CylinderGeometry(0.055, 0.045, 0.65, 12), boneCol, [side * 0.56, 0.72, 0], "limbs", [0, 0, side * 0.12]);
    addPart(new THREE.CylinderGeometry(0.045, 0.038, 0.62, 12), boneCol, [side * 0.64, 0.12, 0.04], "limbs", [0.1, 0, side * 0.06]);
    addPart(new THREE.CylinderGeometry(0.075, 0.06, 0.85, 12), boneCol, [side * 0.24, -0.82, 0], "limbs");
    addPart(new THREE.CylinderGeometry(0.058, 0.048, 0.82, 12), boneCol, [side * 0.24, -1.68, 0], "limbs");
  });

  // ── ОРГАНЫ ──
  addPart(new THREE.SphereGeometry(0.22, 20, 16), 0xf29cb0, [-0.2, 0.72, 0.02], "lungs", [0, 0, 0.12], [0.85, 1.35, 0.8]);
  addPart(new THREE.SphereGeometry(0.22, 20, 16), 0xf29cb0, [0.2, 0.72, 0.02], "lungs", [0, 0, -0.12], [0.85, 1.35, 0.8]);
  const heartMesh = addPart(new THREE.SphereGeometry(0.14, 20, 16), 0xd62839, [0.06, 0.68, 0.12], "heart", [0, 0, -0.25], [0.95, 1.2, 0.9]);
  addPart(new THREE.SphereGeometry(0.18, 18, 14), 0x8d3b2f, [-0.14, 0.32, 0.1], "liver", [0, 0, 0.3], [1.3, 0.7, 0.8]);
  addPart(new THREE.SphereGeometry(0.14, 18, 14), 0xe08e45, [0.14, 0.26, 0.09], "stomach", [0, 0, -0.4], [0.9, 1.15, 0.8]);
  addPart(new THREE.SphereGeometry(0.085, 16, 12), 0x9e3b46, [-0.16, 0.06, -0.06], "kidneys", [0, 0, 0], [0.85, 1.35, 0.75]);
  addPart(new THREE.SphereGeometry(0.085, 16, 12), 0x9e3b46, [0.16, 0.06, -0.06], "kidneys", [0, 0, 0], [0.85, 1.35, 0.75]);

  // Переключение слоёв
  ov.querySelectorAll("[data-layer]").forEach(btn => {
    btn.addEventListener("click", () => {
      const l = btn.dataset.layer;
      ov.querySelectorAll("[data-layer]").forEach(b => b.classList.toggle("on", b === btn));
      groups.skeleton.visible = (l === "all" || l === "skeleton");
      groups.organs.visible = (l === "all" || l === "organs");
    });
  });

  // Выбор детали по клику
  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2();
  let downPos = { x: 0, y: 0 };

  renderer.domElement.addEventListener("pointerdown", e => {
    downPos = { x: e.clientX, y: e.clientY };
  });

  renderer.domElement.addEventListener("pointerup", e => {
    if (Math.hypot(e.clientX - downPos.x, e.clientY - downPos.y) > 8) return;
    const rect = renderer.domElement.getBoundingClientRect();
    pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
    raycaster.setFromCamera(pointer, camera);

    const visibleMeshes = clickable.filter(m => m.parent.visible);
    const hits = raycaster.intersectObjects(visibleMeshes);
    if (!hits.length) return;

    const selectedKey = hits[0].object.userData.key;
    clickable.forEach(m => {
      m.material.emissive.setHex(m.userData.key === selectedKey ? 0x2e8b57 : 0x000000);
      m.material.emissiveIntensity = m.userData.key === selectedKey ? 0.55 : 0;
    });

    const info = ANAT_DATA[selectedKey];
    ov.querySelector("#anat-title").textContent = info.name;
    ov.querySelector("#anat-desc").textContent = info.desc;
    const trapEl = ov.querySelector("#anat-trap");
    trapEl.textContent = info.trap;
    trapEl.hidden = false;

    const tg = window.Telegram && window.Telegram.WebApp;
    if (tg && tg.HapticFeedback) tg.HapticFeedback.impactOccurred("light");
  });

  // Анимация
  let rafId = 0;
  const clock = new THREE.Clock();
  function animate() {
    rafId = requestAnimationFrame(animate);
    const t = clock.getElapsedTime();
    const beat = 1 + Math.pow(Math.max(0, Math.sin(t * 4.5)), 6) * 0.14;
    heartMesh.scale.set(0.95 * beat, 1.2 * beat, 0.9 * beat);
    controls.update();
    renderer.render(scene, camera);
  }
  animate();

  const onResize = () => {
    const w = wrap.clientWidth || window.innerWidth;
    const h = wrap.clientHeight || window.innerHeight;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h);
  };
  window.addEventListener("resize", onResize);

  ov.querySelector("#anat-close").addEventListener("click", () => {
    cancelAnimationFrame(rafId);
    window.removeEventListener("resize", onResize);
    controls.dispose();
    renderer.dispose();
    ov.remove();
    document.body.style.overflow = "";
  });
}
