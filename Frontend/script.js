const API_BASE_URL = "http://127.0.0.1:8000";

// Global state
let weatherChart, pollutionChart, trafficChart, insightsChart;
let hourlyTempChart, rainProbChart;
let tempVsFeelsChart, humidityRainChart, windTrendChart;
let lastWeatherData = null;
let selectedDayIndex = -1; // -1 for Today/Current
let map, heatLayer, userMarker;
let isHeatmapVisible = true;
let isChatOpen = false;

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
  
  await fetchUserLocation();
  
  initMap();
  initCharts();
  initTheme();
  
  await loadDashboardData();
  
  setInterval(loadDashboardData, 30000);
}

/**
 * Number Count-Up Animation
 */
function animateValue(obj, start, end, duration) {
  let startTimestamp = null;
  const step = (timestamp) => {
    if (!startTimestamp) startTimestamp = timestamp;
    const progress = Math.min((timestamp - startTimestamp) / duration, 1);
    // ease out cubic
    const easeOut = 1 - Math.pow(1 - progress, 3);
    const current = progress === 1 ? end : start + (end - start) * easeOut;
    
    // Check if integer or float based on the end value
    if (end % 1 !== 0) {
      obj.innerHTML = current.toFixed(1);
    } else {
      obj.innerHTML = Math.floor(current);
    }
    
    if (progress < 1) {
      window.requestAnimationFrame(step);
    }
  };
  window.requestAnimationFrame(step);
}

function updateElementWithAnimation(id, value) {
  const el = document.getElementById(id);
  if (!el) return;
  const end = parseFloat(value) || 0;
  const current = parseFloat(el.innerText) || 0;
  if (el.hasAttribute('data-animate-value') && current !== end) {
    animateValue(el, current, end, 1500);
  } else {
    el.innerText = value;
  }
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
        const mapLoc = document.getElementById("map-loc");
        if(mapLoc) mapLoc.innerText = currentLocation.label;
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

  L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
    attribution: '&copy; OpenStreetMap contributors &copy; CARTO'
  }).addTo(map);

  const heatPoints = [
    [currentLocation.lat, currentLocation.lon, 0.8],
    [currentLocation.lat + 0.01, currentLocation.lon + 0.01, 0.9],
    [currentLocation.lat - 0.02, currentLocation.lon + 0.03, 0.6],
    [currentLocation.lat + 0.03, currentLocation.lon - 0.01, 0.7],
    [currentLocation.lat - 0.01, currentLocation.lon - 0.02, 0.5],
    [currentLocation.lat + 0.02, currentLocation.lon - 0.03, 0.6]
  ];

  heatLayer = L.heatLayer(heatPoints, { radius: 25, blur: 15, maxZoom: 17 }).addTo(map);
  
  userMarker = L.marker(cityCoords).addTo(map)
    .bindPopup(`<b>${currentLocation.label}</b><br>Fetching live data...`)
    .openPopup();
}

function centerMap() {
  if (map && currentLocation) {
    map.flyTo([currentLocation.lat, currentLocation.lon], 13, { duration: 1 });
  }
}

function toggleHeatmap() {
  if (!map || !heatLayer) return;
  if (isHeatmapVisible) {
    map.removeLayer(heatLayer);
  } else {
    heatLayer.addTo(map);
  }
  isHeatmapVisible = !isHeatmapVisible;
}

/**
 * Chart.js Initialization
 */
