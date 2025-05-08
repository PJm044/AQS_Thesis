// Replace with your real API Gateway Invoke URL:
const API_ENDPOINT = 'https://<your-api-id>.execute-api.<region>.amazonaws.com/<stage>/data';

let aqiLineChartInstance;

// --- Helper functions ---

function getAQIDetails(aqi) {
    if (aqi == null) return { description: "Unknown", color: "#cccccc" };
    if (aqi <= 50)  return { description: "Good",                                color: "#00e400" };
    if (aqi <= 100) return { description: "Moderate",                            color: "#ffff00" };
    if (aqi <= 150) return { description: "Unhealthy for Sensitive Groups",     color: "#ff7e00" };
    if (aqi <= 200) return { description: "Unhealthy",                           color: "#ff0000" };
    if (aqi <= 300) return { description: "Very Unhealthy",                      color: "#8f3f97" };
                    return { description: "Hazardous",                           color: "#7e0023" };
}

function getVOCDetails(vocClass) {
    return { description: vocClass || "Unknown" };
}

function getPollutantDescription(value, type) {
    if (value == null) return "Unknown";
    if (type === "CO"  && value > 10)  return "High";
    if (type === "CO"  && value > 5)   return "Moderate";
    if (type === "CO2" && value > 1000)return "High";
    if (type === "CO2" && value > 600) return "Moderate";
    return "Normal";
}

function updateGaugeDisplay(valueId, descId, value, desc) {
    document.getElementById(valueId).textContent = (value != null ? value : "N/A");
    document.getElementById(descId).textContent  = desc || "Unknown";
}

// --- Fetch & Update ---

async function fetchDataAndUpdateDashboard() {
    try {
        const res  = await fetch(API_ENDPOINT);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();

        // Update each gauge
        const { aqi, voc, vocClass, co, co2, pm25, pm10, temp, pressure, humidity, timestamp } = data;
        const aqiDet = getAQIDetails(aqi);

        updateGaugeDisplay("valueAQI",      "descAQI",      aqi,       aqiDet.description);
        updateGaugeDisplay("valueVOC",      "descVOC",      voc,       getVOCDetails(vocClass).description);
        updateGaugeDisplay("valueCO",       "descCO",       co,        getPollutantDescription(co,  "CO"));
        updateGaugeDisplay("valueCO2",      "descCO2",      co2,       getPollutantDescription(co2, "CO2"));
        updateGaugeDisplay("valuePM25",     "descPM25",     pm25,      getPollutantDescription(pm25,"PM2.5"));
        updateGaugeDisplay("valuePM10",     "descPM10",     pm10,      getPollutantDescription(pm10,"PM10"));
        updateGaugeDisplay("valueTemp",     "descTemp",     temp,      temp    != null ? `${temp}°C`     : null);
        updateGaugeDisplay("valuePressure", "descPressure", pressure, pressure!= null ? `${pressure} hPa` : null);
        updateGaugeDisplay("valueHumidity", "descHumidity", humidity, humidity!= null ? `${humidity}%`    : null);

        // Timestamp
        if (timestamp) {
            document.getElementById("dateTime")
                    .textContent = `Last Updated: ${new Date(timestamp).toLocaleString()}`;
            // Line-chart update
            updateAqiLineChart({ timestamp: new Date(timestamp), aqiValue: aqi });
        }
    } catch (err) {
        console.error("Fetch error:", err);
    }
}

// --- Client clock (fallback) ---
function updateClientDateTime() {
    const now = new Date();
    const el  = document.getElementById("dateTime");
    if (el && !el.textContent.startsWith("Last Updated")) {
        el.textContent = now.toLocaleString();
    }
}

// --- Chart.js setup ---

function initializeCharts() {
    // AQI line chart
    const ctx = document.getElementById("aqiLineChart").getContext("2d");
    aqiLineChartInstance = new Chart(ctx, {
        type: 'line',
        data: { labels: [], datasets: [{ label:'AQI Over Time', data: [], borderColor:'rgb(75,192,192)', tension:0.1 }] },
        options: {
            scales: {
                y: { beginAtZero:true, suggestedMax:300 },
                x: { type:'time', time:{ unit:'minute' } }
            },
            responsive:true, maintainAspectRatio:false
        }
    });
}

const MAX_POINTS = 20;
function updateAqiLineChart({ timestamp, aqiValue }) {
    const c = aqiLineChartInstance;
    if (!c) return;
    c.data.labels.push(timestamp);
    c.data.datasets[0].data.push(aqiValue);
    if (c.data.labels.length > MAX_POINTS) {
        c.data.labels.shift();
        c.data.datasets[0].data.shift();
    }
    c.update();
}

// --- Initialize on load ---

window.onload = () => {
    updateClientDateTime();                 // show initial local time
    setInterval(updateClientDateTime,60000);
    initializeCharts();                     // set up Chart.js
    fetchDataAndUpdateDashboard();          // first fetch
    setInterval(fetchDataAndUpdateDashboard,60000); // every minute
};
