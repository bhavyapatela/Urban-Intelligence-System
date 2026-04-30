const API_BASE_URL = "http://127.0.0.1:8000";

// Global state
let weatherChart, pollutionChart, trafficChart;
let map, heatLayer, userMarker;
let currentLocation = {
  lat: 28.6139,
  lon: 77.2090,
  label: "Delhi (Default)"
};

/**
 * Initialize the Dashboard
 */
async function initDashboard() {
  console.log("Initializing Dashboard...");
  
  // 1. Get user location first
  await fetchUserLocation();
  
  // 2. Initialize UI components
  initMap();
  initCharts();
  
  // 3. Initial data load
  await loadDashboardData();
  
  // Refresh data every 30 seconds
  setInterval(loadDashboardData, 30000);
}

/**
 * Fetch User Location via Browser Geolocation
 */
async function fetchUserLocation() {
  const labelEl = document.getElementById("current-location-label");
  
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      console.warn("Geolocation not supported. Falling back to Delhi.");
      resolve();
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        currentLocation.lat = position.coords.latitude;
        currentLocation.lon = position.coords.longitude;
        currentLocation.label = "Your Location";
        
        // Optional: Try reverse geocoding to get city name
        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${currentLocation.lat}&lon=${currentLocation.lon}&format=json`);
          const data = await res.json();
          if (data.address) {
            currentLocation.label = data.address.city || data.address.town || data.address.village || "Your Location";
          }
        } catch (e) {
          console.warn("Reverse geocoding failed:", e);
        }

        labelEl.innerText = `Location: ${currentLocation.label}`;
        resolve();
      },
      (error) => {
        console.warn(`Geolocation error (${error.code}): ${error.message}. Falling back to Delhi.`);
        labelEl.innerText = `Location: Delhi (Default)`;
        resolve();
      },
      { timeout: 10000 }
    );
  });
}

/**
 * Leaflet Map Initialization
 */
function initMap() {
  const cityCoords = [currentLocation.lat, currentLocation.lon];
  
  map = L.map('map').setView(cityCoords, 12);

  // Dark Mode Tiles
  L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
    attribution: '&copy; OpenStreetMap contributors &copy; CARTO'
  }).addTo(map);

  // Heatmap Data (Centered around current location)
  const heatPoints = [
    [currentLocation.lat, currentLocation.lon, 0.8],
    [currentLocation.lat + 0.01, currentLocation.lon + 0.01, 0.9],
    [currentLocation.lat - 0.02, currentLocation.lon + 0.03, 0.6],
    [currentLocation.lat + 0.03, currentLocation.lon - 0.01, 0.7],
    [currentLocation.lat - 0.01, currentLocation.lon - 0.02, 0.5],
    [currentLocation.lat + 0.02, currentLocation.lon - 0.03, 0.6]
  ];

  heatLayer = L.heatLayer(heatPoints, { radius: 25, blur: 15, maxZoom: 17 }).addTo(map);
  
  // Add a marker for "Current Location"
  userMarker = L.marker(cityCoords).addTo(map)
    .bindPopup(`<b>${currentLocation.label}</b><br>Fetching live data...`)
    .openPopup();
}

/**
 * Chart.js Initialization
 */
function initCharts() {
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false }
    },
    scales: {
      y: {
        grid: { color: 'rgba(255, 255, 255, 0.05)' },
        ticks: { color: '#94a3b8' }
      },
      x: {
        grid: { display: false },
        ticks: { color: '#94a3b8' }
      }
    }
  };

  // Weather Chart
  const ctxWeather = document.getElementById('weatherChart').getContext('2d');
  weatherChart = new Chart(ctxWeather, {
    type: 'line',
    data: {
      labels: [],
      datasets: [
        {
          label: 'Temp (°C)',
          data: [],
          borderColor: '#38bdf8',
          backgroundColor: 'rgba(56, 189, 248, 0.1)',
          fill: true,
          tension: 0.4
        },
        {
          label: 'Humidity (%)',
          data: [],
          borderColor: '#22c55e',
          backgroundColor: 'transparent',
          fill: false,
          tension: 0.4,
          hidden: true
        }
      ]
    },
    options: chartOptions
  });

  // Pollution Chart
  const ctxPollution = document.getElementById('pollutionChart').getContext('2d');
  pollutionChart = new Chart(ctxPollution, {
    type: 'bar',
    data: {
      labels: [],
      datasets: [{
        label: 'AQI Index',
        data: [],
        backgroundColor: '#38bdf8',
        borderRadius: 5
      }]
    },
    options: chartOptions
  });

  // Traffic Chart
  const ctxTraffic = document.getElementById('trafficChart').getContext('2d');
  trafficChart = new Chart(ctxTraffic, {
    type: 'line',
    data: {
      labels: Array.from({length: 24}, (_, i) => `${i}:00`),
      datasets: [{
        label: 'Congestion Index',
        data: [],
        borderColor: '#f59e0b',
        borderWidth: 2,
        pointRadius: 0,
        fill: false,
        tension: 0.4
      }]
    },
    options: {
      ...chartOptions,
      scales: {
        ...chartOptions.scales,
        y: { ...chartOptions.scales.y, max: 1, min: 0 }
      }
    }
  });
}

/**
 * Generate mock traffic data for 24 hours
 */
function generateMockTrafficData() {
  const data = [];
  for (let i = 0; i < 24; i++) {
    // Peak hours at 8-9am and 5-6pm
    if ((i >= 8 && i <= 10) || (i >= 17 && i <= 19)) {
      data.push(0.7 + Math.random() * 0.3);
    } else if (i >= 0 && i <= 5) {
      data.push(0.1 + Math.random() * 0.1);
    } else {
      data.push(0.3 + Math.random() * 0.3);
    }
  }
  return data;
}

/**
 * Fetch and display real-time dashboard data
 */
async function loadDashboardData() {
  const refreshBtn = document.getElementById("refresh-btn");
  if (refreshBtn) refreshBtn.classList.add("loading");

  console.log("Loading Dashboard Data for:", currentLocation.label);

  try {
    // 1. Fetch current data from Backend
    const backendPromise = fetch(`${API_BASE_URL}/predict-aqi?lat=${currentLocation.lat}&lon=${currentLocation.lon}`)
      .then(res => res.ok ? res.json() : Promise.reject("Backend Error"));

    // 2. Fetch Weather Trends (Open-Meteo)
    const weatherTrendsPromise = fetchWeatherTrends();

    // 3. Fetch AQI Trends (Open-Meteo Air Quality)
    const aqiTrendsPromise = fetchAQITrends();

    // Wait for all to complete
    const [backendData, weatherTrends, aqiTrends] = await Promise.allSettled([
      backendPromise,
      weatherTrendsPromise,
      aqiTrendsPromise
    ]);

    // --- Update UI with Backend Data ---
    if (backendData.status === "fulfilled") {
      const data = backendData.value;
      console.log("AQI Backend Data Loaded:", data);
      
      document.getElementById("aqi").innerText = data.predicted_aqi || "0";
      updateAQIStatus(data.predicted_aqi);
      
      document.getElementById("temperature").innerText = 
        data.temperature ? `${data.temperature.toFixed(1)}°C` : "--";
      document.getElementById("humidity").innerText = 
        data.humidity ? `${data.humidity.toFixed(1)}%` : "--";
      
      const trafficVal = data.traffic || 0.3; // Default if not in response
      document.getElementById("traffic").innerText = getTrafficLabel(trafficVal);
      updateTrafficStatus(trafficVal);

      if (userMarker) {
        userMarker.setPopupContent(`<b>${currentLocation.label}</b><br>AQI: ${data.predicted_aqi} (${data.category})<br>Temp: ${data.temperature}°C`);
      }
      
      // Update Traffic Chart with semi-real data (based on current hour)
      updateTrafficChart();
    } else {
      console.warn("Backend unavailable, using fallback for cards");
      showFallbackData();
    }

    // --- Update Weather Chart ---
    if (weatherTrends.status === "fulfilled") {
      updateWeatherChart(weatherTrends.value);
      console.log("Weather API data loaded");
      console.log("Chart updated from API: Weather");
    } else {
      console.error("Weather Trends API failed:", weatherTrends.reason);
      document.getElementById("weather-status").innerText = "API unavailable";
      document.getElementById("weather-status").classList.add("error-text");
    }

    // --- Update Pollution Chart ---
    if (aqiTrends.status === "fulfilled") {
      updatePollutionChart(aqiTrends.value, false);
      console.log("Pollution API data loaded");
      console.log("Chart updated from API: Pollution");
    } else {
      console.error("AQI Trends API failed:", aqiTrends.reason);
      updatePollutionChart(generateMockAQIData(), true); // Simulated label
    }

    // Update Timestamp
    const now = new Date();
    document.getElementById("last-updated").innerText = `Last updated: ${now.toLocaleTimeString()}`;

  } catch (error) {
    console.error("Critical Dashboard error:", error);
  } finally {
    if (refreshBtn) refreshBtn.classList.remove("loading");
  }
}

/**
 * Fetch Hourly Weather Trends from Open-Meteo
 */
async function fetchWeatherTrends() {
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${currentLocation.lat}&longitude=${currentLocation.lon}&hourly=temperature_2m,relative_humidity_2m&timezone=auto&forecast_days=1`;
  const response = await fetch(url);
  if (!response.ok) throw new Error("Open-Meteo Weather API Error");
  return await response.json();
}

