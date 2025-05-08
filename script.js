// script.js (Fully Edited for API Fetching)

// Configuration for all gauges (doughnut chart type)
const gaugeConfigs = {
    type: 'doughnut',
    options: {
        responsive: true,
        rotation: -90, // Starts the gauge from the top
        circumference: 180, // Makes it a semi-circle
        cutout: '80%', // Adjust for thickness of the gauge
        plugins: {
            tooltip: {
                enabled: false // Disable tooltips on gauges
            },
            legend: {
                display: false // Hide legend for gauges
            }
        }
    }
};

// Function to create the data object for a gauge
const gaugeData = (value, max, color) => ({
    labels: ['Value', 'Remaining'],
    datasets: [{
        data: [value, Math.max(0, max - value)], // Ensure remaining is not negative
        backgroundColor: [color, '#e0e0e0'],
        borderWidth: 0
    }]
});

// Function to create a new gauge chart
const createGauge = (canvasId, max, color) => {
    const ctx = document.getElementById(canvasId);
    if (!ctx) {
        console.error(`Canvas element with id ${canvasId} not found.`);
        return null;
    }
    return new Chart(ctx, {
        ...gaugeConfigs,
        data: gaugeData(0, max, color) // Initial data (0 value)
    });
};

// Initialize all gauges
const gauges = {
    aqi: createGauge('gaugeAQI', 500, '#f44336'),
    voc: createGauge('gaugeVOC', 1000, '#ff9800'),
    co: createGauge('gaugeCO', 100, '#ffeb3b'),
    co2: createGauge('gaugeCO2', 2000, '#4caf50'),
    pm25: createGauge('gaugePM25', 200, '#2196f3'),
    pm10: createGauge('gaugePM10', 300, '#9c27b0'),
    temp: createGauge('gaugeTemp', 50, '#e91e63'),
    pressure: createGauge('gaugePressure', 1100, '#00bcd4'),
    humidity: createGauge('gaugeHumidity', 100, '#673ab7')
};

// --- Description Functions (copied from your original, with PM description enhanced) ---
function getAQIDescription(aqi) {
    if (aqi === null || isNaN(aqi)) return "N/A";
    if (aqi <= 50) return "Good";
    if (aqi <= 100) return "Moderate";
    if (aqi <= 150) return "Unhealthy for Sensitive Groups";
    if (aqi <= 200) return "Unhealthy";
    if (aqi <= 300) return "Very Unhealthy";
    return "Hazardous";
}
function getVOCDescription(voc) {
    if (voc === null || isNaN(voc)) return "N/A";
    if (voc <= 200) return "Good";
    if (voc <= 400) return "Moderate";
    if (voc <= 800) return "Unhealthy";
    return "Very Unhealthy";
}
function getCODescription(co) {
    if (co === null || isNaN(co)) return "N/A";
    if (co <= 4.4) return "Good";
    if (co <= 9.4) return "Moderate";
    if (co <= 12.4) return "Unhealthy for Sensitive Groups";
    if (co <= 15.4) return "Unhealthy";
    if (co <= 30.4) return "Very Unhealthy";
    return "Hazardous";
}
function getCO2Description(co2) {
    if (co2 === null || isNaN(co2)) return "N/A";
    if (co2 <= 600) return "Excellent";
    if (co2 <= 1000) return "Good";
    if (co2 <= 2000) return "Moderate";
    return "Unhealthy";
}
function getPMDescription(pm, type = "pm25") { // General PM levels µg/m³
    if (pm === null || isNaN(pm)) return "N/A";
    if (type === "pm25") {
        if (pm <= 12.0) return "Good";
        if (pm <= 35.4) return "Moderate";
        if (pm <= 55.4) return "Unhealthy for Sensitive Groups";
        if (pm <= 150.4) return "Unhealthy";
        if (pm <= 250.4) return "Very Unhealthy";
        return "Hazardous";
    } else { // PM10
        if (pm <= 54) return "Good";
        if (pm <= 154) return "Moderate";
        if (pm <= 254) return "Unhealthy for Sensitive Groups";
        if (pm <= 354) return "Unhealthy";
        if (pm <= 424) return "Very Unhealthy";
        return "Hazardous";
    }
}
function getTempDescription(temp) {
    if (temp === null || isNaN(temp)) return "N/A";
    if (temp < 10) return "Cold";
    if (temp < 20) return "Cool";
    if (temp <= 26) return "Comfortable";
    if (temp <= 32) return "Warm";
    return "Hot";
}
function getPressureDescription(pressure) {
    if (pressure === null || isNaN(pressure)) return "N/A";
    if (pressure < 1000) return "Low";
    if (pressure <= 1020) return "Normal";
    return "High";
}
function getHumidityDescription(h) {
    if (h === null || isNaN(h)) return "N/A";
    if (h < 30) return "Dry";
    if (h <= 60) return "Comfortable";
    if (h <= 70) return "Humid";
    return "Very Humid";
}

// --- Line Chart Setup ---
const lineChartCanvas = document.getElementById('aqiLineChart');
let aqiLineChart = null;

