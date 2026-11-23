import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

const BODY_INFO = {
  skull: {
    name: "Череп и головной мозг",
    layer: "skeleton",
    desc: "Мозговой отдел защищает мозг, лицевой формирует челюсти и глазницы. Кости соединены неподвижно (швами), кроме нижней челюсти.",
    trap: "Ловушка ОГЭ: единственная подвижная кость черепа — нижняя челюсть (сустав)."
  },
  spine: {
    name: "Позвоночник (S-образный)",
    layer: "skeleton",
    desc: "33–34 позвонка: шейный (7), грудной (12), поясничный (5), крестцовый (5 сросшихся), копчиковый (4–5). 4 изгиба амортизируют толчки при ходьбе.",
    trap: "Ловушка ОГЭ: у всех млекопитающих в шейном отделе ровно 7 позвонков."
  },
  ribs: {
    name: "Грудная клетка (12 пар рёбер)",
    layer: "skeleton",
    desc: "Грудина, грудные позвонки и 12 пар рёбер. 1–7 пары — истинные, 8–10 — ложные, 11–12 — колеблющиеся (свободные).",
    trap: "Ловушка ОГЭ: 11-я и 12-я пары рёбер не прикрепляются к грудине."
  },
  clavicle: {
    name: "Пояс верхних конечностей",
    layer: "skeleton",
    desc: "Парные ключицы и лопатки. Обеспечивают высокую подвижность рук.",
    trap: "Ловушка ОГЭ: лопатка — плоская кость, ключица — изогнутая трубчатая."
  },
  pelvis: {
    name: "Тазовый пояс",
    layer: "skeleton",
    desc: "Две массивные тазовые кости и крестец. Опора внутренних органов и передача веса на ноги.",
    trap: "Ловушка ОГЭ: широкий чашеобразный таз — признак прямохождения человека."
  },
  limbs: {
    name: "Скелет конечностей",
    layer: "skeleton",
    desc: "Плечо (1 кость) и предплечье (лучевая и локтевая); бедро (1 кость) и голень (большая и малая берцовые).",
    trap: "Ловушка ОГЭ: бедренная кость — самая длинная и прочная трубчатая кость."
  },
  heart: {
    name: "Сердце",
    layer: "organs",
    desc: "Четырёхкамерный мышечный насос. Слева — артериальная кровь, справа — венозная.",
    trap: "Ловушка ОГЭ: стенка левого желудочка самая толстая."
  },
  lungs: {
    name: "Лёгкие и трахея",
    layer: "organs",
    desc: "Парный орган дыхания, состоящий из альвеол. Трахея укреплена хрящевыми полукольцами.",
    trap: "Ловушка ОГЭ: в лёгких нет мышц — вдох обеспечивают диафрагма и межрёберные мышцы."
  },
  liver: {
    name: "Печень",
    layer: "organs",
    desc: "Крупнейшая железа: вырабатывает желчь, обезвреживает токсины, запасает гликоген.",
    trap: "Ловушка ОГЭ: желчь НЕ содержит ферментов, она эмульгирует жиры."
  },
  stomach: {
    name: "Желудок",
    layer: "organs",
    desc: "Желудочный сок содержит HCl и пепсин (расщепляет белки в кислой среде).",
    trap: "Ловушка ОГЭ: амилаза слюны в кислой среде желудка перестаёт работать."
  },
  intestines: {
    name: "Кишечник (тонкий и толстый)",
    layer: "organs",
    desc: "В тонком кишечнике завершается переваривание и идёт всасывание через ворсинки. В толстом всасывается вода.",
    trap: "Ловушка ОГЭ: в ворсинках тонкой кишки жиры всасываются в лимфу, а глюкоза и аминокислоты — в кровь."
  },
  kidneys: {
    name: "Почки",
    layer: "organs",
    desc: "Парный орган выделения. Единица строения — нефрон (фильтрация + реабсорбция).",
    trap: "Ловушка ОГЭ: во вторичной моче в норме нет белков и глюкозы."
  }
};