/**
 * Fetch Hourly AQI Trends from Open-Meteo Air Quality API
 */
async function fetchAQITrends() {
  const url = `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${currentLocation.lat}&longitude=${currentLocation.lon}&hourly=pm10,pm2_5,us_aqi&timezone=auto&forecast_days=1`;
  const response = await fetch(url);
  if (!response.ok) throw new Error("Open-Meteo AQI API Error");
  return await response.json();
}

/**
 * Update Weather Chart with real data
 */
function updateWeatherChart(data) {
  if (!weatherChart || !data.hourly) return;
  
  const labels = data.hourly.time.map(t => new Date(t).getHours() + ":00");
  weatherChart.data.labels = labels;
  weatherChart.data.datasets[0].data = data.hourly.temperature_2m;
  weatherChart.data.datasets[1].data = data.hourly.relative_humidity_2m;
  weatherChart.update();
}

/**
 * Update Pollution Chart with real or simulated data
 */
function updatePollutionChart(data, isSimulated) {
  if (!pollutionChart) return;
  
  const titleEl = document.querySelector("#card-aqi h3") || { innerText: "" };
  const labelEl = document.getElementById("aqi-status");

  if (isSimulated) {
    labelEl.innerText = "Simulated Trends";
    labelEl.style.color = "var(--text-secondary)";
    
    pollutionChart.data.labels = ['12am', '4am', '8am', '12pm', '4pm', '8pm', '11pm'];
    pollutionChart.data.datasets[0].data = data;
    pollutionChart.data.datasets[0].label = "AQI (Simulated)";
  } else {
    const hourly = data.hourly;
    // Show every 3rd hour to avoid overcrowding the bar chart
    const filteredLabels = [];
    const filteredData = [];
    
    for (let i = 0; i < hourly.time.length; i += 3) {
      filteredLabels.push(new Date(hourly.time[i]).getHours() + ":00");
      filteredData.push(hourly.us_aqi[i]);
    }
    
    pollutionChart.data.labels = filteredLabels;
    pollutionChart.data.datasets[0].data = filteredData;
    pollutionChart.data.datasets[0].label = "Real-time AQI Index";
    
    labelEl.innerText = "Live API Active";
  }
  
  pollutionChart.update();
}

