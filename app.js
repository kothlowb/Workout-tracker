// App state, rendering, persistence, streaks, notifications.

const STORAGE_KEY = "workoutTrackerData";

function todayStr(d = new Date()) {
  const y = d.getFullYear(), m = String(d.getMonth() + 1).padStart(2, "0"), day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

// Parse "YYYY-MM-DD" as a local-time date (avoids the UTC-midnight shift from new Date(str)).
function parseLocalDate(dateStr) {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(y, m - 1, d);
}

function loadData() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (raw) {
    try { return JSON.parse(raw); } catch (e) { /* fall through to default */ }
  }
  return {
    profile: null,
    log: {},
    currentStreak: 0,
    bestStreak: 0,
    lastNotifiedDate: null
  };
}

function saveData() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

let state = loadData();
let activeView = "today";
let pendingSelection = new Set(); // muscle groups selected today before plan generated

function getDayEntry(dateStr) {
  if (!state.log[dateStr]) {
    state.log[dateStr] = { status: "pending", groups: [], plan: [], reason: null };
  }
  return state.log[dateStr];
}

function recomputeStreaks() {
  const dates = Object.keys(state.log).sort();
  let current = 0, best = 0, running = 0;
  // walk chronologically, only count consecutive calendar days that are "done"
  let prevDate = null;
  for (const d of dates) {
    const entry = state.log[d];
    if (entry.status === "done") {
      if (prevDate) {
        const diffDays = (parseLocalDate(d) - parseLocalDate(prevDate)) / 86400000;
        running = diffDays === 1 ? running + 1 : 1;
      } else {
        running = 1;
      }
      best = Math.max(best, running);
      prevDate = d;
    } else if (entry.status === "missed") {
      running = 0;
      prevDate = null;
    }
    // pending days don't break or extend the chain
  }
  // current streak = trailing run ending at the most recent "done" day, only if unbroken up to today/yesterday
  current = 0;
  let cursor = parseLocalDate(todayStr());
  while (true) {
    const ds = todayStr(cursor);
    const entry = state.log[ds];
    if (entry && entry.status === "done") {
      current++;
      cursor.setDate(cursor.getDate() - 1);
    } else if (entry && entry.status === "missed") {
      break;
    } else {
      // pending/未来/missing day: if it's today, skip without breaking; otherwise stop
      if (ds === todayStr()) {
        cursor.setDate(cursor.getDate() - 1);
        continue;
      }
      break;
    }
  }
  state.currentStreak = current;
  state.bestStreak = Math.max(state.bestStreak, best, current);
}

// ---------- Rendering ----------

function render() {
  const app = document.getElementById("app");
  if (!state.profile) {
    app.innerHTML = renderOnboarding();
    attachOnboardingHandlers();
    document.getElementById("tabbar").style.display = "none";
    return;
  }
  document.getElementById("tabbar").style.display = "flex";
  document.querySelectorAll(".tab-btn").forEach(b => b.classList.toggle("active", b.dataset.view === activeView));

  if (activeView === "today") { app.innerHTML = renderToday(); attachTodayHandlers(); }
  else if (activeView === "history") { app.innerHTML = renderHistory(); }
  else if (activeView === "profile") { app.innerHTML = renderProfile(); attachProfileHandlers(); }
}

function renderOnboarding() {
  const goalOptions = Object.entries(GOAL_LABELS).map(([id, label]) =>
    `<label class="chip-checkbox"><input type="checkbox" value="${id}" name="goal"> ${label}</label>`
  ).join("");
  return `
  <div class="onboarding">
    <h1>Welcome 💪</h1>
    <p class="muted">Let's set up your profile so your workouts can be tailored to you.</p>
    <form id="onboarding-form">
      <label>Name <input type="text" name="name" required></label>
      <label>Height (e.g. 5'10") <input type="text" name="height" required></label>
      <label>Weight (lbs) <input type="number" name="weight" required></label>
      <label>Age <input type="number" name="age" required></label>
      <fieldset>
        <legend>Goals (select any)</legend>
        ${goalOptions}
      </fieldset>
      <button type="submit" class="btn-primary">Get Started</button>
    </form>
  </div>`;
}