function initCharts() {
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      y: { grid: { color: 'rgba(125, 125, 125, 0.1)' }, ticks: { color: '#94a3b8' } },
      x: { grid: { display: false }, ticks: { color: '#94a3b8' } }
    }
  };

  const ctxWeather = document.getElementById('weatherChart');
  if(ctxWeather) {
    weatherChart = new Chart(ctxWeather.getContext('2d'), {
      type: 'line',
      data: {
        labels: [],
        datasets: [
          { label: 'Temp (°C)', data: [], borderColor: '#0ea5e9', backgroundColor: 'rgba(14, 165, 233, 0.1)', fill: true, tension: 0.4 },
          { label: 'Humidity (%)', data: [], borderColor: '#10b981', backgroundColor: 'transparent', fill: false, tension: 0.4, hidden: true }
        ]
      },
      options: chartOptions
    });
  }

  const ctxPollution = document.getElementById('pollutionChart');
  if(ctxPollution) {
    pollutionChart = new Chart(ctxPollution.getContext('2d'), {
      type: 'bar',
      data: {
        labels: [],
        datasets: [{ label: 'AQI Index', data: [], backgroundColor: '#0ea5e9', borderRadius: 5 }]
      },
      options: chartOptions
    });
  }

  const ctxTraffic = document.getElementById('trafficChart');
  if(ctxTraffic) {
    trafficChart = new Chart(ctxTraffic.getContext('2d'), {
      type: 'line',
      data: {
        labels: Array.from({length: 24}, (_, i) => `${i}:00`),
        datasets: [{ label: 'Congestion Index', data: [], borderColor: '#f59e0b', borderWidth: 2, pointRadius: 0, fill: false, tension: 0.4 }]
      },
      options: { ...chartOptions, scales: { ...chartOptions.scales, y: { ...chartOptions.scales.y, max: 1, min: 0 } } }
    });
  }

  // New Weather Hourly Charts
  const ctxHourly = document.getElementById('hourlyTempChart');
  if(ctxHourly) {
    hourlyTempChart = new Chart(ctxHourly.getContext('2d'), {
      type: 'line',
      data: { labels: [], datasets: [{ label: 'Temp (°C)', data: [], borderColor: '#38bdf8', backgroundColor: 'rgba(56, 189, 248, 0.1)', fill: true, tension: 0.4 }] },
      options: { ...chartOptions, scales: { ...chartOptions.scales, y: { ticks: { color: '#94a3b8' } } } }
    });
  }

  const ctxRain = document.getElementById('rainProbChart');
  if(ctxRain) {
    rainProbChart = new Chart(ctxRain.getContext('2d'), {
      type: 'bar',
      data: { labels: [], datasets: [{ label: 'Rain %', data: [], backgroundColor: '#6366f1', borderRadius: 5 }] },
      options: { ...chartOptions, scales: { ...chartOptions.scales, y: { max: 100, min: 0, ticks: { color: '#94a3b8' } } } }
    });
  }

  // Weather Insights Charts
  const ctxTvF = document.getElementById('tempVsFeelsChart');
  if(ctxTvF) {
    tempVsFeelsChart = new Chart(ctxTvF.getContext('2d'), {
      type: 'line',
      data: {
        labels: [],
        datasets: [
          { label: 'Temp', data: [], borderColor: '#38bdf8', tension: 0.4, fill: false },
          { label: 'Feels Like', data: [], borderColor: '#f472b6', tension: 0.4, borderDash: [5, 5], fill: false }
        ]
      },
      options: chartOptions
    });
  }

  const ctxHumRain = document.getElementById('humidityRainChart');
  if(ctxHumRain) {
    humidityRainChart = new Chart(ctxHumRain.getContext('2d'), {
      type: 'bar',
      data: {
        labels: [],
        datasets: [
          { label: 'Humidity', data: [], backgroundColor: 'rgba(56, 189, 248, 0.2)', type: 'line', fill: true, tension: 0.4 },
          { label: 'Rain %', data: [], backgroundColor: '#6366f1', borderRadius: 4 }
        ]
      },
      options: { ...chartOptions, scales: { ...chartOptions.scales, y: { max: 100, min: 0 } } }
    });
  }

  const ctxWind = document.getElementById('windTrendChart');
  if(ctxWind) {
    windTrendChart = new Chart(ctxWind.getContext('2d'), {
      type: 'line',
      data: {
        labels: [],
        datasets: [{ label: 'Wind', data: [], borderColor: '#fbbf24', tension: 0.4, pointRadius: 0, borderWidth: 2 }]
      },
      options: {
        ...chartOptions,
        scales: { x: { display: false }, y: { display: true, ticks: { display: false } } },
        plugins: { legend: { display: false } }
      }
    });
  }

  // Combined Insights Chart
  const ctxInsights = document.getElementById('insightsChart');
  if(ctxInsights) {
    insightsChart = new Chart(ctxInsights.getContext('2d'), {
      type: 'line',
      data: {
        labels: [],
        datasets: [
          { label: 'Temperature (°C)', data: [], borderColor: '#0ea5e9', tension: 0.4, yAxisID: 'y' },
          { label: 'AQI (Simulated)', data: [], borderColor: '#ef4444', tension: 0.4, yAxisID: 'y1' },
          { label: 'Traffic (Simulated)', data: [], borderColor: '#f59e0b', tension: 0.4, yAxisID: 'y2', hidden: true }
        ]
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { display: true, labels: { color: '#94a3b8' } } },
        scales: {
          x: { grid: { display: false }, ticks: { color: '#94a3b8' } },
          y: { type: 'linear', display: true, position: 'left', ticks: { color: '#0ea5e9' } },
          y1: { type: 'linear', display: true, position: 'right', ticks: { color: '#ef4444' }, grid: { drawOnChartArea: false } },
          y2: { type: 'linear', display: false, position: 'right' }
        }
      }
    });
  }
}

/**
 * Fetch and display real-time dashboard data
 */
