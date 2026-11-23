(() => {
  const STORAGE_KEY = "bio_oge_botanica_v1";
  let progress = {};
  try {
    progress = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
  } catch (e) {
    progress = {};
  }

  function saveProgress() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
    } catch (e) {}
  }

  const tg = window.Telegram && window.Telegram.WebApp;
  if (tg) {
    tg.ready();
    tg.expand();
  }

  let currentTab = "modules";
  let activeView = null; // null | "theory" | "quiz"
  let activeTopic = null;
  let searchQuery = "";
  let onlyReady = false;
  let quizState = { idx: 0, score: 0, answered: false };

  const vModules = document.getElementById("view-modules");
  const vChecklist = document.getElementById("view-checklist");
  const vExam = document.getElementById("view-exam");
  const vTheory = document.getElementById("view-theory");
  const vQuiz = document.getElementById("view-quiz");
  const progBox = document.getElementById("prog-box");
  const toolbar = document.getElementById("toolbar");
  const searchIn = document.getElementById("search-in");
  const filterReadyBtn = document.getElementById("filter-ready");
  const toastEl = document.getElementById("toast");
  let toastTimer = 0;

  function showToast(msg) {
    toastEl.textContent = msg;
    toastEl.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { toastEl.hidden = true; }, 3500);
  }

  document.querySelectorAll("[data-tab]").forEach(btn => {
    btn.addEventListener("click", () => {
      currentTab = btn.dataset.tab;
      activeView = null;
      activeTopic = null;
      document.querySelectorAll("[data-tab]").forEach(b => b.setAttribute("aria-pressed", b.dataset.tab === currentTab));
      render();
    });
  });

  searchIn.addEventListener("input", () => {
    searchQuery = searchIn.value.trim().toLowerCase();
    render();
  });

  filterReadyBtn.addEventListener("click", () => {
    onlyReady = !onlyReady;
    filterReadyBtn.setAttribute("aria-pressed", String(onlyReady));
    render();
  });

  function findTopic(id) {
    for (const sec of OGE_DATA.sections) {
      const found = sec.topics.find(t => t.id === id);
      if (found) return found;
    }
    return null;
  }

  function renderProgressBar() {
    const allTopics = OGE_DATA.sections.flatMap(s => s.topics);
    const total = allTopics.length;
    const learned = allTopics.filter(t => progress[t.id]?.learned).length;
    const repeated = allTopics.filter(t => progress[t.id]?.repeated).length;
    const pct = total ? Math.round((learned / total) * 100) : 0;

    const badge = document.getElementById("topic-count-badge");
    if (badge) badge.textContent = `${total} тем`;

    progBox.innerHTML = `
      <div class="prog-top">
        <span>Изучено (теория): ${learned} из ${total} (${pct}%)</span>
        <span style="color: var(--ok)">Повторено (тесты): ${repeated}</span>
      </div>
      <div class="bar"><i style="width: ${pct}%"></i></div>
    `;
  }

  function filterTopics(topics) {
    return topics.filter(t => {
      if (onlyReady && currentTab === "modules" && !t.ready) return false;
      if (searchQuery) {
        const hay = (t.title + " " + (t.desc || "")).toLowerCase();
        if (!hay.includes(searchQuery)) return false;
      }
      return true;
    });
  }

  function render() {
    renderProgressBar();
    const inSubView = !!activeView;
    progBox.hidden = inSubView;
    toolbar.hidden = inSubView || currentTab === "exam";
    filterReadyBtn.hidden = currentTab !== "modules";

    vModules.hidden = currentTab !== "modules" || inSubView;
    vChecklist.hidden = currentTab !== "checklist" || inSubView;
    vExam.hidden = currentTab !== "exam" || inSubView;
    vTheory.hidden = activeView !== "theory";
    vQuiz.hidden = activeView !== "quiz";

    if (activeView === "theory") return renderTheory();
    if (activeView === "quiz") return renderQuiz();
    if (currentTab === "modules") renderModules();
    if (currentTab === "checklist") renderChecklist();
    if (currentTab === "exam") renderExamTable();
  }

  function renderModules() {
    const html = OGE_DATA.sections.map(sec => {
      const list = filterTopics(sec.topics);
      if (!list.length) return "";
      return `
        <div class="sec">
          <div class="sec-head">
            <h2>${sec.title}</h2>
            <span class="sec-tasks">${sec.tasksHint}</span>
          </div>
          <div class="grid">
            ${list.map(t => {
              const st = progress[t.id] || {};
              return `
                <div class="card ${t.ready ? "ready" : ""}">
                  <div class="card-title">${t.title}</div>
                  <p class="card-desc">${t.desc}</p>
                  <div class="card-foot">
                    <div class="statuses">
                      <span class="st-pill ${st.learned ? "ok" : ""}">${st.learned ? "✓ Изучено" : "○ Теория"}</span>
                      <span class="st-pill ${st.repeated ? "ok" : ""}">${st.repeated ? "✓ Повторено" : "○ Тест"}</span>
                    </div>
                    <div class="card-acts">
                      ${t.ready ? `
                        <button type="button" class="btn" data-theory="${t.id}">Теория</button>
                        <button type="button" class="btn primary" data-quiz="${t.id}">Тест (${t.questions.length})</button>
                      ` : `<button type="button" class="btn" disabled>Скоро</button>`}
                    </div>
                  </div>
                </div>
              `;
            }).join("")}
          </div>
        </div>
      `;
    }).join("");

    vModules.innerHTML = html || `<div class="card"><p class="card-desc">По запросу ничего не найдено.</p></div>`;
    wireEvents(vModules);
  }

  function renderChecklist() {
    const html = OGE_DATA.sections.map(sec => {
      const list = filterTopics(sec.topics);
      if (!list.length) return "";
      return `
        <div class="sec">
          <div class="sec-head">
            <h2>${sec.title}</h2>
            <span class="sec-tasks">${list.length} тем</span>
          </div>
          <div class="card">
            ${list.map(t => {
              const st = progress[t.id] || {};
              return `
                <div class="chk-row">
                  <span class="chk-name ${st.learned && st.repeated ? "done" : ""}">${t.title}</span>
                  <div class="statuses" style="flex:none;">
                    <span class="st-pill ${st.learned ? "ok" : ""}">${st.learned ? "✓ Изуч." : "Изуч."}</span>
                    <span class="st-pill ${st.repeated ? "ok" : ""}">${st.repeated ? "✓ Повт." : "Повт."}</span>
                  </div>
                </div>
              `;
            }).join("")}
          </div>
        </div>
      `;
    }).join("");

    vChecklist.innerHTML = html || `<div class="card"><p class="card-desc">Ничего не найдено.</p></div>`;
  }

  function renderExamTable() {
    vExam.innerHTML = `
      <div class="sec">
        <div class="sec-head"><h2>В каких заданиях ОГЭ встречается раздел</h2></div>
        <table class="oge-table">
          <thead>
            <tr><th>Раздел</th><th>Обязательно</th><th>Возможно</th></tr>
          </thead>
          <tbody>
            ${OGE_DATA.examMap.map(r => `
              <tr>
                <td><b>${r.section}</b></td>
                <td>${r.must}</td>
                <td style="color:var(--ink-2)">${r.maybe}</td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      </div>
    `;
  }

  function renderTheory() {
    const t = activeTopic;
    const st = progress[t.id] || {};
    vTheory.innerHTML = `
      <div style="margin-bottom:12px;">
        <button type="button" class="btn" id="th-back">← Назад к темам</button>
      </div>
      <div class="sheet">
        <span class="badge" style="margin-bottom:10px; display:inline-block;">Теория · ОГЭ</span>
        <h2 class="q-title">${t.title}</h2>
        <div class="theory-body">${t.theory || `<p>${t.desc}</p>`}</div>
        <div style="display:flex; flex-wrap:wrap; gap:8px; margin-top:20px; padding-top:14px; border-top:1px dashed var(--line);">
          <button type="button" class="btn primary" id="th-done" style="flex:1; padding:12px;">
            ${st.learned ? "✓ Теория изучена — перейти к тесту" : "Я прочитал(а) теорию ✓ (отметить изученным)"}
          </button>
        </div>
      </div>
    `;

    document.getElementById("th-back").addEventListener("click", () => {
      activeView = null; activeTopic = null; render();
    });

    document.getElementById("th-done").addEventListener("click", () => {
      progress[t.id] = { ...(progress[t.id] || {}), learned: true };
      saveProgress();
      if (tg && tg.HapticFeedback) tg.HapticFeedback.notificationOccurred("success");
      showToast("Галочка «Изучено» поставлена! Теперь закрепи тему в тесте.");
      activeView = "quiz";
      quizState = { idx: 0, score: 0, answered: false };
      render();
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  }

  function renderQuiz() {
    const qList = activeTopic.questions;
    if (quizState.idx >= qList.length) {
      const pct = Math.round((quizState.score / qList.length) * 100);
      const passed = pct >= 75;
      if (passed) {
        progress[activeTopic.id] = { ...(progress[activeTopic.id] || {}), repeated: true };
        saveProgress();
      }
      vQuiz.innerHTML = `
        <div class="sheet">
          <span class="badge">${passed ? "Тест сдан ✓" : "Нужно ещё потренироваться"}</span>
          <h2 class="q-title" style="margin-top:10px;">Результат: ${quizState.score} из ${qList.length} (${pct}%)</h2>
          <p style="color:var(--ink-2)">
            ${passed
              ? "Отлично! Галочка «Повторено» автоматически поставлена в твой чек-лист."
              : "Чтобы получить галочку «Повторено», нужно ответить верно минимум на 75% вопросов. Повтори теорию и попробуй ещё раз."}
          </p>
          <div style="display:flex; flex-wrap:wrap; gap:8px; margin-top:16px;">
            <button type="button" class="btn primary" id="q-retry">Пройти ещё раз</button>
            <button type="button" class="btn" id="q-theory">Открыть теорию</button>
            <button type="button" class="btn" id="q-back">← К темам</button>
          </div>
        </div>
      `;
      document.getElementById("q-retry").addEventListener("click", () => {
        quizState = { idx: 0, score: 0, answered: false };
        renderQuiz();
      });
      document.getElementById("q-theory").addEventListener("click", () => {
        activeView = "theory";
        render();
      });
      document.getElementById("q-back").addEventListener("click", () => {
        activeView = null; activeTopic = null; render();
      });
      return;
    }

    const item = qList[quizState.idx];
    const shuffled = item.options
      .map((text, idx) => ({ text, isCorrect: idx === item.correct }))
      .sort(() => Math.random() - 0.5);

    vQuiz.innerHTML = `
      <div style="margin-bottom:12px;">
        <button type="button" class="btn" id="q-exit">← Назад к темам</button>
      </div>
      <div class="sheet">
        <div style="display:flex; justify-content:space-between; font:600 12px var(--font-mono); color:var(--ink-2); margin-bottom:10px;">
          <span>${activeTopic.title}</span>
          <span>Вопрос ${quizState.idx + 1} из ${qList.length}</span>
        </div>
        <h3 class="q-title">${item.q}</h3>
        <div class="opts">
          ${shuffled.map((opt, i) => `<button type="button" class="opt" data-opt="${i}">${opt.text}</button>`).join("")}
        </div>
        <div id="q-feedback"></div>
      </div>
    `;

    document.getElementById("q-exit").addEventListener("click", () => {
      activeView = null; activeTopic = null; render();
    });

    vQuiz.querySelectorAll("[data-opt]").forEach(btn => {
      btn.addEventListener("click", () => {
        if (quizState.answered) return;
        quizState.answered = true;
        const chosen = +btn.dataset.opt;
        const isCorrect = shuffled[chosen].isCorrect;
        if (isCorrect) quizState.score++;

        if (tg && tg.HapticFeedback) {
          tg.HapticFeedback.notificationOccurred(isCorrect ? "success" : "error");
        }

        vQuiz.querySelectorAll("[data-opt]").forEach((b, i) => {
          b.disabled = true;
          if (shuffled[i].isCorrect) b.classList.add("good");
          else if (i === chosen) b.classList.add("bad");
        });

        document.getElementById("q-feedback").innerHTML = `
          ${item.trap ? `<div class="trap"><b>Ловушка ОГЭ</b>${item.trap}</div>` : ""}
          <button type="button" class="btn primary" id="q-next" style="margin-top:14px; width:100%; padding:12px;">
            ${quizState.idx + 1 < qList.length ? "Следующий вопрос →" : "Завершить тест"}
          </button>
        `;
        document.getElementById("q-next").addEventListener("click", () => {
          quizState.idx++;
          quizState.answered = false;
          renderQuiz();
        });
      });
    });
  }

  function wireEvents(container) {
    container.querySelectorAll("[data-theory]").forEach(btn => {
      btn.addEventListener("click", () => {
        const found = findTopic(btn.dataset.theory);
        if (found) {
          activeTopic = found;
          activeView = "theory";
          render();
          window.scrollTo({ top: 0, behavior: "smooth" });
        }
      });
    });

    container.querySelectorAll("[data-quiz]").forEach(btn => {
      btn.addEventListener("click", () => {
        const found = findTopic(btn.dataset.quiz);
        if (found) {
          activeTopic = found;
          activeView = "quiz";
          quizState = { idx: 0, score: 0, answered: false };
          render();
          window.scrollTo({ top: 0, behavior: "smooth" });
        }
      });
    });
  }

  render();
})();