function attachOnboardingHandlers() {
  document.getElementById("onboarding-form").addEventListener("submit", e => {
    e.preventDefault();
    const f = e.target;
    const goals = Array.from(f.querySelectorAll("input[name=goal]:checked")).map(i => i.value);
    state.profile = {
      name: f.name.value.trim(),
      height: f.height.value.trim(),
      weight: f.weight.value.trim(),
      age: f.age.value.trim(),
      goals
    };
    saveData();
    requestNotificationPermission();
    render();
  });
}

function renderToday() {
  const dateStr = todayStr();
  const entry = getDayEntry(dateStr);
  const weekNum = isoWeekNumber(new Date());
  const dayName = new Date().toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" });
  const absBlock = getAbsBlock(weekNum);

  let body = "";
  if (entry.status === "missed") {
    body = `<div class="card missed-card">
      <div class="status-badge missed">Missed</div>
      <p>Reason: <strong>${formatReason(entry.reason)}</strong></p>
      <p class="muted">No worries — tomorrow's a fresh start.</p>
    </div>`;
  } else if (entry.status === "done") {
    body = `<div class="card done-card">
      <div class="status-badge done">Completed ✅</div>
      <p>Groups trained: <strong>${entry.groups.map(g => MUSCLE_GROUPS[g]?.label || g).join(", ") || "—"}</strong></p>
      ${renderPlanList(entry.plan)}
    </div>`;
  } else if (entry.plan && entry.plan.length) {
    body = `
      <div class="card">
        <h3>Warm-up & Abs</h3>
        ${renderAbsList(absBlock)}
      </div>
      <div class="card">
        <h3>Today's Plan</h3>
        ${renderPlanList(entry.plan)}
      </div>
      <div class="action-row">
        <button id="btn-complete" class="btn-primary">Mark Complete</button>
        <button id="btn-missed" class="btn-secondary">Mark Missed</button>
      </div>`;
  } else {
    body = `
      <div class="card">
        <h3>Warm-up & Abs</h3>
        ${renderAbsList(absBlock)}
      </div>
      <div class="card">
        <h3>Choose Today's Muscle Groups</h3>
        <p class="muted">Pick any combination — nothing is ever locked out.</p>
        <div class="chip-grid">
          ${MUSCLE_GROUP_ORDER.map(gid => `
            <button class="chip ${pendingSelection.has(gid) ? "selected" : ""}" data-group="${gid}">
              ${MUSCLE_GROUPS[gid].label}
            </button>`).join("")}
        </div>
        <button id="btn-generate" class="btn-primary" ${pendingSelection.size === 0 ? "disabled" : ""}>Generate Plan</button>
      </div>
      <div class="action-row">
        <button id="btn-missed" class="btn-secondary">Mark Missed</button>
      </div>`;
  }

  return `
    <header class="topbar">
      <div>
        <h2>${dayName}</h2>
        <p class="muted">Hi ${state.profile.name || "there"} 👋</p>
      </div>
      <div class="streak-pill">🔥 ${state.currentStreak} day streak</div>
    </header>
    ${body}
    ${renderMissModal()}
    ${renderLightbox()}
  `;
}

function renderLightbox() {
  return `
  <div id="lightbox-modal" class="modal hidden">
    <div class="lightbox-content">
      <img id="lightbox-img" src="" alt="">
      <p id="lightbox-caption" class="muted"></p>
      <button id="lightbox-close" class="btn-secondary">Close</button>
    </div>
  </div>`;
}

function renderThumb(exerciseName) {
  const url = getExerciseImage(exerciseName);
  if (!url) return `<div class="ex-thumb ex-thumb-empty">No image</div>`;
  return `<img class="ex-thumb" src="${url}" alt="${exerciseName}" loading="lazy" data-fullsrc="${url}" data-name="${exerciseName}">`;
}

function renderAbsList(absBlock) {
  return `<ul class="exercise-list">
    <li class="ex-row">
      ${renderThumb("Dynamic warm-up stretch (full body)")}
      <div class="ex-text">Dynamic warm-up stretch (full body) — 10 min</div>
    </li>
    ${absBlock.map(a => `
    <li class="ex-row">
      ${renderThumb(a)}
      <div class="ex-text">${a} — 3 sets</div>
    </li>`).join("")}
  </ul>`;
}

