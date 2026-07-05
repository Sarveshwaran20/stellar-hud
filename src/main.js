// --- 1. HUD CLOCK ---
function updateClock() {
  const timeDisplay = document.getElementById("time-display");
  const dateDisplay = document.getElementById("date-display");
  const now = new Date();
  timeDisplay.textContent = now.toLocaleTimeString("en-US", { hour12: false });
  dateDisplay.textContent = now
    .toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    })
    .toUpperCase();
}
setInterval(updateClock, 1000);
updateClock();

// --- 2. COMMAND CONSOLE (SEARCH) ---
const searchForm = document.getElementById("search-form");
const searchInput = document.getElementById("search-input");
searchForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const query = searchInput.value.trim();
  if (query) {
    window.location.href = query.startsWith("http")
      ? query
      : `https://www.google.com/search?q=${encodeURIComponent(query)}`;
  }
});

// --- 3. DEEP SPACE COMMS (AUDIO) ---
const commsAudio = document.getElementById("comms-audio");
const toggleCommsBtn = document.getElementById("toggle-comms");
let isCommsPlaying = false;
commsAudio.volume = 0.4;
toggleCommsBtn.addEventListener("click", () => {
  if (isCommsPlaying) {
    commsAudio.pause();
    toggleCommsBtn.textContent = "[ AUDIO ]";
    toggleCommsBtn.style.background = "transparent";
  } else {
    commsAudio.play();
    toggleCommsBtn.textContent = "[ MUTE ]";
    toggleCommsBtn.style.background = "var(--theme)";
    toggleCommsBtn.style.color = "var(--bg)";
  }
  isCommsPlaying = !isCommsPlaying;
});

// --- 4. PRIMARY DIRECTIVE ---
const directiveForm = document.getElementById("directive-form");
const directiveInput = document.getElementById("directive-input");
const directiveDisplay = document.getElementById("directive-display");
const directiveText = document.getElementById("directive-text");
const clearDirectiveBtn = document.getElementById("clear-directive");

function loadDirective() {
  const savedObjective = localStorage.getItem("primaryDirective");
  if (savedObjective) {
    directiveForm.classList.add("hidden");
    directiveDisplay.classList.remove("hidden");
    directiveText.textContent = savedObjective;
  } else {
    directiveForm.classList.remove("hidden");
    directiveDisplay.classList.add("hidden");
  }
}
directiveForm.addEventListener("submit", (e) => {
  e.preventDefault();
  if (directiveInput.value.trim()) {
    localStorage.setItem("primaryDirective", directiveInput.value.trim());
    loadDirective();
    directiveInput.value = "";
  }
});
clearDirectiveBtn.addEventListener("click", () => {
  localStorage.removeItem("primaryDirective");
  loadDirective();
});
loadDirective();

// --- 5. TACTICAL TIMER ---
const timerDisplay = document.getElementById("timer-display");
const timerStartBtn = document.getElementById("timer-start");
const timerResetBtn = document.getElementById("timer-reset");
let timerInterval;
let timeLeft = 25 * 60;
let isTimerRunning = false;