async function loadDashboardData() {
  const refreshBtn = document.getElementById("refresh-btn");
  if (refreshBtn) refreshBtn.classList.add("spinning");

  console.log("Loading Dashboard Data for:", currentLocation.label);

  try {
    const backendPromise = fetch(`${API_BASE_URL}/predict-aqi?lat=${currentLocation.lat}&lon=${currentLocation.lon}`)
      .then(res => res.ok ? res.json() : Promise.reject("Backend Error"));
    const weatherTrendsPromise = fetchWeatherTrends();
    const aqiTrendsPromise = fetchAQITrends();

    // 3. Fetch Structured Weather Data
    const weatherDataPromise = fetch(`${API_BASE_URL}/weather?city=${currentLocation.label || 'Delhi'}&lat=${currentLocation.lat}&lon=${currentLocation.lon}`)
      .then(res => res.json());

    const [backendData, weatherTrends, aqiTrends, structuredWeather] = await Promise.allSettled([
      backendPromise, weatherTrendsPromise, aqiTrendsPromise, weatherDataPromise
    ]);

    // Create current state object to pass to insights
    const state = {
      aqi: 0, temp: 0, humidity: 0, traffic: 0,
      weatherData: weatherTrends.status === 'fulfilled' ? weatherTrends.value : null,
      aqiData: aqiTrends.status === 'fulfilled' ? aqiTrends.value : null
    };

    if (backendData.status === "fulfilled") {
      const data = backendData.value;
      state.aqi = data.predicted_aqi || 0;
      state.temp = data.temperature || 0;
      state.humidity = data.humidity || 0;
      state.traffic = data.traffic || 0.3;
      
      updateElementWithAnimation("aqi", state.aqi);
      updateElementWithAnimation("map-aqi", state.aqi);
      updateAQIStatus(state.aqi);
      
      updateElementWithAnimation("temperature", state.temp);
      updateElementWithAnimation("weather-temp-large", state.temp);
      
      updateElementWithAnimation("humidity", state.humidity);
      
      updateElementWithAnimation("traffic", (state.traffic * 100));
      updateTrafficStatus(state.traffic);

      if (userMarker) {
        userMarker.setPopupContent(`<b>${currentLocation.label}</b><br>AQI: ${state.aqi} (${data.category})<br>Temp: ${state.temp.toFixed(1)}°C`);
      }
      
      updateTrafficChart();
    } else {
      console.warn("Backend unavailable, using Open-Meteo fallback.");
      // Use Open-Meteo current weather if backend fails
      if (weatherTrends.status === "fulfilled") {
        updateWeatherChart(weatherTrends.value);
        state.temp = weatherTrends.value.current_weather ? weatherTrends.value.current_weather.temperature : (weatherTrends.value.hourly.temperature_2m ? weatherTrends.value.hourly.temperature_2m[0] : 0);
        state.humidity = weatherTrends.value.hourly.relative_humidity_2m ? weatherTrends.value.hourly.relative_humidity_2m[0] : 0;
        updateElementWithAnimation("temperature", state.temp);
        updateElementWithAnimation("weather-temp-large", state.temp);
        updateElementWithAnimation("humidity", state.humidity);
      } else {
        showFallbackData();
      }

      // Use Open-Meteo AQI if backend fails
      if (aqiTrends.status === "fulfilled") {
        state.aqi = aqiTrends.value.hourly.us_aqi[0];
        updateElementWithAnimation("aqi", state.aqi);
        updateElementWithAnimation("map-aqi", state.aqi);
        updateAQIStatus(state.aqi);
      }

      state.traffic = 0.2;
      updateElementWithAnimation("traffic", 20);
      updateTrafficStatus(0.2);
      updateTrafficChart();
    }

    // Handle Structured Weather Dashboard
    if (structuredWeather.status === "fulfilled" && !structuredWeather.value.error) {
      lastWeatherData = structuredWeather.value;
      updateWeatherDashboard(lastWeatherData);
    } else if (weatherTrends.status === "fulfilled") {
      // Backend /weather unreachable (e.g., Netlify deploy) — build from Open-Meteo direct data
      console.warn("Backend /weather unavailable. Building weather dashboard from Open-Meteo fallback.");
      lastWeatherData = buildWeatherDataFromOpenMeteo(weatherTrends.value);
      updateWeatherDashboard(lastWeatherData);
    } else {
      document.getElementById('weather-card-loading').classList.add('hidden');
      document.getElementById('weather-card-error').classList.remove('hidden');
    }

    if (weatherTrends.status === "fulfilled") {
      updateWeatherPrediction(weatherTrends.value);
    }

    if (aqiTrends.status === "fulfilled") {
      updatePollutionChart(aqiTrends.value, false);
    } else {
      updatePollutionChart(generateMockAQIData(), true);
    }

    // Call Insights Updates
    updateInsightsSection(state);

    const now = new Date();
    document.getElementById("last-updated").innerText = `Last updated: ${now.toLocaleTimeString()}`;

  } catch (error) {
    console.error("Dashboard error:", error);
  } finally {
    if (refreshBtn) refreshBtn.classList.remove("spinning");
  }
}

