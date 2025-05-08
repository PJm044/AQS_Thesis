// script.js

// Replace this with your actual API Gateway Invoke URL
const API_ENDPOINT = 'https://your-api-id.execute-api.us-east-1.amazonaws.com/prod/data';

let aqiLineChartInstance;

function getAQIDetails(aqi) {
    if (aqi === null || aqi === undefined) return { description: "Unknown", color: "#cccccc" };
    if (aqi <= 50) return { description: "Good", color: "#00e400" };
    if (aqi <= 100) return { description: "Moderate", color: "#ffff00" };
    if (aqi <= 150) return { description: "Unhealthy for Sensitive Groups", color: "#ff7e00" };
    if (aqi <= 200) return { description: "Unhealthy", color: "#ff0000" };
    if (aqi <= 300) return { description: "Very Unhealthy", color: "#8f3f97" };
    return { description: "Hazardous", color: "#7e0023" };
}

function getVOCDetails(vocClass) {
    return { description: vocClass || "Unknown" };
}

function getPollutantDescription(value, type) {
    if (value === null || value === undefined) return "Unknown";
    if (type === "CO" && value > 10) return "High";
    if (type === "CO" && value > 5) return "Moderate";
    if (type === "CO2" && value > 1000) return "High";
    if (type === "CO2" && value > 600) return "Moderate";
    return "Normal";
}

function updateGaugeDisplay(valueId, descId, value, desc) {
    const valEl = document.getElementById(valueId);
    const descEl = document.getElementById(descId);
    if (valEl) valEl.textContent = value ?? 'N/A';
    if (descEl) descEl.textContent = desc ?? 'Unknown';
}

async function fetchDataAndUpdateDashboard() {
    try {
        const res = await fetch(API_ENDPOINT);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        console.log("Received:", data);

        const aqi = data.aqi ?? null;
        const voc = data.voc ?? null;
        const vocClass = data.vocClass ?? "Unknown";

        updateGaugeDisplay("valueAQI", "descAQI", aqi, getAQIDetails(aqi).description);
        updateGaugeDisplay("valueVOC", "descVOC", voc, vocClass);
        updateGaugeDisplay("valueCO", "descCO", data.co, getPollutantDescription(data.co, "CO"));
        updateGaugeDisplay("valueCO2", "descCO2", data.co2, getPollutantDescription(data.co2, "CO2"));
        updateGaugeDisplay("valuePM25", "descPM25", data.pm25, getPollutantDescription(data.pm25, "PM2.5"));
        updateGaugeDisplay("valuePM10", "descPM10", data.pm10, getPollutantDescription(data.pm10, "PM10"));
        updateGaugeDisplay("valueTemp", "descTemp", data.temp, `${data.temp}°C`);
        updateGaugeDisplay("valuePressure", "descPressure", data.pressure, `${data.pressure} hPa`);
        updateGaugeDisplay("valueHumidity", "descHumidity", data.humidity, `${data.humidity}%`);

        const tsEl = document.getElementById("dateTime");
        if (tsEl && data.timestamp) {
            tsEl.textContent = `Last Updated: ${new Date(data.timestamp).toLocaleString()}`;
        }

        if (aqi && data.timestamp) {
            updateAqiLineChart({ timestamp: new Date(data.timestamp), aqiValue: aqi });
        }
    } catch (err) {
        console.error("Fetch error:", err);
    }
}

function updateClientDateTime() {
    const now = new Date();
    const tsEl = document.getElementById("dateTime");
    if (tsEl && !tsEl.textContent.startsWith("Last Updated")) {
        tsEl.textContent = now.toLocaleString();
    }
}

function initializeCharts() {
    const ctx = document.getElementById("aqiLineChart").getContext("2d");
    aqiLineChartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels: [],
            datasets: [{
                label: 'AQI Over Time',
                data: [],
                borderColor: 'rgb(75, 192, 192)',
                tension: 0.1
            }]
        },
        options: {
            scales: {
                y: { beginAtZero: true, suggestedMax: 300 },
                x: { type: 'time', time: { unit: 'minute' } }
            },
            responsive: true,
            maintainAspectRatio: false
        }
    });
}

const MAX_DATA_POINTS = 20;
function updateAqiLineChart({ timestamp, aqiValue }) {
    if (!aqiLineChartInstance) return;
    const chart = aqiLineChartInstance;
    chart.data.labels.push(timestamp);
    chart.data.datasets[0].data.push(aqiValue);
    if (chart.data.labels.length > MAX_DATA_POINTS) {
        chart.data.labels.shift();
        chart.data.datasets[0].data.shift();
    }
    chart.update();
}

window.onload = () => {
    updateClientDateTime();
    setInterval(updateClientDateTime, 60000);
    initializeCharts();
    fetchDataAndUpdateDashboard();
    setInterval(fetchDataAndUpdateDashboard, 60000);
};
