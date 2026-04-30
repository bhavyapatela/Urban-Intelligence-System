const API_BASE_URL = "http://127.0.0.1:8000";

async function loadDashboardData() {
  try {
    const response = await fetch(`${API_BASE_URL}/predict-aqi`);
    const data = await response.json();

    document.getElementById("aqi").innerText =
      data.predicted_aqi ? data.predicted_aqi : "--";

    document.getElementById("temperature").innerText =
      data.temperature ? `${data.temperature.toFixed(1)}°C` : "--";

    document.getElementById("humidity").innerText =
      data.humidity ? `${data.humidity.toFixed(1)}%` : "--";

    document.getElementById("traffic").innerText =
      data.traffic ? getTrafficLabel(data.traffic) : "--";

  } catch (error) {
    console.error("Dashboard error:", error);
  }
}

function getTrafficLabel(value) {
  if (value >= 0.8) return "High";
  if (value >= 0.4) return "Moderate";
  return "Low";
}

async function sendMessage() {
  const input = document.getElementById("userInput");
  const chatBox = document.getElementById("chatBox");
  const message = input.value.trim();

  if (!message) return;

  addMessage(message, "user");
  input.value = "";

  addMessage("Thinking...", "bot", "loading");

  try {
    const response = await fetch(`${API_BASE_URL}/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ message: message })
    });

    const data = await response.json();

    removeLoadingMessage();

    addMessage(data.response || data.answer || "No response received.", "bot");

  } catch (error) {
    removeLoadingMessage();
    addMessage("Sorry, I could not connect to the server.", "bot");
    console.error("Chat error:", error);
  }
}

function addMessage(text, sender, extraClass = "") {
  const chatBox = document.getElementById("chatBox");

  const msg = document.createElement("div");
  msg.className = `${sender} message ${extraClass}`;
  msg.innerText = text;

  chatBox.appendChild(msg);
  chatBox.scrollTop = chatBox.scrollHeight;
}

function removeLoadingMessage() {
  const loading = document.querySelector(".loading");
  if (loading) loading.remove();
}

document.getElementById("userInput").addEventListener("keypress", function (e) {
  if (e.key === "Enter") {
    sendMessage();
  }
});

loadDashboardData();