/**
 * Update Traffic Chart dynamically based on current time
 */
function updateTrafficChart() {
  if (!trafficChart) return;
  
  const now = new Date().getHours();
  const data = [];
  
  for (let i = 0; i < 24; i++) {
    // Basic logic: Higher traffic during morning/evening peaks
    let base = 0.2;
    if ((i >= 8 && i <= 10) || (i >= 17 && i <= 19)) base = 0.7;
    else if (i >= 23 || i <= 5) base = 0.1;
    
    // Add some random noise relative to location/time
    const noise = Math.random() * 0.15;
    data.push(Math.min(0.95, base + noise));
  }
  
  trafficChart.data.datasets[0].data = data;
  trafficChart.update();
}

function generateMockAQIData() {
  return [45, 52, 48, 70, 65, 40, 38];
}

function updateAQIStatus(val) {
  const el = document.getElementById("aqi-status");
  const card = document.getElementById("card-aqi");
  if (val <= 50) {
    el.innerText = "Good";
    el.style.color = "var(--success)";
  } else if (val <= 100) {
    el.innerText = "Moderate";
    el.style.color = "var(--warning)";
  } else {
    el.innerText = "Unhealthy";
    el.style.color = "var(--danger)";
  }
}

function updateTrafficStatus(val) {
  const el = document.getElementById("traffic-status");
  if (val >= 0.7) {
    el.innerText = "High Congestion";
    el.style.color = "var(--danger)";
  } else if (val >= 0.4) {
    el.innerText = "Moderate Flow";
    el.style.color = "var(--warning)";
  } else {
    el.innerText = "Normal Flow";
    el.style.color = "var(--success)";
  }
}