if (lineChartCanvas) {
    aqiLineChart = new Chart(lineChartCanvas, {
        type: 'line',
        data: {
            labels: [], // Timestamps
            datasets: [
                { label: 'AQI', data: [], borderColor: '#f44336', backgroundColor: 'rgba(244, 67, 54, 0.2)', fill: true, tension: 0.3, hidden: false },
                { label: 'VOC (ppb)', data: [], borderColor: '#ff9800', backgroundColor: 'rgba(255, 152, 0, 0.2)', fill: true, tension: 0.3, hidden: true },
                { label: 'CO (ppm)', data: [], borderColor: '#ffeb3b', backgroundColor: 'rgba(255, 235, 59, 0.2)', fill: true, tension: 0.3, hidden: true },
                { label: 'CO₂ (ppm)', data: [], borderColor: '#4caf50', backgroundColor: 'rgba(76, 175, 80, 0.2)', fill: true, tension: 0.3, hidden: true },
                { label: 'PM2.5 (µg/m³)', data: [], borderColor: '#2196f3', backgroundColor: 'rgba(33, 150, 243, 0.2)', fill: true, tension: 0.3, hidden: true },
                { label: 'PM10 (µg/m³)', data: [], borderColor: '#9c27b0', backgroundColor: 'rgba(156, 39, 176, 0.2)', fill: true, tension: 0.3, hidden: true },
                { label: 'Temperature (°C)', data: [], borderColor: '#e91e63', backgroundColor: 'rgba(233, 30, 99, 0.2)', fill: true, tension: 0.3, hidden: true },
                { label: 'Pressure (hPa)', data: [], borderColor: '#00bcd4', backgroundColor: 'rgba(0, 188, 212, 0.2)', fill: true, tension: 0.3, hidden: true },
                { label: 'Humidity (%)', data: [], borderColor: '#673ab7', backgroundColor: 'rgba(103, 58, 183, 0.2)', fill: true, tension: 0.3, hidden: true }
            ]
        },
        options: {
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        color: '#CCC' // Y-axis tick color for better visibility on dark background
                    },
                    grid: {
                        color: 'rgba(204, 204, 204, 0.2)' // Y-axis grid line color
                    }
                },
                x: {
                    ticks: {
                        color: '#CCC' // X-axis tick color
                    },
                    grid: {
                        color: 'rgba(204, 204, 204, 0.2)' // X-axis grid line color
                    }
                }
            },
            responsive: true,
            plugins: {
                legend: {
                    position: 'top',
                    labels: {
                        color: '#CCC' // Legend label color
                    },
                    onClick: (e, legendItem, legend) => {
                        const index = legendItem.datasetIndex;
                        const ci = legend.chart;
                        if (ci.isDatasetVisible(index)) {
                            ci.hide(index);
                            legendItem.hidden = true;
                        } else {
                            ci.show(index);
                            legendItem.hidden = false;
                        }
                    }
                },
                tooltip: {
                    mode: 'index',
                    intersect: false
                }
            }
        }
    });
} else {
    console.error("Line chart canvas element 'aqiLineChart' not found.");
}