async function fetchWeatherTrends() {
  // Fetch 7 days with all fields needed to power the full weather dashboard without the backend
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${currentLocation.lat}&longitude=${currentLocation.lon}`
    + `&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,pressure_msl,wind_speed_10m`
    + `&hourly=temperature_2m,relative_humidity_2m,precipitation_probability,wind_speed_10m,apparent_temperature`
    + `&daily=weather_code,temperature_2m_max,temperature_2m_min,sunrise,sunset,uv_index_max`
    + `&timezone=auto&forecast_days=7`;
  const response = await fetch(url);
  if (!response.ok) throw new Error("Open-Meteo API Error");
  return await response.json();
}

/**
 * Converts raw Open-Meteo API response into the structured format
 * expected by updateWeatherDashboard() — used as a fallback when
 * the FastAPI backend /weather endpoint is unreachable (e.g., Netlify deploy).
 */
function buildWeatherDataFromOpenMeteo(raw) {
  const WMO = {
    0:"Sunny",1:"Mainly Clear",2:"Partly Cloudy",3:"Overcast",
    45:"Foggy",48:"Hazy",51:"Drizzle",53:"Drizzle",55:"Drizzle",
    61:"Rainy",63:"Rainy",65:"Heavy Rain",71:"Snowy",73:"Snowy",75:"Snowy",
    80:"Rain Showers",81:"Rain Showers",82:"Rain Showers",
    95:"Thunderstorm",96:"Stormy",99:"Stormy"
  };
  const getCondition = code => WMO[code] || "Clear";

  // current block (new Open-Meteo 'current' key)
  const cur = raw.current || raw.current_weather || {};
  const hourly = raw.hourly || {};
  const daily  = raw.daily  || {};

  const forecast = [];
  const days = (daily.time || []).length;
  for (let i = 0; i < days; i++) {
    forecast.push({
      date:      daily.time[i],
      max_temp:  daily.temperature_2m_max[i],
      min_temp:  daily.temperature_2m_min[i],
      condition: getCondition(daily.weather_code[i]),
      sunrise:   (daily.sunrise[i] || '').split('T')[1] || '--',
      sunset:    (daily.sunset[i]  || '').split('T')[1] || '--',
      uv_index:  daily.uv_index_max ? daily.uv_index_max[i] : '--'
    });
  }

  return {
    city:          currentLocation.label || 'Delhi',
    temperature:   cur.temperature_2m   ?? cur.temperature ?? 0,
    feels_like:    cur.apparent_temperature ?? (cur.temperature_2m ?? 0) - 2,
    condition:     getCondition(cur.weather_code ?? cur.weathercode ?? 0),
    humidity:      cur.relative_humidity_2m ?? (hourly.relative_humidity_2m ? hourly.relative_humidity_2m[0] : 0),
    wind_speed:    cur.wind_speed_10m ?? 0,
    pressure:      cur.pressure_msl   ?? 1013,
    precipitation: cur.precipitation  ?? 0,
    rain_probability: hourly.precipitation_probability ? hourly.precipitation_probability[0] : 0,
    forecast,
    hourly: {
      time:              hourly.time || [],
      temperature:       hourly.temperature_2m || [],
      rain_probability:  hourly.precipitation_probability || [],
      humidity:          hourly.relative_humidity_2m || [],
      wind_speed:        hourly.wind_speed_10m || []
    },
    last_updated: new Date().toLocaleString(),
    source: 'Open-Meteo (Direct)'
  };
}

async function fetchAQITrends() {
  const url = `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${currentLocation.lat}&longitude=${currentLocation.lon}&hourly=pm10,pm2_5,us_aqi&timezone=auto&forecast_days=1`;
  const response = await fetch(url);
  if (!response.ok) throw new Error("Open-Meteo AQI Error");
  return await response.json();
}

function updateWeatherChart(data) {
  if (!weatherChart || !data.hourly) return;
  const labels = data.hourly.time.map(t => new Date(t).getHours() + ":00");
  // Use correct temperature field
  const tempData = data.hourly.temperature ? data.hourly.temperature : data.hourly.temperature_2m;
  const humidityData = data.hourly.relative_humidity_2m ? data.hourly.relative_humidity_2m : [];
  weatherChart.data.labels = labels;
  weatherChart.data.datasets[0].data = tempData;
  weatherChart.data.datasets[1].data = humidityData;
  weatherChart.update();
}

function updateWeatherDashboard(data, dayIndex = -1) {
  // Hide loading, show content
  document.getElementById('weather-card-loading').classList.add('hidden');
  document.getElementById('weather-card-error').classList.add('hidden');
  document.getElementById('weather-main-content').classList.remove('hidden');

  const isToday = dayIndex === -1;
  const targetData = isToday ? data : data.forecast[dayIndex];
  
  // Update Hero Section
  document.getElementById('weather-city').textContent = data.city;
  document.getElementById('main-temp').textContent = Math.round(isToday ? data.temperature : targetData.max_temp);
  document.getElementById('main-condition').textContent = targetData.condition;
  document.getElementById('feels-like').textContent = Math.round(isToday ? data.feels_like : targetData.max_temp - 2);
  document.getElementById('weather-source').textContent = data.source;
  
  // Update Mode Badge & Reset Btn
  const badge = document.getElementById('weather-report-mode');
  const resetBtn = document.getElementById('weather-reset-btn');
  if (isToday) {
    badge.textContent = "Current Weather";
    badge.classList.remove('report-mode');
    resetBtn.classList.add('hidden');
    document.getElementById('day-report-details').classList.add('hidden');
  } else {
    badge.textContent = "Forecast: " + new Date(targetData.date).toLocaleDateString('en-US', { weekday: 'long' });
    badge.classList.add('report-mode');
    resetBtn.classList.remove('hidden');
    
    // Show Day Report
    document.getElementById('day-report-details').classList.remove('hidden');
    document.getElementById('r-sunrise').textContent = targetData.sunrise || "--";
    document.getElementById('r-sunset').textContent = targetData.sunset || "--";
    document.getElementById('r-temp-range').textContent = `${Math.round(targetData.max_temp)}° / ${Math.round(targetData.min_temp)}°`;
    document.getElementById('r-uv').textContent = targetData.uv_index || "--";
    
    // Smart Recommendation
    const recBox = document.getElementById('weather-recommendation');
    if (targetData.condition.includes("Rain")) recBox.textContent = "🌧️ Recommendation: High chance of rain. Carry an umbrella and expect traffic delays.";
    else if (targetData.max_temp > 35) recBox.textContent = "🥵 Recommendation: High heat detected. Stay hydrated and avoid outdoor activity during mid-day.";
    else if (targetData.min_temp < 15) recBox.textContent = "🧥 Recommendation: Chilly morning expected. Wear a light jacket.";
    else recBox.textContent = "✅ Recommendation: Pleasant weather. Great day for outdoor exploration.";
  }

  // Update Metrics (using averages for forecast days)
  document.getElementById('m-humidity').textContent = `${isToday ? data.humidity : 50}%`;
  document.getElementById('m-wind').textContent = `${isToday ? data.wind_speed : 10} km/h`;
  document.getElementById('m-pressure').textContent = `${isToday ? data.pressure : 1013} hPa`;
  document.getElementById('m-rain').textContent = `${isToday ? data.rain_probability : (targetData.condition.includes("Rain") ? 80 : 10)}%`;

  // Update Charts (slice 24h for selected day)
  const startIndex = isToday ? 0 : dayIndex * 24;
  const endIndex = startIndex + 24;
  
  const labels = data.hourly.time.slice(startIndex, endIndex).map(t => t.split('T')[1].substring(0, 5));
  // Support both backend keys (temperature / rain_probability) and Open-Meteo keys (temperature_2m / precipitation_probability)
  const tempArr = data.hourly.temperature || data.hourly.temperature_2m || [];
  const rainArr = data.hourly.rain_probability || data.hourly.precipitation_probability || [];
  const humArr  = data.hourly.humidity || data.hourly.relative_humidity_2m || [];
  const windArr = data.hourly.wind_speed || data.hourly.wind_speed_10m || [];
  const temps = tempArr.slice(startIndex, endIndex);
  const rains = rainArr.slice(startIndex, endIndex);
  
  if (hourlyTempChart) {
    hourlyTempChart.data.labels = labels;
    hourlyTempChart.data.datasets[0].data = temps;
    hourlyTempChart.update();
  }
  
  if (rainProbChart) {
    rainProbChart.data.labels = labels;
    rainProbChart.data.datasets[0].data = rains;
    rainProbChart.update();
  }

  // Show Insights Panel
  document.getElementById('weather-insights-panel').classList.remove('hidden');

  // Update Insights Charts
  const hums = humArr.slice(startIndex, endIndex);
  const winds = windArr.slice(startIndex, endIndex);
  
  if (tempVsFeelsChart) {
    tempVsFeelsChart.data.labels = labels;
    tempVsFeelsChart.data.datasets[0].data = temps;
    tempVsFeelsChart.data.datasets[1].data = temps.map(t => t - 2); // Approximation if feels_like hourly is missing
    tempVsFeelsChart.update();
  }

  if (humidityRainChart) {
    humidityRainChart.data.labels = labels;
    humidityRainChart.data.datasets[0].data = hums;
    humidityRainChart.data.datasets[1].data = rains;
    humidityRainChart.update();
  }

  if (windTrendChart) {
    windTrendChart.data.labels = labels;
    windTrendChart.data.datasets[0].data = winds;
    windTrendChart.update();
  }

  // Update Mini Metrics & Tip
  const avgWind = winds.reduce((a, b) => a + b, 0) / 24;
  document.getElementById('avg-wind-day').textContent = `${avgWind.toFixed(1)} km/h avg`;
  
  const tipText = document.getElementById('insight-tip-text');
  if (isToday) {
    tipText.textContent = "Currently viewing live conditions. Check future days for specific travel tips.";
  } else {
    if (rains.some(r => r > 50)) tipText.textContent = "Rain intensity peaks in the afternoon. Schedule indoor meetings between 2 PM and 5 PM.";
    else if (avgWind > 20) tipText.textContent = "High winds detected. Secure loose items on balconies and expect slight commute delays.";
    else if (temps.some(t => t > 38)) tipText.textContent = "Peak heat expected. Best to complete outdoor site visits before 10 AM.";
    else tipText.textContent = "Stable environment predicted. Ideal day for regular urban maintenance and outdoor activity.";
  }

  // Update Character Animation
  updateWeatherCharacter(targetData.condition);

  // Render Forecast Sidebar (only once or update active class)
  if (isToday) renderForecast(data.forecast);
  else updateForecastActiveState(dayIndex);
}

function selectWeatherDay(index) {
  selectedDayIndex = index;
  if (lastWeatherData) {
    updateWeatherDashboard(lastWeatherData, index);
  }
}

function resetToToday() {
  selectedDayIndex = -1;
  if (lastWeatherData) {
    updateWeatherDashboard(lastWeatherData, -1);
  }
}

function updateForecastActiveState(index) {
  const items = document.querySelectorAll('.forecast-item');
  items.forEach((item, i) => {
    if (i === index) item.classList.add('active');
    else item.classList.remove('active');
  });
}

function updateWeatherCharacter(condition) {
  const container = document.getElementById('char-layer');
  const emoji = document.getElementById('main-emoji');
  
  // Clean previous classes
  emoji.className = 'main-weather-emoji';
  
  let icon = "☀️";
  let animClass = "cap-anim";

  if (condition.includes("Rain") || condition.includes("Drizzle")) {
    icon = "☔";
    animClass = "umbrella-anim";
  } else if (condition.includes("Cloud") || condition.includes("Overcast")) {
    icon = "☁️";
    animClass = "bounce";
  } else if (condition.includes("Snow") || condition.includes("Heavy Rain")) {
    icon = "🧥";
    animClass = "jacket-anim";
  } else if (condition.includes("Fog") || condition.includes("Hazy")) {
    icon = "🌫️";
    animClass = "float";
  }

  emoji.textContent = icon;
  emoji.classList.add(animClass);
}

function renderForecast(forecast) {
  const container = document.getElementById('forecast-container');
  container.innerHTML = '';

  forecast.forEach((day, index) => {
    const date = new Date(day.date);
    const dayName = index === 0 ? "Today" : date.toLocaleDateString('en-US', { weekday: 'short' });
    
    const div = document.createElement('div');
    div.className = `forecast-item ${index === selectedDayIndex || (index === 0 && selectedDayIndex === -1) ? 'active' : ''}`;
    div.onclick = () => selectWeatherDay(index);
    div.innerHTML = `
      <div class="f-date">${dayName}</div>
      <div class="f-condition">
        <span>${getConditionEmoji(day.condition)}</span>
        ${day.condition}
      </div>
      <div class="f-temp">${Math.round(day.max_temp)}° <span>${Math.round(day.min_temp)}°</span></div>
    `;
    container.appendChild(div);
  });
}

function getConditionEmoji(condition) {
  if (condition.includes("Rain")) return "🌧️";
  if (condition.includes("Sunny") || condition.includes("Clear")) return "☀️";
  if (condition.includes("Cloud")) return "⛅";
  if (condition.includes("Thunder")) return "⛈️";
  return "☁️";
}

function switchWeatherTab(type) {
  const tabTemp = document.getElementById('tab-temp');
  const tabRain = document.getElementById('tab-rain');
  const chartTemp = document.getElementById('hourlyTempChart');
  const chartRain = document.getElementById('rainProbChart');

  if (type === 'temp') {
    tabTemp.classList.add('active');
    tabRain.classList.remove('active');
    chartTemp.classList.remove('hidden');
    chartRain.classList.add('hidden');
  } else {
    tabRain.classList.add('active');
    tabTemp.classList.remove('active');
    chartRain.classList.remove('hidden');
    chartTemp.classList.add('hidden');
  }
}

function updateWeatherPrediction(data) {
  if (!data || !data.current_weather) return;
  const currentTemp = data.current_weather.temperature;
  const weatherCode = data.current_weather.weathercode;
  
  let prediction = "Stable";
  if (weatherCode >= 51 && weatherCode <= 67) { prediction = "Rain Expected"; }
  else if (weatherCode >= 71 && weatherCode <= 77) { prediction = "Cold Drop"; }
  else if (weatherCode >= 95) { prediction = "Storms"; }

  // Defensive updates for legacy elements if they still exist elsewhere
  const rainVal = document.getElementById("rain-val");
  if (rainVal) rainVal.innerText = (weatherCode >= 51) ? "High" : "Low";
  
  const tempChangeVal = document.getElementById("temp-change-val");
  if (tempChangeVal) {
    if(currentTemp > 30) tempChangeVal.innerText = "Rising (Hot)";
    else if(currentTemp < 10) tempChangeVal.innerText = "Dropping (Cold)";
    else tempChangeVal.innerText = "Moderate";
  }

  const trendVal = document.getElementById("trend-val");
  if (trendVal) trendVal.innerText = prediction;
}

function updatePollutionChart(data, isSimulated) {
  if (!pollutionChart) return;
  if (isSimulated) {
    pollutionChart.data.labels = ['12am', '4am', '8am', '12pm', '4pm', '8pm', '11pm'];
    pollutionChart.data.datasets[0].data = data;
    pollutionChart.data.datasets[0].label = "AQI (Simulated)";
  } else {
    const hourly = data.hourly;
    const filteredLabels = [];
    const filteredData = [];
    for (let i = 0; i < hourly.time.length; i += 3) {
      filteredLabels.push(new Date(hourly.time[i]).getHours() + ":00");
      filteredData.push(hourly.us_aqi[i]);
    }
    pollutionChart.data.labels = filteredLabels;
    pollutionChart.data.datasets[0].data = filteredData;
    pollutionChart.data.datasets[0].label = "Real-time AQI Index";
  }
  pollutionChart.update();
}

function updateTrafficChart() {
  if (!trafficChart) return;
  const now = new Date().getHours();
  const data = [];
  for (let i = 0; i < 24; i++) {
    let base = 0.2;
    if ((i >= 8 && i <= 10) || (i >= 17 && i <= 19)) base = 0.7;
    else if (i >= 23 || i <= 5) base = 0.1;
    const noise = Math.random() * 0.15;
    data.push(Math.min(0.95, base + noise));
  }
  trafficChart.data.datasets[0].data = data;
  trafficChart.update();
}

function searchTraffic() {
  const query = document.getElementById("traffic-search-input").value;
  if (!query) return;
  
  const btn = document.querySelector(".traffic-search .action-btn");
  btn.innerText = "Searching...";
  
  setTimeout(() => {
    const statuses = ["High", "Med", "Low"];
    const badges = ["danger", "warning", "success"];
    const rand = Math.floor(Math.random() * 3);
    
    const list = document.getElementById("busy-list");
    const li = document.createElement("li");
    li.innerHTML = `${query} <span class="badge ${badges[rand]}">${statuses[rand]}</span>`;
    list.prepend(li);
    if(list.children.length > 5) list.lastChild.remove();
    
    btn.innerText = "Search";
    document.getElementById("traffic-search-input").value = "";
  }, 800);
}

function generateMockAQIData() {
  return [45, 52, 48, 70, 65, 40, 38];
}

function updateAQIStatus(val) {
  const el = document.getElementById("aqi-status");
  if (val <= 50) { el.innerText = "Good"; el.style.color = "var(--success)"; }
  else if (val <= 100) { el.innerText = "Moderate"; el.style.color = "var(--warning)"; }
  else { el.innerText = "Unhealthy"; el.style.color = "var(--danger)"; }
}

function updateTrafficStatus(val) {
  const el = document.getElementById("traffic-status");
  if (val >= 0.7) { el.innerText = "High Congestion"; el.style.color = "var(--danger)"; }
  else if (val >= 0.4) { el.innerText = "Moderate Flow"; el.style.color = "var(--warning)"; }
  else { el.innerText = "Normal Flow"; el.style.color = "var(--success)"; }
}

function getTrafficLabel(value) {
  if (value >= 0.7) return "High";
  if (value >= 0.4) return "Moderate";
  return "Low";
}

function showFallbackData() {
  document.getElementById("aqi-status").innerText = "Demo Mode";
  updateElementWithAnimation("aqi", 42);
  updateElementWithAnimation("temperature", 22.5);
  updateElementWithAnimation("weather-temp-large", 22.5);
  updateElementWithAnimation("humidity", 45);
  updateElementWithAnimation("traffic", 20);
  
  updateTrafficChart();
}

/**
 * Chatbot Logic
 */
function toggleChat() {
  const modal = document.getElementById("chat-modal");
  isChatOpen = !isChatOpen;
  if (isChatOpen) {
    modal.classList.remove("hidden-chat");
  } else {
    modal.classList.add("hidden-chat");
  }
}

function sendQuickAction(actionText) {
  document.getElementById("userInput").value = actionText;
  sendMessage();
}

async function sendMessage() {
  const input = document.getElementById("userInput");
  const message = input.value.trim();

  if (!message) return;

  addMessage(message, "user");
  input.value = "";

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
    const loadingMsg = document.getElementById(loadingId);
    if (loadingMsg) loadingMsg.remove();
    addMessage(data.response || "I'm sorry, I couldn't process that.", "bot");

  } catch (error) {
    console.error("Chat error:", error);
    const loadingMsg = document.getElementById(loadingId);
    if (loadingMsg) loadingMsg.remove();
    addMessage("Sorry, I'm having trouble connecting to the backend. Please try again later.", "bot");
  }
}

function addMessage(text, sender, id = "") {
  const chatBox = document.getElementById("chatBox");
  if(!chatBox) return;
  const msg = document.createElement("div");
  msg.className = `message ${sender}`;
  if (id) msg.id = id;
  msg.innerText = text;
  chatBox.appendChild(msg);
  chatBox.scrollTop = chatBox.scrollHeight;
}

document.getElementById("userInput")?.addEventListener("keypress", (e) => {
  if (e.key === "Enter") sendMessage();
});

/**
 * Insights Section Logic
 */
function updateInsightsSection(state) {
  console.log("Insights section updated");
  generatePredictions(state);
  generateRecommendations(state);
  generateAlerts(state);
  updateForecastChart(state);
}

function generatePredictions(state) {
  const wCard = document.getElementById("pred-weather");
  const aCard = document.getElementById("pred-aqi");
  const tCard = document.getElementById("pred-traffic");
  if (!wCard || !aCard || !tCard) return;

  // Weather Prediction
  let wPred = "Temperature is stable.";
  if (state.weatherData && state.weatherData.current_weather) {
    const temp = state.weatherData.current_weather.temperature;
    const rainProb = state.weatherData.hourly.precipitation_probability ? state.weatherData.hourly.precipitation_probability[0] : 0;
    if (temp > 30) wPred = `Temperature may rise. Rain chance is ${rainProb}%.`;
    else if (temp < 15) wPred = `Temperature is dropping. Rain chance is ${rainProb}%.`;
    else wPred = `Weather remains mild. Rain chance is ${rainProb}%.`;
  }
  wCard.innerText = wPred;

  // AQI Prediction
  let aPred = "AQI may stay unhealthy for the next few hours. Outdoor activity should be reduced.";
  if (state.aqi <= 50) aPred = "AQI remains excellent. Perfect for outdoor activities.";
  else if (state.aqi <= 100) aPred = "AQI is moderate. Generally acceptable air quality.";
  else if (state.aqi <= 150) aPred = "AQI is poor. Sensitive groups should take precautions.";
  aCard.innerText = aPred;

  // Traffic Prediction
  let tPred = "Traffic is flowing smoothly.";
  if (state.traffic > 0.6) tPred = "Traffic may increase near evening peak hours. Prefer metro or avoid busy routes.";
  else if (state.traffic > 0.4) tPred = "Moderate congestion expected in central areas.";
  tCard.innerText = tPred;
}

function generateRecommendations(state) {
  const recList = document.getElementById("rec-list");
  if (!recList) return;
  recList.innerHTML = "";

  const addRec = (icon, text) => {
    const li = document.createElement("li");
    li.innerHTML = `<span style="font-size: 1.2rem;">${icon}</span> <span>${text}</span>`;
    recList.appendChild(li);
  };

  // AQI Recs
  if (state.aqi > 200) addRec("🏠", "Stay indoors and use air purifier if available.");
  else if (state.aqi > 150) addRec("😷", "Wear a mask and avoid outdoor workouts.");
  else addRec("🌿", "Air quality is good. Open windows for fresh air.");

  // Weather Recs
  let rainProb = 0;
  if (state.weatherData && state.weatherData.hourly && state.weatherData.hourly.precipitation_probability) {
    rainProb = state.weatherData.hourly.precipitation_probability[0];
  }
  if (rainProb > 50) addRec("☔", "Carry an umbrella.");
  
  if (state.temp > 35) addRec("💧", "Stay hydrated and avoid direct sunlight.");
  else if (state.temp < 15) addRec("🧥", "Wear warm clothes.");

  // Traffic Recs
  if (state.traffic > 0.6) addRec("🚦", "Avoid peak routes and plan extra travel time.");
  else addRec("🚗", "Roads are mostly clear for travel.");
}

function generateAlerts(state) {
  console.log("Alerts generated");
  const container = document.getElementById("alerts-container");
  if (!container) return;
  container.innerHTML = "";

  const addAlert = (type, icon, text) => {
    const div = document.createElement("div");
    div.className = `alert-card alert-${type} premium-card`;
    div.innerHTML = `<span class="alert-icon">${icon}</span><div class="alert-text">${text}</div>`;
    container.appendChild(div);
  };

  let hasAlerts = false;

  // Severe AQI
  if (state.aqi > 200) { addAlert("danger", "😷", "Severe pollution risk. Stay indoors and use protection."); hasAlerts = true; }
  // High AQI
  else if (state.aqi > 150) { addAlert("danger", "😷", "High AQI detected. Air quality is unhealthy. Avoid outdoor exposure."); hasAlerts = true; }

  // Rain
  let rainProb = 0;
  if (state.weatherData && state.weatherData.hourly && state.weatherData.hourly.precipitation_probability) {
    rainProb = state.weatherData.hourly.precipitation_probability[0];
  }
  if (rainProb > 50) { addAlert("info", "🌧️", "Rain expected soon. Carry an umbrella and check routes before travel."); hasAlerts = true; }

  // Heat
  if (state.temp > 35) { addAlert("danger", "🔥", "High temperature detected. Stay hydrated."); hasAlerts = true; }

  // Traffic
  if (state.traffic > 0.6) { addAlert("danger", "🚦", "Traffic congestion expected. Avoid busy areas."); hasAlerts = true; }

  if (!hasAlerts) {
    addAlert("safe", "✅", "All conditions are currently stable.");
  }
}

function updateForecastChart(state) {
  if (!insightsChart) return;
  
  const labels = [];
  const tempValues = [];
  const aqiValues = [];
  const trafficValues = [];
  
  const nowHour = new Date().getHours();

  for (let i = 0; i < 6; i++) {
    const hr = (nowHour + i) % 24;
    labels.push(`${hr}:00`);
    
    // Fill Temp
    if (state.weatherData && state.weatherData.hourly) {
      tempValues.push(state.weatherData.hourly.temperature_2m[i] || state.temp);
    } else {
      tempValues.push(state.temp);
    }

    // Fill AQI (simulated noise if no actual data)
    if (state.aqiData && state.aqiData.hourly && state.aqiData.hourly.us_aqi[i]) {
      aqiValues.push(state.aqiData.hourly.us_aqi[i]);
    } else {
      const noise = (Math.random() - 0.5) * 10;
      aqiValues.push(Math.max(0, state.aqi + noise));
    }

    // Fill Traffic (simulated based on time)
    let tBase = 0.3;
    if ((hr >= 8 && hr <= 10) || (hr >= 17 && hr <= 19)) tBase = 0.8;
    else if (hr >= 23 || hr <= 5) tBase = 0.1;
    trafficValues.push(Math.min(1, tBase + Math.random()*0.1));
  }

  insightsChart.data.labels = labels;
  insightsChart.data.datasets[0].data = tempValues;
  insightsChart.data.datasets[1].data = aqiValues;
  insightsChart.data.datasets[2].data = trafficValues;
  insightsChart.update();
}

/**
 * Theme Management
 */
function initTheme() {
  const toggleBtn = document.getElementById('theme-toggle');
  const themeIcon = document.getElementById('theme-icon');
  
  const savedTheme = localStorage.getItem('theme') || 'light';
  document.documentElement.setAttribute('data-theme', savedTheme);
  updateThemeIcon(savedTheme, themeIcon);
  updateChartTheme(savedTheme);

  toggleBtn.addEventListener('click', () => {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    updateThemeIcon(newTheme, themeIcon);
    updateChartTheme(newTheme);
  });
}

function updateThemeIcon(theme, iconEl) {
  if (theme === 'dark') iconEl.innerText = '☀️';
  else iconEl.innerText = '🌙';
}

function updateChartTheme(theme) {
  const textColor = theme === 'dark' ? '#94a3b8' : '#475569';
  const gridColor = theme === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)';
  
  const charts = [weatherChart, pollutionChart, trafficChart, insightsChart];
  charts.forEach(chart => {
    if (chart && chart.options && chart.options.scales) {
      if (chart.options.scales.x) {
        if (chart.options.scales.x.ticks) chart.options.scales.x.ticks.color = textColor;
        if (chart.options.scales.x.grid) chart.options.scales.x.grid.color = gridColor;
      }
      if (chart.options.scales.y) {
        if (chart.options.scales.y.ticks) chart.options.scales.y.ticks.color = textColor;
        if (chart.options.scales.y.grid) chart.options.scales.y.grid.color = gridColor;
      }
      if (chart.options.scales.y1) {
        if (chart.options.scales.y1.ticks) chart.options.scales.y1.ticks.color = textColor;
        if (chart.options.scales.y1.grid) chart.options.scales.y1.grid.color = gridColor;
      }
      chart.update();
    }
  });
}

// Run Init
window.onload = () => {
  initCursorGlow();
  initIntroAnimation();
  initDashboard();
};

/**
 * Intro Animation & Cursor Glow
 */
function initIntroAnimation() {
  const introOverlay = document.getElementById('intro-overlay');
  const mainApp = document.getElementById('main-app');
  if (!introOverlay || !mainApp) return;
  initCanvasParticles();
  setTimeout(() => { finishIntro(); }, 4000);
}

function skipIntro() { finishIntro(); }

function finishIntro() {
  const introOverlay = document.getElementById('intro-overlay');
  const mainApp = document.getElementById('main-app');
  if (!introOverlay || !mainApp) return;

  introOverlay.style.opacity = '0';
  introOverlay.style.visibility = 'hidden';
  document.body.classList.add('intro-hidden');
  
  setTimeout(() => {
    introOverlay.style.display = 'none';
    mainApp.classList.remove('hidden-app');
    mainApp.classList.add('visible-app');
  }, 1000);
}

function initCursorGlow() {
  const cursorGlow = document.getElementById('cursor-glow');
  let mouseX = window.innerWidth / 2;
  let mouseY = window.innerHeight / 2;
  let cursorX = mouseX;
  let cursorY = mouseY;

  if (!cursorGlow) return;
  document.addEventListener('mousemove', (e) => {
    mouseX = e.clientX; mouseY = e.clientY;
  });

  function animateCursor() {
    cursorX += (mouseX - cursorX) * 0.1;
    cursorY += (mouseY - cursorY) * 0.1;
    cursorGlow.style.left = cursorX + 'px';
    cursorGlow.style.top = cursorY + 'px';
    requestAnimationFrame(animateCursor);
  }
  animateCursor();
}

function initCanvasParticles() {
  const canvas = document.getElementById('intro-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  
  let width, height;
  function resize() {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
  }
  window.addEventListener('resize', resize);
  resize();

  const particles = [];
  const colors = ['#0ea5e9', '#a855f7', '#fb7185', '#fcd34d']; 

  class Particle {
    constructor(i) {
      this.i = i; this.x = 0; this.y = 0;
      this.baseY = height * 0.5; this.baseX = width * 0.2;
      this.angle = i * 0.1; this.size = Math.random() * 2.5 + 1;
      this.color = colors[Math.floor(Math.random() * colors.length)];
      this.speed = 0.02 + Math.random() * 0.02;
      this.offset = Math.random() * 100;
      this.radius = Math.random() * 200 + 50;
    }
    update() {
      this.angle += this.speed;
      this.x = this.baseX + Math.sin(this.angle) * this.radius + this.offset;
      this.y = this.baseY + Math.cos(this.angle * 0.5) * this.radius * 2;
    }
    draw() {
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
      ctx.fillStyle = this.color;
      ctx.globalAlpha = 0.6;
      ctx.fill();
    }
  }

  for (let i = 0; i < 300; i++) particles.push(new Particle(i));

  function animate() {
    ctx.clearRect(0, 0, width, height);
    particles.forEach(p => { p.update(); p.draw(); });
    requestAnimationFrame(animate);
  }
  animate();
}