function renderPlanList(plan) {
  if (!plan || !plan.length) return "<p class=\"muted\">No exercises.</p>";
  return `<ul class="exercise-list">
    ${plan.map(p => `
    <li class="ex-row">
      ${renderThumb(p.exercise)}
      <div class="ex-text">
        <span class="group-tag">${MUSCLE_GROUPS[p.group]?.label || p.group}</span>
        ${p.exercise} — ${p.duration ? p.duration : `${p.sets} sets x ${p.reps} reps (rest ${p.rest})`}
      </div>
    </li>`).join("")}
  </ul>`;
}

function renderMissModal() {
  return `
  <div id="miss-modal" class="modal hidden">
    <div class="modal-content">
      <h3>Why'd you miss today?</h3>
      <div class="reason-grid">
        ${MISS_REASONS.map(r => `<button class="reason-btn" data-reason="${r.id}">${r.label}</button>`).join("")}
      </div>
      <input id="other-reason-input" type="text" placeholder="Describe..." class="hidden">
      <div class="modal-actions">
        <button id="miss-cancel" class="btn-secondary">Cancel</button>
        <button id="miss-confirm" class="btn-primary" disabled>Confirm</button>
      </div>
    </div>
  </div>`;
}

function formatReason(reason) {
  if (!reason) return "—";
  if (reason.startsWith("other:")) return reason.slice(6) || "Other";
  const found = MISS_REASONS.find(r => r.id === reason);
  return found ? found.label : reason;
}

function attachTodayHandlers() {
  document.querySelectorAll(".ex-thumb[data-fullsrc]").forEach(img => {
    img.addEventListener("click", () => {
      document.getElementById("lightbox-img").src = img.dataset.fullsrc;
      document.getElementById("lightbox-caption").textContent = img.dataset.name;
      document.getElementById("lightbox-modal").classList.remove("hidden");
    });
  });
  const lightboxClose = document.getElementById("lightbox-close");
  if (lightboxClose) lightboxClose.addEventListener("click", () => {
    document.getElementById("lightbox-modal").classList.add("hidden");
  });

  document.querySelectorAll(".chip[data-group]").forEach(btn => {
    btn.addEventListener("click", () => {
      const gid = btn.dataset.group;
      if (pendingSelection.has(gid)) pendingSelection.delete(gid); else pendingSelection.add(gid);
      render();
    });
  });

  const genBtn = document.getElementById("btn-generate");
  if (genBtn) genBtn.addEventListener("click", () => {
    const dateStr = todayStr();
    const entry = getDayEntry(dateStr);
    const weekNum = isoWeekNumber(new Date());
    entry.groups = Array.from(pendingSelection);
    entry.plan = generatePlan(entry.groups, state.profile.goals, weekNum);
    saveData();
    render();
  });

  const completeBtn = document.getElementById("btn-complete");
  if (completeBtn) completeBtn.addEventListener("click", () => {
    const entry = getDayEntry(todayStr());
    entry.status = "done";
    recomputeStreaks();
    saveData();
    pendingSelection = new Set();
    render();
  });

  const missedBtn = document.getElementById("btn-missed");
  if (missedBtn) missedBtn.addEventListener("click", () => openMissModal());

  const cancelBtn = document.getElementById("miss-cancel");
  if (cancelBtn) cancelBtn.addEventListener("click", () => closeMissModal());

  let chosenReason = null;
  document.querySelectorAll(".reason-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".reason-btn").forEach(b => b.classList.remove("selected"));
      btn.classList.add("selected");
      chosenReason = btn.dataset.reason;
      const otherInput = document.getElementById("other-reason-input");
      if (chosenReason === "other") {
        otherInput.classList.remove("hidden");
        otherInput.focus();
      } else {
        otherInput.classList.add("hidden");
      }
      document.getElementById("miss-confirm").disabled = false;
    });
  });

  const confirmBtn = document.getElementById("miss-confirm");
  if (confirmBtn) confirmBtn.addEventListener("click", () => {
    const entry = getDayEntry(todayStr());
    if (chosenReason === "other") {
      const text = document.getElementById("other-reason-input").value.trim();
      entry.reason = `other:${text}`;
    } else {
      entry.reason = chosenReason;
    }
    entry.status = "missed";
    recomputeStreaks();
    saveData();
    closeMissModal();
    pendingSelection = new Set();
    render();
  });
}