const INJECTION_STEPS = [
  { t: 0.00, title: "1. Укол в вену руки", desc: "Лекарство введено в венозную кровь локтевой вены руки.", trap: "Вены несут кровь К сердцу." },
  { t: 0.16, title: "2. Верхняя полая вена", desc: "По подключичной и верхней полой вене лекарство движется к сердцу.", trap: "Верхняя полая вена собирает кровь от головы и рук." },
  { t: 0.30, title: "3. Правое предсердие", desc: "Первая камера сердца, куда попадает лекарство из вены руки!", trap: "Ловушка ОГЭ: из вены руки лекарство ВСЕГДА сначала попадает в правое предсердие." },
  { t: 0.42, title: "4. Правый желудочек", desc: "Через трёхстворчатый клапан кровь с лекарством идёт в правый желудочек.", trap: "Здесь начинается малый круг кровообращения." },
  { t: 0.56, title: "5. Лёгочная артерия → Лёгкие", desc: "Лекарство обязательно проходит через капилляры лёгких (малый круг).", trap: "По лёгочной артерии течёт венозная кровь!" },
  { t: 0.72, title: "6. Лёгочная вена → Левое предсердие", desc: "Обогащённая кислородом артериальная кровь с лекарством возвращается в сердце.", trap: "По лёгочным венам течёт артериальная кровь!" },
  { t: 0.84, title: "7. Левый желудочек → Аорта", desc: "Мощный левый желудочек выталкивает лекарство в аорту (большой круг).", trap: "В аорте самое высокое давление крови." },
  { t: 0.96, title: "8. Доставка к органам и мозгу", desc: "По артериям большого круга лекарство достигает целевого органа.", trap: "Чтобы попасть от руки к мозгу, лекарство проходит через сердце дважды!" }
];