function updateTimerDisplay() {
  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  timerDisplay.textContent = `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;
}
timerStartBtn.addEventListener("click", () => {
  if (isTimerRunning) return;
  isTimerRunning = true;
  timerStartBtn.style.background = "var(--theme)";
  timerStartBtn.style.color = "var(--bg)";
  timerInterval = setInterval(() => {
    if (timeLeft > 0) {
      timeLeft--;
      updateTimerDisplay();
    } else {
      clearInterval(timerInterval);
      isTimerRunning = false;
      timerDisplay.textContent = "00:00";
      timerDisplay.style.color = "var(--danger)";
    }
  }, 1000);
});
timerResetBtn.addEventListener("click", () => {
  clearInterval(timerInterval);
  isTimerRunning = false;
  timeLeft = 25 * 60;
  updateTimerDisplay();
  timerDisplay.style.color = "var(--theme)";
  timerStartBtn.style.background = "transparent";
  timerStartBtn.style.color = "var(--theme)";
});

// --- 6. MISSION LOG ---
const missionLog = document.getElementById("mission-log");
if (localStorage.getItem("missionLogData")) {
  missionLog.value = localStorage.getItem("missionLogData");
}
missionLog.addEventListener("input", () => {
  localStorage.setItem("missionLogData", missionLog.value);
});

// --- 7. SYSTEM DIAGNOSTICS ---
async function initDiagnostics() {
  const batteryEl = document.getElementById("battery-level");
  const networkEl = document.getElementById("network-status");
  if ("getBattery" in navigator) {
    try {
      const battery = await navigator.getBattery();
      const updateBattery = () => {
        batteryEl.textContent = `${Math.round(battery.level * 100)}%${battery.charging ? " [AC]" : ""}`;
      };
      updateBattery();
      battery.addEventListener("levelchange", updateBattery);
      battery.addEventListener("chargingchange", updateBattery);
    } catch (e) {
      batteryEl.textContent = "OFFLINE";
    }
  } else {
    batteryEl.textContent = "UNSUPPORTED";
  }

  const updateNetwork = () => {
    networkEl.textContent = navigator.onLine
      ? `ONLINE ${navigator.connection?.effectiveType ? "(" + navigator.connection.effectiveType.toUpperCase() + ")" : ""}`
      : "CRITICAL: OFFLINE";
  };
  updateNetwork();
  window.addEventListener("online", updateNetwork);
  window.addEventListener("offline", updateNetwork);
}
initDiagnostics();

// --- 8. OPEN-METEO SENSORS ---
async function initEnvironmentalSensors() {
  const coordsEl = document.getElementById("coords-display");
  const tempEl = document.getElementById("temp-display");
  const condEl = document.getElementById("condition-display");
  if ("geolocation" in navigator) {
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude;
        const lon = position.coords.longitude;
        coordsEl.textContent = `${lat.toFixed(4)}°, ${lon.toFixed(4)}°`;
        try {
          const res = await fetch(
            `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true`,
          );
          if (!res.ok) throw new Error();
          const data = await res.json();
          const codes = {
            0: "CLEAR",
            1: "CLEAR",
            2: "PARTLY CLOUDY",
            3: "OVERCAST",
            45: "FOG",
            51: "DRIZZLE",
            61: "RAIN",
            71: "SNOW",
            95: "STORM",
          };
          tempEl.textContent = `${Math.round(data.current_weather.temperature)}°C`;
          condEl.textContent =
            codes[data.current_weather.weathercode] || "ACTIVE";
        } catch (e) {
          tempEl.textContent = "ERR";
          condEl.textContent = "ERR";
        }
      },
      () => {
        coordsEl.textContent = "DENIED";
        tempEl.textContent = "OFFLINE";
        condEl.textContent = "OFFLINE";
      },
    );
  } else {
    coordsEl.textContent = "UNSUPPORTED";
  }
}
initEnvironmentalSensors();

// --- 9. NASA APOD FETCH ---
async function fetchAPOD() {
  const apiKey = import.meta.env.VITE_NASA_API_KEY || "DEMO_KEY";
  const titleEl = document.getElementById("apod-title");
  const descEl = document.getElementById("apod-desc");
  try {
    const res = await fetch(
      `https://api.nasa.gov/planetary/apod?api_key=${apiKey}`,
    );
    if (!res.ok) throw new Error("Key Error");
    const data = await res.json();
    titleEl.textContent = data.title;
    descEl.textContent = data.explanation;
    if (data.media_type === "image")
      document.body.style.backgroundImage = `url('${data.hdurl || data.url}')`;
  } catch (error) {
    titleEl.textContent = "ERROR: SIGNAL LOST";
    descEl.textContent = "Ensure your .env file has a valid NASA API key.";
  }
}
fetchAPOD();