function openMissModal() { document.getElementById("miss-modal").classList.remove("hidden"); }
function closeMissModal() { document.getElementById("miss-modal").classList.add("hidden"); }

function renderHistory() {
  const dates = Object.keys(state.log).sort().reverse();
  if (!dates.length) {
    return `<header class="topbar"><h2>History</h2></header><p class="muted" style="padding:0 16px">No logged days yet — get started on the Today tab!</p>`;
  }
  const rows = dates.map(d => {
    const entry = state.log[d];
    const dateLabel = new Date(d + "T00:00:00").toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
    if (entry.status === "done") {
      return `<div class="history-row done">
        <div class="history-date">${dateLabel}</div>
        <div class="history-detail">✅ ${entry.groups.map(g => MUSCLE_GROUPS[g]?.label || g).join(", ") || "Workout"}</div>
      </div>`;
    } else if (entry.status === "missed") {
      return `<div class="history-row missed">
        <div class="history-date">${dateLabel}</div>
        <div class="history-detail">❌ ${formatReason(entry.reason)}</div>
      </div>`;
    } else {
      return `<div class="history-row pending">
        <div class="history-date">${dateLabel}</div>
        <div class="history-detail">— pending</div>
      </div>`;
    }
  }).join("");
  return `
    <header class="topbar"><h2>History</h2><div class="streak-pill">🏆 Best: ${state.bestStreak}</div></header>
    <div class="history-list">${rows}</div>`;
}

function renderProfile() {
  const p = state.profile;
  const goalOptions = Object.entries(GOAL_LABELS).map(([id, label]) =>
    `<label class="chip-checkbox"><input type="checkbox" value="${id}" name="goal" ${p.goals.includes(id) ? "checked" : ""}> ${label}</label>`
  ).join("");
  return `
    <header class="topbar"><h2>Profile</h2></header>
    <div class="card">
      <form id="profile-form">
        <label>Name <input type="text" name="name" value="${p.name}" required></label>
        <label>Height <input type="text" name="height" value="${p.height}" required></label>
        <label>Weight (lbs) <input type="number" name="weight" value="${p.weight}" required></label>
        <label>Age <input type="number" name="age" value="${p.age}" required></label>
        <fieldset>
          <legend>Goals</legend>
          ${goalOptions}
        </fieldset>
        <button type="submit" class="btn-primary">Save Changes</button>
      </form>
    </div>`;
}

function attachProfileHandlers() {
  document.getElementById("profile-form").addEventListener("submit", e => {
    e.preventDefault();
    const f = e.target;
    const goals = Array.from(f.querySelectorAll("input[name=goal]:checked")).map(i => i.value);
    state.profile = {
      name: f.name.value.trim(),
      height: f.height.value.trim(),
      weight: f.weight.value.trim(),
      age: f.age.value.trim(),
      goals
    };
    saveData();
    alert("Profile updated!");
    render();
  });
}

// ---------- Tab navigation ----------
document.querySelectorAll(".tab-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    activeView = btn.dataset.view;
    render();
  });
});

// ---------- Notifications ----------
function requestNotificationPermission() {
  if ("Notification" in window && Notification.permission === "default") {
    Notification.requestPermission();
  }
}

function maybeSendGuiltNotification() {
  if (!("Notification" in window) || Notification.permission !== "granted") return;
  const ds = todayStr();
  const entry = state.log[ds];
  if (entry && entry.status === "done") return;
  if (state.lastNotifiedDate === ds) return;
  const hour = new Date().getHours();
  if (hour < 19) return; // only nudge in the evening
  const streak = state.currentStreak;
  const msg = streak > 0
    ? `You're about to lose your ${streak}-day streak. Get today's workout in!`
    : `Haven't logged today's workout yet — don't let today slip.`;
  new Notification("Forge — Don't skip today", { body: msg });
  state.lastNotifiedDate = ds;
  saveData();
}

setInterval(maybeSendGuiltNotification, 5 * 60 * 1000);

// ---------- Service worker ----------
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("sw.js").catch(() => {});
  });
}

// ---------- Init ----------
recomputeStreaks();
render();
maybeSendGuiltNotification();