export function openAnat3D(initialScene = "body") {
  if (document.getElementById("anat-overlay")) return;

  const ov = document.createElement("div");
  ov.id = "anat-overlay";
  ov.className = "anat-ov";
  ov.innerHTML = `
    <div class="anat-ui-top">
      <button type="button" class="anat-btn" id="anat-close">← Назад</button>
      <div class="anat-layers" id="scene-switcher">
        <button type="button" class="anat-tab" data-scn="body">Тело</button>
        <button type="button" class="anat-tab" data-scn="heart">Сердце + Укол</button>
        <button type="button" class="anat-tab" data-scn="lungs">Лёгкие</button>
      </div>
    </div>
    <div class="anat-controls" id="anat-controls"></div>
    <div id="anat-canvas-wrap" style="width:100%;height:100%;touch-action:none;"></div>
    <div class="anat-card" id="anat-card">
      <span class="anat-kicker" id="anat-kicker">3D-АНАТОМИЯ · ОГЭ</span>
      <b id="anat-title">Загрузка...</b>
      <p id="anat-desc"></p>
      <div class="anat-trap" id="anat-trap" hidden></div>
    </div>
  `;
  document.body.appendChild(ov);
  document.body.style.overflow = "hidden";

  const wrap = ov.querySelector("#anat-canvas-wrap");
  const controlsBar = ov.querySelector("#anat-controls");
  const width = wrap.clientWidth || window.innerWidth;
  const height = wrap.clientHeight || window.innerHeight;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x0b1210);

  const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(width, height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  wrap.appendChild(renderer.domElement);

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.minDistance = 1.8;
  controls.maxDistance = 9;

  scene.add(new THREE.AmbientLight(0xffffff, 0.65));
  const dirLight = new THREE.DirectionalLight(0xffffff, 1.15);
  dirLight.position.set(4, 6, 5);
  scene.add(dirLight);
  const rimLight = new THREE.DirectionalLight(0x4cc380, 0.45);
  rimLight.position.set(-4, 2, -4);
  scene.add(rimLight);

  let activeSceneRoot = new THREE.Group();
  scene.add(activeSceneRoot);
  let clickable = [];
  let updateFn = () => {};

  function setCard(kicker, title, desc, trap) {
    ov.querySelector("#anat-kicker").textContent = kicker;
    ov.querySelector("#anat-title").textContent = title;
    ov.querySelector("#anat-desc").textContent = desc;
    const trapEl = ov.querySelector("#anat-trap");
    if (trap) { trapEl.textContent = trap; trapEl.hidden = false; }
    else { trapEl.hidden = true; }
  }

  function clearScene() {
    scene.remove(activeSceneRoot);
    activeSceneRoot = new THREE.Group();
    scene.add(activeSceneRoot);
    clickable = [];
    controlsBar.innerHTML = "";
    updateFn = () => {};
  }

  // =========================================================================
  // СЦЕНА 1: ДЕТАЛЬНЫЙ СКЕЛЕТ И ОРГАНЫ
  // =========================================================================
  function buildBodyScene() {
    clearScene();
    camera.position.set(0, 0.35, 5.4);
    controls.target.set(0, 0.05, 0);

    const groups = { skeleton: new THREE.Group(), organs: new THREE.Group() };
    activeSceneRoot.add(groups.skeleton, groups.organs);

    controlsBar.innerHTML = `
      <div class="anat-layers">
        <button type="button" class="anat-tab on" data-layer="all">Всё</button>
        <button type="button" class="anat-tab" data-layer="skeleton">Скелет</button>
        <button type="button" class="anat-tab" data-layer="organs">Органы</button>
      </div>
    `;
    controlsBar.querySelectorAll("[data-layer]").forEach(btn => {
      btn.addEventListener("click", () => {
        const l = btn.dataset.layer;
        controlsBar.querySelectorAll("[data-layer]").forEach(b => b.classList.toggle("on", b === btn));
        groups.skeleton.visible = (l === "all" || l === "skeleton");
        groups.organs.visible = (l === "all" || l === "organs");
      });
    });

    function addPart(geo, color, pos, key, rot = [0, 0, 0], scale = [1, 1, 1], opacity = 1) {
      const mat = new THREE.MeshStandardMaterial({
        color,
        roughness: BODY_INFO[key].layer === "skeleton" ? 0.42 : 0.35,
        metalness: 0.05,
        transparent: opacity < 1,
        opacity
      });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(...pos);
      mesh.rotation.set(...rot);
      mesh.scale.set(...scale);
      mesh.userData = { key };
      groups[BODY_INFO[key].layer].add(mesh);
      clickable.push(mesh);
      return mesh;
    }

    const bone = 0xebe6d8;
    // Череп (мозговой отдел + челюсть + глазницы)
    addPart(new THREE.SphereGeometry(0.30, 24, 20), bone, [0, 1.62, -0.02], "skull", [0, 0, 0], [0.9, 1.05, 1.02]);
    addPart(new THREE.BoxGeometry(0.24, 0.16, 0.24), bone, [0, 1.36, 0.08], "skull");
    addPart(new THREE.SphereGeometry(0.065, 12, 12), 0x262626, [-0.10, 1.56, 0.24], "skull");
    addPart(new THREE.SphereGeometry(0.065, 12, 12), 0x262626, [0.10, 1.56, 0.24], "skull");

    // S-образный позвоночник (24 подвижных позвонка с остистыми отростками)
    for (let i = 0; i < 24; i++) {
      const t = i / 23;
      const y = 1.24 - t * 1.52;
      const zCurve = Math.sin(t * Math.PI * 2.2) * 0.065 - 0.10;
      const r = 0.055 + t * 0.03;
      addPart(new THREE.CylinderGeometry(r, r * 1.04, 0.048, 12), bone, [0, y, zCurve], "spine");
      addPart(new THREE.BoxGeometry(0.025, 0.035, 0.07), bone, [0, y - 0.01, zCurve - r - 0.02], "spine");
    }

    // Ключицы и лопатки
    [-1, 1].forEach(s => {
      addPart(new THREE.CylinderGeometry(0.024, 0.024, 0.42, 10), bone, [s * 0.24, 1.12, 0.16], "clavicle", [0, 0, Math.PI / 2 - s * 0.12]);
      addPart(new THREE.ConeGeometry(0.14, 0.30, 3), bone, [s * 0.26, 0.90, -0.18], "clavicle", [Math.PI, 0, s * 0.15], [1, 1, 0.25]);
    });

    // Грудная клетка: грудина + 12 пар рёбер (включая колеблющиеся 11–12)
    addPart(new THREE.BoxGeometry(0.10, 0.50, 0.045), bone, [0, 0.80, 0.25], "ribs");
    for (let i = 0; i < 12; i++) {
      const y = 1.08 - i * 0.068;
      const rx = 0.26 + Math.sin((i / 11) * Math.PI) * 0.15;
      const arc = i < 10 ? Math.PI * 1.48 : Math.PI * 0.85; // 11-12 пары короче
      addPart(new THREE.TorusGeometry(rx, 0.018, 8, 24, arc), bone, [0, y, 0.02], "ribs", [Math.PI / 2, 0, Math.PI * 0.76]);
    }

    // Таз (крылья подвздошных костей + лобковая дуга)
    addPart(new THREE.TorusGeometry(0.27, 0.08, 12, 22), bone, [0, -0.36, 0], "pelvis", [Math.PI / 2, 0, 0], [1.28, 0.78, 1]);
    [-1, 1].forEach(s => {
      addPart(new THREE.SphereGeometry(0.18, 16, 12), bone, [s * 0.24, -0.26, -0.02], "pelvis", [0, 0, s * 0.4], [0.9, 1.1, 0.4]);
    });

    // Конечности: плечо, предплечье (2 кости!), бедро, голень (2 кости!)
    [-1, 1].forEach(s => {
      // Плечевая
      addPart(new THREE.CylinderGeometry(0.048, 0.040, 0.62, 12), bone, [s * 0.54, 0.78, 0], "limbs", [0, 0, s * 0.10]);
      addPart(new THREE.SphereGeometry(0.065, 12, 12), bone, [s * 0.48, 1.08, 0], "limbs");
      // Лучевая и локтевая
      addPart(new THREE.CylinderGeometry(0.024, 0.022, 0.58, 10), bone, [s * 0.60, 0.20, 0.03], "limbs", [0.06, 0, s * 0.06]);
      addPart(new THREE.CylinderGeometry(0.024, 0.022, 0.58, 10), bone, [s * 0.65, 0.20, -0.01], "limbs", [0.06, 0, s * 0.06]);
      // Бедренная
      addPart(new THREE.CylinderGeometry(0.068, 0.054, 0.88, 14), bone, [s * 0.24, -0.84, 0], "limbs", [0, 0, -s * 0.04]);
      addPart(new THREE.SphereGeometry(0.08, 12, 12), bone, [s * 0.26, -0.40, 0], "limbs");
      // Большая и малая берцовые
      addPart(new THREE.CylinderGeometry(0.046, 0.038, 0.82, 12), bone, [s * 0.21, -1.70, 0.01], "limbs");
      addPart(new THREE.CylinderGeometry(0.022, 0.018, 0.80, 10), bone, [s * 0.28, -1.70, -0.02], "limbs");
    });

    // Внутренние органы
    addPart(new THREE.CylinderGeometry(0.045, 0.045, 0.36, 14), 0x9ec5e8, [0, 1.05, 0.04], "lungs");
    addPart(new THREE.SphereGeometry(0.21, 20, 16), 0xf29cb0, [-0.19, 0.78, 0.03], "lungs", [0, 0, 0.1], [0.85, 1.38, 0.78], 0.88);
    addPart(new THREE.SphereGeometry(0.21, 20, 16), 0xf29cb0, [0.19, 0.78, 0.03], "lungs", [0, 0, -0.1], [0.85, 1.38, 0.78], 0.88);
    const heartMesh = addPart(new THREE.SphereGeometry(0.13, 20, 16), 0xd62839, [0.05, 0.72, 0.13], "heart", [0, 0, -0.25], [0.95, 1.22, 0.9]);
    addPart(new THREE.SphereGeometry(0.17, 18, 14), 0x8d3b2f, [-0.13, 0.36, 0.11], "liver", [0, 0, 0.28], [1.35, 0.68, 0.78]);
    addPart(new THREE.SphereGeometry(0.13, 18, 14), 0xe08e45, [0.13, 0.30, 0.10], "stomach", [0, 0, -0.35], [0.92, 1.15, 0.78]);
    addPart(new THREE.TorusGeometry(0.17, 0.055, 12, 24), 0xd8a384, [0, 0.02, 0.09], "intestines", [0, 0, 0], [1.15, 0.95, 0.7]);
    addPart(new THREE.SphereGeometry(0.075, 16, 12), 0x9e3b46, [-0.15, 0.12, -0.05], "kidneys", [0, 0, 0], [0.85, 1.35, 0.75]);
    addPart(new THREE.SphereGeometry(0.075, 16, 12), 0x9e3b46, [0.15, 0.12, -0.05], "kidneys", [0, 0, 0], [0.85, 1.35, 0.75]);

    setCard("3D-АНАТОМИЯ · ТЕЛО", "Нажми на орган или кость", "Вращай модель одним пальцем. Переключай слои «Скелет» и «Органы» сверху.", null);

    updateFn = (t) => {
      const beat = 1 + Math.pow(Math.max(0, Math.sin(t * 4.5)), 6) * 0.14;
      heartMesh.scale.set(0.95 * beat, 1.22 * beat, 0.9 * beat);
    };
  }

  // =========================================================================
  // СЦЕНА 2: СЕРДЦЕ, КРУГИ КРОВООБРАЩЕНИЯ И УКОЛ В РУКУ
  // =========================================================================
  function buildHeartScene() {
    clearScene();
    camera.position.set(0, 0.2, 5.2);
    controls.target.set(0, 0.1, 0);

    let injecting = false;
    let drugT = 0;

    controlsBar.innerHTML = `
      <button type="button" class="anat-btn accent" id="btn-inject">💉 Ввести лекарство в вену руки</button>
      <button type="button" class="anat-btn" id="btn-reset-inj">Сброс</button>
    `;

    // Полупрозрачный силуэт сердца (4 камеры)
    const heartGroup = new THREE.Group();
    activeSceneRoot.add(heartGroup);

    function chamber(pos, color, scale, name) {
      const m = new THREE.Mesh(
        new THREE.SphereGeometry(0.32, 24, 20),
        new THREE.MeshStandardMaterial({ color, roughness: 0.35, transparent: true, opacity: 0.85 })
      );
      m.position.set(...pos);
      m.scale.set(...scale);
      m.userData = { customInfo: name };
      heartGroup.add(m);
      clickable.push(m);
      return m;
    }

    // Правая половина (венозная — синяя) и левая половина (артериальная — красная)
    chamber([-0.26, 0.28, 0], 0x2d6cdf, [0.9, 0.9, 0.85], {
      name: "Правое предсердие (венозная кровь)",
      desc: "Сюда впадают верхняя и нижняя полые вены. Первая камера, куда попадает лекарство из вены руки.",
      trap: "Ловушка ОГЭ: здесь заканчивается большой круг кровообращения."
    });
    chamber([-0.24, -0.26, 0.02], 0x1e4fa3, [0.95, 1.15, 0.9], {
      name: "Правый желудочек (венозная кровь)",
      desc: "Выталкивает венозную кровь в лёгочную артерию (начало малого круга).",
      trap: "Ловушка ОГЭ: между правым предсердием и правым желудочком — трёхстворчатый клапан."
    });
    chamber([0.26, 0.28, 0], 0xe63946, [0.9, 0.9, 0.85], {
      name: "Левое предсердие (артериальная кровь)",
      desc: "Принимает артериальную кровь из лёгких по лёгочным венам.",
      trap: "Ловушка ОГЭ: здесь заканчивается малый круг кровообращения."
    });
    chamber([0.24, -0.26, 0.02], 0xb5172a, [1.05, 1.25, 0.95], {
      name: "Левый желудочек (артериальная кровь)",
      desc: "Самая толстая мышечная стенка! Выталкивает кровь в аорту (начало большого круга).",
      trap: "Ловушка ОГЭ: между левым предсердием и левым желудочком — двустворчатый (митральный) клапан."
    });

    // Схематичные лёгкие (сверху) и рука (слева) и мозг/органы (справа)
    const lungL = new THREE.Mesh(new THREE.SphereGeometry(0.42, 20, 16), new THREE.MeshStandardMaterial({ color: 0xf29cb0, transparent: true, opacity: 0.45 }));
    lungL.position.set(-0.55, 1.45, -0.1); lungL.scale.set(0.9, 0.75, 0.7);
    const lungR = lungL.clone(); lungR.position.x = 0.55;
    activeSceneRoot.add(lungL, lungR);

    // Рука слева (точка укола)
    const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.11, 1.3, 14), new THREE.MeshStandardMaterial({ color: 0xd9b39c, transparent: true, opacity: 0.5 }));
    arm.position.set(-1.75, 0.25, 0); arm.rotation.z = Math.PI / 2.2;
    activeSceneRoot.add(arm);

    // Целевой орган справа (головной мозг / ткани)
    const brain = new THREE.Mesh(new THREE.SphereGeometry(0.32, 18, 14), new THREE.MeshStandardMaterial({ color: 0xf4a261, transparent: true, opacity: 0.6 }));
    brain.position.set(1.75, 0.65, 0);
    activeSceneRoot.add(brain);

    // Траектория движения лекарства от вены руки через оба круга к органу
    const pathPoints = [
      new THREE.Vector3(-2.25, 0.15, 0.05), // 1. Вена руки (укол)
      new THREE.Vector3(-1.10, 0.45, 0.05), // 2. Подключичная / верхняя полая вена
      new THREE.Vector3(-0.35, 0.55, 0.05), // вход в правое предсердие
      new THREE.Vector3(-0.26, 0.28, 0.12), // 3. Правое предсердие
      new THREE.Vector3(-0.24, -0.26, 0.12),// 4. Правый желудочек
      new THREE.Vector3(-0.45, 0.85, 0.05), // 5. Лёгочная артерия
      new THREE.Vector3(-0.45, 1.45, 0.05), // Капилляры лёгких (левое)
      new THREE.Vector3(0.45, 1.45, 0.05),  // Капилляры лёгких (правое)
      new THREE.Vector3(0.42, 0.80, 0.05),  // 6. Лёгочная вена
      new THREE.Vector3(0.26, 0.28, 0.12),  // Левое предсердие
      new THREE.Vector3(0.24, -0.26, 0.12), // 7. Левый желудочек
      new THREE.Vector3(0.10, 0.85, 0.18),  // Дуга аорты
      new THREE.Vector3(1.15, 0.85, 0.10),  // Сонная артерия
      new THREE.Vector3(1.75, 0.65, 0.05)   // 8. Целевой орган (мозг)
    ];
    const curve = new THREE.CatmullRomCurve3(pathPoints);
    const tubeGeo = new THREE.TubeGeometry(curve, 120, 0.045, 10, false);
    const tubeMat = new THREE.MeshStandardMaterial({ color: 0x4cc380, transparent: true, opacity: 0.35 });
    activeSceneRoot.add(new THREE.Mesh(tubeGeo, tubeMat));

    // Светящаяся капсула лекарства (3 частицы друг за другом)
    const drugParticles = [0, 0.018, 0.036].map(offset => {
      const p = new THREE.Mesh(
        new THREE.SphereGeometry(0.10, 16, 16),
        new THREE.MeshStandardMaterial({ color: 0x00ffaa, emissive: 0x00ffaa, emissiveIntensity: 0.9 })
      );
      p.visible = false;
      p.userData.offset = offset;
      activeSceneRoot.add(p);
      return p;
    });

    setCard("3D · СЕРДЦЕ И КРУГИ КРОВООБРАЩЕНИЯ", "Нажми «Ввести лекарство в вену руки»", "Или кликай по камерам сердца (синие — венозная кровь, красные — артериальная).", "Ловушка ОГЭ: из вены руки лекарство сначала попадает в правое предсердие.");

    controlsBar.querySelector("#btn-inject").addEventListener("click", () => {
      injecting = true;
      drugT = 0;
      drugParticles.forEach(p => { p.visible = true; });
    });
    controlsBar.querySelector("#btn-reset-inj").addEventListener("click", () => {
      injecting = false;
      drugT = 0;
      drugParticles.forEach(p => { p.visible = false; });
      setCard("3D · СЕРДЦЕ И КРУГИ КРОВООБРАЩЕНИЯ", "Готово к повторному запуску", "Нажми «Ввести лекарство», чтобы снова проследить путь по сосудам.", null);
    });

    let lastStepIdx = -1;
    updateFn = (t, dt) => {
      const beat = 1 + Math.pow(Math.max(0, Math.sin(t * 4.5)), 6) * 0.09;
      heartGroup.scale.set(beat, beat, beat);

      if (injecting) {
        drugT += dt * 0.085;
        if (drugT >= 1) {
          drugT = 1;
          injecting = false;
        }
        drugParticles.forEach(p => {
          const u = Math.max(0, Math.min(1, drugT - p.userData.offset));
          p.position.copy(curve.getPointAt(u));
        });

        let stepIdx = 0;
        for (let i = INJECTION_STEPS.length - 1; i >= 0; i--) {
          if (drugT >= INJECTION_STEPS[i].t) { stepIdx = i; break; }
        }
        if (stepIdx !== lastStepIdx) {
          lastStepIdx = stepIdx;
          const st = INJECTION_STEPS[stepIdx];
          setCard("ПУТЬ ЛЕКАРСТВА В КРОВИ", st.title, st.desc, st.trap);
        }
      }
    };
  }

  // =========================================================================
  // СЦЕНА 3: ЛЁГКИЕ И МЕХАНИЗМ ДЫХАНИЯ (ВДОХ / ВЫДОХ)
  // =========================================================================
  function buildLungsScene() {
    clearScene();
    camera.position.set(0, 0.25, 4.6);
    controls.target.set(0, 0.1, 0);

    let breathing = true;
    let breathPhase = 0;

    controlsBar.innerHTML = `
      <button type="button" class="anat-btn accent" id="btn-breath-toggle">⏸ Пауза дыхания</button>
    `;

    // Трахея с хрящевыми полукольцами
    const tracheaGroup = new THREE.Group();
    activeSceneRoot.add(tracheaGroup);
    const trachTube = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 1.0, 16), new THREE.MeshStandardMaterial({ color: 0x8ecae6, transparent: true, opacity: 0.7 }));
    trachTube.position.set(0, 1.15, 0);
    tracheaGroup.add(trachTube);
    for (let i = 0; i < 8; i++) {
      const ring = new THREE.Mesh(new THREE.TorusGeometry(0.13, 0.022, 8, 20), new THREE.MeshStandardMaterial({ color: 0xdbe9f4 }));
      ring.position.set(0, 0.78 + i * 0.10, 0);
      ring.rotation.x = Math.PI / 2;
      tracheaGroup.add(ring);
    }

    // Главные бронхи
    [-1, 1].forEach(s => {
      const bronchus = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.06, 0.65, 12), new THREE.MeshStandardMaterial({ color: 0x8ecae6 }));
      bronchus.position.set(s * 0.26, 0.56, 0);
      bronchus.rotation.z = -s * 0.78;
      tracheaGroup.add(bronchus);
    });

    // Лёгкие (полупрозрачные, расширяются при вдохе)
    const lungMat = new THREE.MeshStandardMaterial({ color: 0xf29cb0, roughness: 0.4, transparent: true, opacity: 0.75 });
    const leftLung = new THREE.Mesh(new THREE.SphereGeometry(0.62, 24, 20), lungMat);
    leftLung.position.set(-0.68, 0.12, 0);
    const rightLung = new THREE.Mesh(new THREE.SphereGeometry(0.64, 24, 20), lungMat.clone());
    rightLung.position.set(0.68, 0.12, 0);
    activeSceneRoot.add(leftLung, rightLung);

    // Рёбра вокруг лёгких (поднимаются на вдохе)
    const ribsGroup = new THREE.Group();
    activeSceneRoot.add(ribsGroup);
    for (let i = 0; i < 5; i++) {
      const rib = new THREE.Mesh(
        new THREE.TorusGeometry(1.15 - i * 0.04, 0.032, 8, 28, Math.PI * 1.4),
        new THREE.MeshStandardMaterial({ color: 0xebe6d8, transparent: true, opacity: 0.55 })
      );
      rib.position.set(0, 0.60 - i * 0.28, 0);
      rib.rotation.set(Math.PI / 2, 0, Math.PI * 0.8);
      ribsGroup.add(rib);
    }

    // Диафрагма (купол снизу: уплощается на вдохе, поднимается на выдохе)
    const diaphragm = new THREE.Mesh(
      new THREE.SphereGeometry(1.18, 28, 16, 0, Math.PI * 2, 0, Math.PI * 0.45),
      new THREE.MeshStandardMaterial({ color: 0xc84b31, roughness: 0.5, side: THREE.DoubleSide })
    );
    diaphragm.position.set(0, -1.25, 0);
    activeSceneRoot.add(diaphragm);

    // Частицы воздуха (O2 синие на вдохе, CO2 оранжевые на выдохе)
    const airDots = Array.from({ length: 10 }, (_, i) => {
      const m = new THREE.Mesh(new THREE.SphereGeometry(0.055, 10, 10), new THREE.MeshStandardMaterial({ color: 0x56ccf2, emissive: 0x56ccf2, emissiveIntensity: 0.6 }));
      m.userData = { idx: i };
      activeSceneRoot.add(m);
      return m;
    });

    const toggleBtn = controlsBar.querySelector("#btn-breath-toggle");
    toggleBtn.addEventListener("click", () => {
      breathing = !breathing;
      toggleBtn.textContent = breathing ? "⏸ Пауза дыхания" : "▶ Продолжить дыхание";
    });

    let lastInhale = null;
    updateFn = (t, dt) => {
      if (breathing) breathPhase += dt * 1.6;
      const s = (Math.sin(breathPhase) + 1) / 2; // 0 = выдох, 1 = вдох
      const inhaling = Math.cos(breathPhase) >= 0;

      // Лёгкие расширяются на вдохе
      leftLung.scale.set(0.85 + s * 0.22, 1.35 + s * 0.22, 0.82 + s * 0.18);
      rightLung.scale.set(0.88 + s * 0.22, 1.38 + s * 0.22, 0.84 + s * 0.18);

      // Диафрагма: на вдохе (s=1) опускается и уплощается; на выдохе (s=0) купол выше
      diaphragm.scale.set(1, 0.55 - s * 0.35, 1);
      diaphragm.position.y = -1.05 - s * 0.18;

      // Рёбра поднимаются и расширяются на вдохе
      ribsGroup.position.y = s * 0.14;
      ribsGroup.scale.set(1 + s * 0.08, 1, 1 + s * 0.08);

      // Поток воздуха
      airDots.forEach((d, i) => {
        const u = ((breathPhase * 0.4 + i / 10) % 1 + 1) % 1;
        const pos = inhaling ? u : 1 - u;
        d.position.y = 1.65 - pos * 1.45;
        d.position.x = pos > 0.65 ? (i % 2 ? 1 : -1) * (pos - 0.65) * 1.6 : 0;
        const col = inhaling ? 0x56ccf2 : 0xff9f43;
        d.material.color.setHex(col);
        d.material.emissive.setHex(col);
      });

      if (inhaling !== lastInhale) {
        lastInhale = inhaling;
        if (inhaling) {
          setCard("МЕХАНИЗМ ДЫХАНИЯ · ВДОХ", "Вдох (активный процесс)", "Диафрагма сокращается и опускается (становится плоской), рёбра поднимаются, давление в лёгких падает — воздух (O₂) заходит внутрь.", "Ловушка ОГЭ: лёгкие не имеют мышц и расширяются пассивно вслед за грудной клеткой.");
        } else {
          setCard("МЕХАНИЗМ ДЫХАНИЯ · ВЫДОХ", "Выдох (пассивный процесс)", "Диафрагма и межрёберные мышцы расслабляются, диафрагма поднимается куполом, объём грудной клетки уменьшается — воздух (CO₂) выходит.", "Ловушка ОГЭ: дыхательный центр находится в продолговатом мозге и реагирует на избыток CO₂.");
        }
      }
    };
  }

  function switchScene(name) {
    ov.querySelectorAll("[data-scn]").forEach(b => b.classList.toggle("on", b.dataset.scn === name));
    if (name === "heart") buildHeartScene();
    else if (name === "lungs") buildLungsScene();
    else buildBodyScene();
  }

  ov.querySelectorAll("[data-scn]").forEach(btn => {
    btn.addEventListener("click", () => switchScene(btn.dataset.scn));
  });

  // Выбор объекта кликом
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

    const visibleMeshes = clickable.filter(m => m.parent && m.parent.visible);
    const hits = raycaster.intersectObjects(visibleMeshes);
    if (!hits.length) return;

    const hitObj = hits[0].object;
    if (hitObj.userData.customInfo) {
      const info = hitObj.userData.customInfo;
      setCard("3D · КАМЕРА СЕРДЦА", info.name, info.desc, info.trap);
      return;
    }

    const selectedKey = hitObj.userData.key;
    if (!selectedKey || !BODY_INFO[selectedKey]) return;

    clickable.forEach(m => {
      if (m.material && m.material.emissive) {
        m.material.emissive.setHex(m.userData.key === selectedKey ? 0x2e8b57 : 0x000000);
        m.material.emissiveIntensity = m.userData.key === selectedKey ? 0.55 : 0;
      }
    });

    const info = BODY_INFO[selectedKey];
    setCard("3D-АНАТОМИЯ · ОГЭ", info.name, info.desc, info.trap);
    const tg = window.Telegram && window.Telegram.WebApp;
    if (tg && tg.HapticFeedback) tg.HapticFeedback.impactOccurred("light");
  });

  switchScene(initialScene);

  let rafId = 0;
  const clock = new THREE.Clock();
  function animate() {
    rafId = requestAnimationFrame(animate);
    const dt = clock.getDelta();
    const t = clock.getElapsedTime();
    updateFn(t, dt);
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
