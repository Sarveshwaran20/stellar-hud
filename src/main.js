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
    if (query.startsWith("http://") || query.startsWith("https://")) {
      window.location.href = query;
    } else {
      window.location.href = `https://www.google.com/search?q=${encodeURIComponent(query)}`;
    }
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
    toggleCommsBtn.textContent = "[ INITIATE AUDIO ]";
    toggleCommsBtn.style.color = "#b026ff";
  } else {
    commsAudio.play();
    toggleCommsBtn.textContent = "[ MUTE SIGNAL ]";
    toggleCommsBtn.style.color = "#fff";
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
  const objective = directiveInput.value.trim();
  if (objective) {
    localStorage.setItem("primaryDirective", objective);
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
  timerStartBtn.style.color = "#fff";

  timerInterval = setInterval(() => {
    if (timeLeft > 0) {
      timeLeft--;
      updateTimerDisplay();
    } else {
      clearInterval(timerInterval);
      isTimerRunning = false;
      timerDisplay.textContent = "00:00";
      timerDisplay.style.color = "#f00";
    }
  }, 1000);
});

timerResetBtn.addEventListener("click", () => {
  clearInterval(timerInterval);
  isTimerRunning = false;
  timeLeft = 25 * 60;
  updateTimerDisplay();
  timerDisplay.style.color = "#ffa500";
  timerStartBtn.style.color = "#ffa500";
});

// --- 6. MISSION LOG ---
const missionLog = document.getElementById("mission-log");
const savedLog = localStorage.getItem("missionLogData");
if (savedLog) {
  missionLog.value = savedLog;
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
      function updateBattery() {
        const level = Math.round(battery.level * 100);
        batteryEl.textContent = `${level}%${battery.charging ? " [AC]" : ""}`;
        batteryEl.style.color = level <= 20 ? "#f00" : "#0ff";
      }
      updateBattery();
      battery.addEventListener("levelchange", updateBattery);
      battery.addEventListener("chargingchange", updateBattery);
    } catch (e) {
      batteryEl.textContent = "SENSOR OFFLINE";
    }
  } else {
    batteryEl.textContent = "UNSUPPORTED";
  }

  function updateNetwork() {
    if (navigator.onLine) {
      const conn = navigator.connection;
      const speed =
        conn && conn.effectiveType
          ? ` (${conn.effectiveType.toUpperCase()})`
          : "";
      networkEl.textContent = `ONLINE${speed}`;
      networkEl.style.color = "#0ff";
    } else {
      networkEl.textContent = "CRITICAL: OFFLINE";
      networkEl.style.color = "#f00";
    }
  }
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
          const response = await fetch(
            `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true`,
          );
          if (!response.ok) throw new Error("API Connection Failed");
          const data = await response.json();

          const weatherCodes = {
            0: "CLEAR SKY",
            1: "MAINLY CLEAR",
            2: "PARTLY CLOUDY",
            3: "OVERCAST",
            45: "FOG",
            51: "LIGHT DRIZZLE",
            61: "LIGHT RAIN",
            63: "MODERATE RAIN",
            71: "SNOW FALL",
            95: "THUNDERSTORM",
          };

          tempEl.textContent = `${Math.round(data.current_weather.temperature)}°C`;
          condEl.textContent =
            weatherCodes[data.current_weather.weathercode] || "ACTIVE";
        } catch (error) {
          tempEl.textContent = "API ERROR";
          tempEl.style.color = "#f00";
          condEl.textContent = "OFFLINE";
          condEl.style.color = "#f00";
        }
      },
      () => {
        coordsEl.textContent = "GPS DENIED";
        coordsEl.style.color = "#f00";
        tempEl.textContent = "OFFLINE";
        condEl.textContent = "OFFLINE";
      },
    );
  } else {
    coordsEl.textContent = "GPS UNSUPPORTED";
    tempEl.textContent = "OFFLINE";
    condEl.textContent = "OFFLINE";
  }
}
initEnvironmentalSensors();

// --- 9. NASA APOD FETCH ---
async function fetchAPOD() {
  const apiKey = import.meta.env.VITE_NASA_API_KEY || "DEMO_KEY";
  const url = `https://api.nasa.gov/planetary/apod?api_key=${apiKey}`;

  const titleEl = document.getElementById("apod-title");
  const descEl = document.getElementById("apod-desc");
  const statusDot = document.querySelector(".pulse-dot");
  const statusText = document.getElementById("system-status-text");

  try {
    const response = await fetch(url);
    const data = await response.json();

    if (!response.ok)
      throw new Error(
        data.error?.message || "Invalid API Key or Rate Limit Reached",
      );

    titleEl.textContent = data.title;
    descEl.textContent = data.explanation;
    if (data.copyright)
      document.getElementById("apod-copyright").textContent =
        `© ${data.copyright}`;

    if (data.media_type === "image") {
      document.body.style.backgroundImage = `url('${data.hdurl || data.url}')`;
    } else {
      document.body.style.backgroundImage = `url('https://images.unsplash.com/photo-1462331940025-496dfbfc7564?q=80&w=2048')`;
      descEl.textContent += "\n\n[MEDIA TYPE: VIDEO - Check NASA APOD Site]";
    }
  } catch (error) {
    statusDot.classList.add("error");
    statusText.textContent = "UPLINK FAILED - CHECK API KEY";
    statusText.style.color = "#f00";
    titleEl.textContent = "ERROR: SIGNAL LOST";
    titleEl.style.color = "#f00";
    descEl.textContent = `SYSTEM ERROR: ${error.message}\n\nEnsure your .env file has a valid NASA API key and you have restarted the server.`;
  }
}

const lockdownBtn = document.getElementById("trigger-lockdown");
let isLockdown = false;
lockdownBtn.addEventListener("click", () => {
  isLockdown = !isLockdown;
  if (isLockdown) {
    document.body.classList.add("lockdown-active");
    lockdownBtn.textContent = "[ OVERRIDE LOCKDOWN ]";
    lockdownBtn.style.color = "#fff";
    lockdownBtn.style.background = "#f00";
  } else {
    document.body.classList.remove("lockdown-active");
    lockdownBtn.textContent = "[ LOCKDOWN ]";
    lockdownBtn.style.color = "#f00";
    lockdownBtn.style.background = "rgba(30, 0, 0, 0.7)";
  }
});

// --- 11. LIVE ISS TELEMETRY ---
async function fetchISSTelemetry() {
  const coordsEl = document.getElementById("iss-coords");
  const velEl = document.getElementById("iss-velocity");
  const altEl = document.getElementById("iss-altitude");

  try {
    const response = await fetch(
      "https://api.wheretheiss.at/v1/satellites/25544",
    );
    if (!response.ok) throw new Error("ISS Feed Offline");

    const data = await response.json();

    coordsEl.textContent = `${data.latitude.toFixed(4)}°, ${data.longitude.toFixed(4)}°`;
    velEl.textContent = `${Math.round(data.velocity)} KM/H`;
    altEl.textContent = `${Math.round(data.altitude)} KM`;
  } catch (error) {
    coordsEl.textContent = "SIGNAL LOST";
    velEl.textContent = "OFFLINE";
    altEl.textContent = "OFFLINE";
  }
}

fetchISSTelemetry();
setInterval(fetchISSTelemetry, 3000);
fetchAPOD();