function getTrafficLabel(value) {
  if (value >= 0.7) return "High";
  if (value >= 0.4) return "Moderate";
  return "Low";
}

function showFallbackData() {
  document.getElementById("aqi-status").innerText = "Demo Mode";
  document.getElementById("aqi").innerText = "42";
  document.getElementById("temperature").innerText = "22.5°C";
  document.getElementById("humidity").innerText = "45%";
  document.getElementById("traffic").innerText = "Low";
}

/**
 * Chatbot Logic
 */
async function sendMessage() {
  const input = document.getElementById("userInput");
  const message = input.value.trim();

  if (!message) return;

  addMessage(message, "user");
  input.value = "";

  // Show "Typing..." state
  const loadingId = "loading-" + Date.now();
  addMessage("Assistant is thinking...", "bot", loadingId);

  try {
    const response = await fetch(`${API_BASE_URL}/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ 
        message: message,
        city: currentLocation.label,
        lat: currentLocation.lat,
        lon: currentLocation.lon
      })
    });

    const data = await response.json();
    
    // Remove loading message
    const loadingMsg = document.getElementById(loadingId);
    if (loadingMsg) loadingMsg.remove();

    addMessage(data.response || "I'm sorry, I couldn't process that.", "bot");

  } catch (error) {
    console.error("Chat error:", error);
    const loadingMsg = document.getElementById(loadingId);
    if (loadingMsg) loadingMsg.remove();
    addMessage("Sorry, I'm having trouble connecting to the brain. Please try again later.", "bot");
  }
}

function addMessage(text, sender, id = "") {
  const chatBox = document.getElementById("chatBox");
  const msg = document.createElement("div");
  msg.className = `message ${sender}`;
  if (id) msg.id = id;
  msg.innerText = text;

  chatBox.appendChild(msg);
  chatBox.scrollTop = chatBox.scrollHeight;
}

// Enter key support for chat
document.getElementById("userInput")?.addEventListener("keypress", (e) => {
  if (e.key === "Enter") sendMessage();
});

// Run Init
window.onload = initDashboard;