// --- Data Fetching and Updating ---
const fetchData = async () => {
    // YOUR SPECIFIC API GATEWAY ENDPOINT:
    const apiEndpoint = 'https://9j1fz04gx1.execute-api.ap-southeast-1.amazonaws.com/prod/sensordata';

    try {
        const res = await fetch(apiEndpoint);
        if (!res.ok) {
            // Try to get more specific error message from response if available
            let errorText = res.statusText;
            try {
                const errorBody = await res.json(); // Or .text() if not JSON
                if (errorBody && errorBody.message) {
                    errorText = errorBody.message;
                }
            } catch (parseError) {
                // Ignore if response body isn't helpful JSON
            }
            throw new Error(`HTTP error! Status: ${res.status} - ${errorText}`);
        }
        const jsonData = await res.json();

        // Update gauges
        const updateGaugeIfExists = (gaugeKey, value, max, color) => {
            if (gauges[gaugeKey]) {
                gauges[gaugeKey].data = gaugeData(value, max, color);
                gauges[gaugeKey].update('none');
            }
        };
        updateGaugeIfExists('aqi', jsonData.aqi, 500, '#f44336');
        updateGaugeIfExists('voc', jsonData.voc, 1000, '#ff9800');
        updateGaugeIfExists('co', jsonData.co, 100, '#ffeb3b');
        updateGaugeIfExists('co2', jsonData.co2, 2000, '#4caf50');
        updateGaugeIfExists('pm25', jsonData.pm25, 200, '#2196f3');
        updateGaugeIfExists('pm10', jsonData.pm10, 300, '#9c27b0');
        updateGaugeIfExists('temp', jsonData.temp, 50, '#e91e63');
        updateGaugeIfExists('pressure', jsonData.pressure, 1100, '#00bcd4');
        updateGaugeIfExists('humidity', jsonData.humidity, 100, '#673ab7');
        
        // Update value displays
        const updateTextIfExists = (elementId, text) => {
            const element = document.getElementById(elementId);
            if (element) element.innerText = text;
        };
        updateTextIfExists('valueAQI', `${jsonData.aqi !== null && !isNaN(jsonData.aqi) ? jsonData.aqi : 'N/A'}`);
        updateTextIfExists('valueVOC', `${jsonData.voc !== null && !isNaN(jsonData.voc) ? jsonData.voc : 'N/A'} ppb`);
        updateTextIfExists('valueCO', `${jsonData.co !== null && !isNaN(jsonData.co) ? jsonData.co : 'N/A'} ppm`);
        updateTextIfExists('valueCO2', `${jsonData.co2 !== null && !isNaN(jsonData.co2) ? jsonData.co2 : 'N/A'} ppm`);
        updateTextIfExists('valuePM25', `${jsonData.pm25 !== null && !isNaN(jsonData.pm25) ? jsonData.pm25 : 'N/A'} µg/m³`);
        updateTextIfExists('valuePM10', `${jsonData.pm10 !== null && !isNaN(jsonData.pm10) ? jsonData.pm10 : 'N/A'} µg/m³`);
        updateTextIfExists('valueTemp', `${jsonData.temp !== null && !isNaN(jsonData.temp) ? jsonData.temp : 'N/A'} °C`);
        updateTextIfExists('valuePressure', `${jsonData.pressure !== null && !isNaN(jsonData.pressure) ? jsonData.pressure : 'N/A'} hPa`);
        updateTextIfExists('valueHumidity', `${jsonData.humidity !== null && !isNaN(jsonData.humidity) ? jsonData.humidity : 'N/A'} %`);

        // Update description displays
        updateTextIfExists('descAQI', getAQIDescription(jsonData.aqi));
        updateTextIfExists('descVOC', getVOCDescription(jsonData.voc));
        updateTextIfExists('descCO', getCODescription(jsonData.co));
        updateTextIfExists('descCO2', getCO2Description(jsonData.co2));
        updateTextIfExists('descPM25', getPMDescription(jsonData.pm25, "pm25"));
        updateTextIfExists('descPM10', getPMDescription(jsonData.pm10, "pm10"));
        updateTextIfExists('descTemp', getTempDescription(jsonData.temp));
        updateTextIfExists('descPressure', getPressureDescription(jsonData.pressure));
        updateTextIfExists('descHumidity', getHumidityDescription(jsonData.humidity));

        // Update line chart
        if (aqiLineChart) {
            const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
            aqiLineChart.data.labels.push(now);
            const datasets = aqiLineChart.data.datasets;
            datasets[0].data.push(jsonData.aqi);
            datasets[1].data.push(jsonData.voc);
            datasets[2].data.push(jsonData.co);
            datasets[3].data.push(jsonData.co2);
            datasets[4].data.push(jsonData.pm25);
            datasets[5].data.push(jsonData.pm10);
            datasets[6].data.push(jsonData.temp);
            datasets[7].data.push(jsonData.pressure);
            datasets[8].data.push(jsonData.humidity);

            const maxDataPoints = 20;
            if (aqiLineChart.data.labels.length > maxDataPoints) {
                aqiLineChart.data.labels.shift();
                datasets.forEach(dataset => dataset.data.shift());
            }
            aqiLineChart.update('none');
        }

    } catch (err) {
        console.error('Failed to fetch or process data from API:', err);
        // Display error to user on the page
        const errorDisplayIds = ['valueAQI', 'descAQI', 'valueVOC', 'descVOC', 'valueCO', 'descCO', 'valueCO2', 'descCO2', 'valuePM25', 'descPM25', 'valuePM10', 'descPM10', 'valueTemp', 'descTemp', 'valuePressure', 'descPressure', 'valueHumidity', 'descHumidity'];
        errorDisplayIds.forEach(id => {
            const el = document.getElementById(id);
            if (el) {
                if (id.startsWith('value')) el.innerText = 'N/A';
                if (id.startsWith('desc')) el.innerText = 'Error loading';
            }
        });
        // If the error is critical, you might want to stop trying to fetch
        // For now, it will keep trying based on the interval
    }
};

// Function to update date and time display
function updateDateTime() {
    const now = new Date();
    // Using a unique variable name for options to avoid potential global conflicts
    const dateTimeFormattingOptions = {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: true
    };
    const dateTimeElement = document.getElementById("dateTime");
    if (dateTimeElement) {
        dateTimeElement.textContent = now.toLocaleString("en-US", dateTimeFormattingOptions);
    }
}

// --- Initial calls and intervals ---
document.addEventListener('DOMContentLoaded', () => {
    fetchData(); // Initial data fetch when DOM is ready
    setInterval(fetchData, 15000); // Fetch new data every 15 seconds (adjust as needed)

    updateDateTime(); // Initial date-time update
    setInterval(updateDateTime, 1000); // Update date-time every second
});

// Your "Daft Punk" comment block can remain here if you like :)
// Work it, make it, do it, makes us
// Harder, better, faster, stronger
// More than, hour, hour, never, ever, after, work is, over
// Work it harder, make it better, Do it faster, makes us stronger
// More than ever, hour after hour, Work is never over