// --- 10. SYSTEM LOCKDOWN ---
const lockdownBtn = document.getElementById("trigger-lockdown");
let isLockdown = false;
lockdownBtn.addEventListener("click", () => {
  isLockdown = !isLockdown;
  document.body.classList.toggle("lockdown-active", isLockdown);
  lockdownBtn.textContent = isLockdown ? "[ OVERRIDE ]" : "[ LOCKDOWN ]";
});

// --- 11. ISS TELEMETRY ---
async function fetchISSTelemetry() {
  const coordsEl = document.getElementById("iss-coords");
  const velEl = document.getElementById("iss-velocity");
  const altEl = document.getElementById("iss-altitude");
  try {
    const res = await fetch("https://api.wheretheiss.at/v1/satellites/25544");
    if (!res.ok) throw new Error();
    const data = await res.json();
    coordsEl.textContent = `${data.latitude.toFixed(2)}°, ${data.longitude.toFixed(2)}°`;
    velEl.textContent = `${Math.round(data.velocity)} KM/H`;
    altEl.textContent = `${Math.round(data.altitude)} KM`;
  } catch (e) {
    coordsEl.textContent = "ERR";
    velEl.textContent = "ERR";
    altEl.textContent = "ERR";
  }
}
fetchISSTelemetry();
setInterval(fetchISSTelemetry, 3000);

// --- 12. ASTEROID TRACKER (NeoWs API) ---
async function fetchAsteroidData() {
  const apiKey = import.meta.env.VITE_NASA_API_KEY || "DEMO_KEY";
  const today = new Date().toISOString().split("T")[0];
  const nameEl = document.getElementById("ast-name");
  const missEl = document.getElementById("ast-miss");
  const velEl = document.getElementById("ast-vel");
  const threatEl = document.getElementById("ast-threat");
  try {
    const res = await fetch(
      `https://api.nasa.gov/neo/rest/v1/feed?start_date=${today}&end_date=${today}&api_key=${apiKey}`,
    );
    if (!res.ok) throw new Error();
    const data = await res.json();
    const asteroids = data.near_earth_objects[today].sort(
      (a, b) =>
        parseFloat(a.close_approach_data[0].miss_distance.kilometers) -
        parseFloat(b.close_approach_data[0].miss_distance.kilometers),
    );
    const closest = asteroids[0];
    nameEl.textContent = closest.name.replace(/[()]/g, "");
    missEl.textContent = `${Math.round(closest.close_approach_data[0].miss_distance.kilometers).toLocaleString()} KM`;
    velEl.textContent = `${Math.round(closest.close_approach_data[0].relative_velocity.kilometers_per_hour).toLocaleString()} KM/H`;
    threatEl.textContent = closest.is_potentially_hazardous_asteroid
      ? "HAZARDOUS"
      : "NOMINAL";
    threatEl.style.color = closest.is_potentially_hazardous_asteroid
      ? "var(--danger)"
      : "var(--theme)";
  } catch (e) {
    nameEl.textContent = "ERR";
    missEl.textContent = "ERR";
    velEl.textContent = "ERR";
    threatEl.textContent = "ERR";
  }
}
fetchAsteroidData();

// --- 13. EJECT SEQUENCE ---
const ejectBtn = document.getElementById("eject-btn");
const ejectOverlay = document.getElementById("eject-overlay");
const rebootBtn = document.getElementById("reboot-btn");
const hudInterface = document.querySelector(".hud-interface");
ejectBtn.addEventListener("click", () => {
  document.body.classList.add("shake");
  ejectBtn.textContent = "INITIATING...";
  setTimeout(() => {
    document.body.classList.remove("shake");
    hudInterface.classList.add("hidden");
    document.body.style.backgroundImage = "none";
    ejectOverlay.classList.remove("hidden");
  }, 2000);
});
rebootBtn.addEventListener("click", () => {
  ejectBtn.textContent = "[ EJECT ]";
  ejectOverlay.classList.add("hidden");
  hudInterface.classList.remove("hidden");
  fetchAPOD();
});
