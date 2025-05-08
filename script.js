// script.js (Updated for AQI and VOC Class display)

// Configuration for all gauges (doughnut chart type)
const gaugeConfigs = {
    type: 'doughnut',
    options: {
        responsive: true,
        maintainAspectRatio: false, // Allows controlling height/width better
        rotation: -90, // Starts the gauge from the top
        circumference: 180, // Makes it a semi-circle
        cutout: '80%', // Adjust for thickness of the gauge
        plugins: {
            tooltip: { enabled: false },
            legend: { display: false }
        }
    }
};

// Function to create the data object for a gauge
const gaugeData = (value, max, color) => {
    const numericValue = (value === null || isNaN(value)) ? 0 : value; // Treat null/NaN as 0 for gauge drawing
    const numericMax = (max === null || isNaN(max) || max <= 0) ? 1 : max; // Ensure max is valid positive number
    const clampedValue = Math.max(0, Math.min(numericValue, numericMax)); // Clamp value between 0 and max
    const remaining = Math.max(0, numericMax - clampedValue);
    return {
        labels: ['Value', 'Remaining'],
        datasets: [{
            data: [clampedValue, remaining],
            backgroundColor: [color, '#e0e0e0'],
            borderWidth: 0
        }]
    };
};

// Function to create a new gauge chart
const createGauge = (canvasId, max, color) => {
    const ctx = document.getElementById(canvasId);
    if (!ctx) {
        console.error(`Canvas element with id ${canvasId} not found.`);
        return null;
    }
     // Set explicit size for canvas container if needed via CSS
    return new Chart(ctx, {
        ...gaugeConfigs,
        data: gaugeData(0, max, color)
    });
};

// --- Gauge Definitions --- Adjust Max values as needed
// Note: Max for voc gauge is set to 3 to represent pollution class 0-3
const gauges = {
    aqi: createGauge('gaugeAQI', 500, '#6fcf97'),      // Max AQI: 500 (Standard)
    voc: createGauge('gaugeVOC', 3, '#f2994a'),        // Max VOC Class: 3
    co: createGauge('gaugeCO', 50, '#f2c94c'),         // Max CO: 50 ppm (Adjust based on expected range/AQI levels)
    co2: createGauge('gaugeCO2', 2000, '#56ccf2'),     // Max CO2: 2000 ppm (Common threshold)
    pm25: createGauge('gaugePM25', 250, '#bb6bd9'),    // Max PM2.5: 250 µg/m³ (~Very Unhealthy/Hazardous threshold)
    pm10: createGauge('gaugePM10', 425, '#eb5757'),    // Max PM10: 425 µg/m³ (~Very Unhealthy/Hazardous threshold)
    temp: createGauge('gaugeTemp', 50, '#e91e63'),     // Max Temp: 50 °C
    pressure: createGauge('gaugePressure', 1100, '#00bcd4'), // Max Pressure: 1100 hPa
    humidity: createGauge('gaugeHumidity', 100, '#2f80ed') // Max Humidity: 100 %
};


// --- Description Functions --- Updated for new ranges/types
function getAQIDescription(aqi) {
    if (aqi === null || isNaN(aqi)) return "N/A";
    if (aqi <= 50) return "Good";
    if (aqi <= 100) return "Moderate";
    if (aqi <= 150) return "Unhealthy for Sensitive Groups";
    if (aqi <= 200) return "Unhealthy";
    if (aqi <= 300) return "Very Unhealthy";
    return "Hazardous";
}

// Renamed function for clarity - describes the 0-3 class from ZP07
function getAirQualityLevelDescription(level) { 
    if (level === null || isNaN(level)) return "N/A";
    switch (level) {
        case 0: return "Clean Air";
        case 1: return "Slight Pollution";
        case 2: return "Moderate Pollution";
        case 3: return "Heavy Pollution";
        default: return "Unknown";
    }
}

function getCODescription(co) { // Based on EPA AQI Breakpoints for 8-hr CO (ppm)
    if (co === null || isNaN(co)) return "N/A";
    if (co <= 4.4) return "Good";
    if (co <= 9.4) return "Moderate";
    if (co <= 12.4) return "Unhealthy for Sensitive Groups";
    if (co <= 15.4) return "Unhealthy";
    if (co <= 30.4) return "Very Unhealthy";
    return "Hazardous";
}

function getCO2Description(co2) { // General CO2 levels (ppm)
    if (co2 === null || isNaN(co2)) return "N/A";
    if (co2 <= 600) return "Excellent";
    if (co2 <= 1000) return "Good";
    if (co2 <= 1500) return "Fair"; // Adjusted level
    if (co2 <= 2000) return "Poor"; // Adjusted level
    return "Very Poor"; // Adjusted level
}

function getPMDescription(pm, type = "pm25") { // Using EPA AQI breakpoints (µg/m³)
    if (pm === null || isNaN(pm)) return "N/A";
    if (type === "pm25") {
        if (pm <= 12.0) return "Good";
        if (pm <= 35.4) return "Moderate";
        if (pm <= 55.4) return "Unhealthy for Sensitive Groups";
        if (pm <= 150.4) return "Unhealthy";
        if (pm <= 250.4) return "Very Unhealthy";
        return "Hazardous";
    } else { // pm10
        if (pm <= 54) return "Good";
        if (pm <= 154) return "Moderate";
        if (pm <= 254) return "Unhealthy for Sensitive Groups";
        if (pm <= 354) return "Unhealthy";
        if (pm <= 424) return "Very Unhealthy";
        return "Hazardous";
    }
}
function getTempDescription(temp) { // °C
    if (temp === null || isNaN(temp)) return "N/A";
    if (temp < 10) return "Cold";
    if (temp < 20) return "Cool";
    if (temp <= 26) return "Comfortable";
    if (temp <= 32) return "Warm";
    return "Hot";
}
function getPressureDescription(pressure) { // hPa
    if (pressure === null || isNaN(pressure)) return "N/A";
    if (pressure < 1000) return "Low";
    if (pressure <= 1020) return "Normal"; 
    return "High";
}
function getHumidityDescription(h) { // %
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
            labels: [], // Timestamps will be added here
            datasets: [ // Add datasets for the values you want to chart
                { label: 'AQI', data: [], borderColor: '#6fcf97', backgroundColor: 'rgba(111, 207, 151, 0.2)', fill: true, tension: 0.3, hidden: false },
                // { label: 'VOC Level', data: [], borderColor: '#f2994a', backgroundColor: 'rgba(242, 153, 74, 0.2)', fill: true, tension: 0.3, hidden: true }, // Charting VOC Class 0-3
                { label: 'CO (ppm)', data: [], borderColor: '#f2c94c', backgroundColor: 'rgba(242, 201, 76, 0.2)', fill: true, tension: 0.3, hidden: true },
                { label: 'CO₂ (ppm)', data: [], borderColor: '#56ccf2', backgroundColor: 'rgba(86, 204, 242, 0.2)', fill: true, tension: 0.3, hidden: true },
                { label: 'PM2.5 (µg/m³)', data: [], borderColor: '#bb6bd9', backgroundColor: 'rgba(187, 107, 217, 0.2)', fill: true, tension: 0.3, hidden: true },
                { label: 'PM10 (µg/m³)', data: [], borderColor: '#eb5757', backgroundColor: 'rgba(235, 87, 87, 0.2)', fill: true, tension: 0.3, hidden: true },
                { label: 'Temp (°C)', data: [], borderColor: '#e91e63', backgroundColor: 'rgba(233, 30, 99, 0.2)', fill: true, tension: 0.3, hidden: true },
                { label: 'Pressure (hPa)', data: [], borderColor: '#00bcd4', backgroundColor: 'rgba(0, 188, 212, 0.2)', fill: true, tension: 0.3, hidden: true },
                { label: 'Humidity (%)', data: [], borderColor: '#2f80ed', backgroundColor: 'rgba(47, 128, 237, 0.2)', fill: true, tension: 0.3, hidden: true }
            ]
        },
        options: {
            scales: {
                y: { beginAtZero: true, ticks: { color: '#CCC' }, grid: { color: 'rgba(204, 204, 204, 0.2)' } },
                x: { ticks: { color: '#CCC' }, grid: { color: 'rgba(204, 204, 204, 0.2)' } }
            },
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { position: 'top', labels: { color: '#CCC' },
                    // Standard legend toggle logic
                    onClick: (e, legendItem, legend) => { Chart.defaults.plugins.legend.onClick(e, legendItem, legend); } 
                },
                tooltip: { mode: 'index', intersect: false }
            }
        }
    });
} else {
    console.error("Line chart canvas element 'aqiLineChart' not found.");
}


// --- Data Fetching and Updating ---
const fetchData = async () => {
    // API Endpoint for the getAirQualityDataLambda function
    const apiEndpoint = 'https://9j1fz04gx1.execute-api.ap-southeast-1.amazonaws.com/prod/sensordata'; 

    try {
        const res = await fetch(apiEndpoint);
        if (!res.ok) {
            // Try to parse error message from response body if available
            let errorDetails = `HTTP error! status: ${res.status} - ${res.statusText}`;
            try {
                 const errorData = await res.json();
                 if(errorData && errorData.message) errorDetails += ` | Message: ${errorData.message}`;
                 if(errorData && errorData.error) errorDetails += ` | Error: ${errorData.error}`;
            } catch (e) { /* Ignore if body isn't JSON */ }
            throw new Error(errorDetails);
        }
        const jsonData = await res.json(); // Data returned by getAirQualityDataLambda
        console.log("Data received from API:", jsonData); // Log received data for debugging

        // --- Update Gauges ---
        const updateGauge = (gaugeKey, value, max, color) => {
            if (gauges[gaugeKey]) {
                 gauges[gaugeKey].data = gaugeData(value, max, color);
                 gauges[gaugeKey].update('none');
            }
        };
        updateGauge('aqi', jsonData.aqi, 500, '#6fcf97');
        updateGauge('voc', jsonData.vocClass, 3, '#f2994a'); // Use vocClass (0-3) for VOC gauge
        updateGauge('co', jsonData.co, 50, '#f2c94c');
        updateGauge('co2', jsonData.co2, 2000, '#56ccf2');
        updateGauge('pm25', jsonData.pm25, 250, '#bb6bd9');
        updateGauge('pm10', jsonData.pm10, 425, '#eb5757');
        updateGauge('temp', jsonData.temp, 50, '#e91e63');
        updateGauge('pressure', jsonData.pressure, 1100, '#00bcd4');
        updateGauge('humidity', jsonData.humidity, 100, '#2f80ed');

        // --- Update Text Displays ---
        const updateText = (elementId, text) => {
            const element = document.getElementById(elementId);
            if (element) element.innerText = (text === null || text === undefined) ? 'N/A' : text;
        };
        updateText('valueAQI', jsonData.aqi);
        updateText('valueVOC', `Level: ${jsonData.vocClass !== null ? jsonData.vocClass : 'N/A'}`); // Display VOC Class
        updateText('valueCO', `${jsonData.co !== null ? jsonData.co.toFixed(1) : 'N/A'} ppm`); // Format CO
        updateText('valueCO2', `${jsonData.co2 !== null ? jsonData.co2 : 'N/A'} ppm`);
        updateText('valuePM25', `${jsonData.pm25 !== null ? jsonData.pm25.toFixed(1) : 'N/A'} µg/m³`);
        updateText('valuePM10', `${jsonData.pm10 !== null ? jsonData.pm10.toFixed(1) : 'N/A'} µg/m³`);
        updateText('valueTemp', `${jsonData.temp !== null ? jsonData.temp.toFixed(1) : 'N/A'} °C`);
        updateText('valuePressure', `${jsonData.pressure !== null ? jsonData.pressure.toFixed(0) : 'N/A'} hPa`); // Integer hPa
        updateText('valueHumidity', `${jsonData.humidity !== null ? jsonData.humidity.toFixed(1) : 'N/A'} %`);

        // --- Update Descriptions ---
        updateText('descAQI', getAQIDescription(jsonData.aqi));
        updateText('descVOC', getAirQualityLevelDescription(jsonData.vocClass)); // Use new function for VOC class
        updateText('descCO', getCODescription(jsonData.co));
        updateText('descCO2', getCO2Description(jsonData.co2));
        updateText('descPM25', getPMDescription(jsonData.pm25, "pm25"));
        updateText('descPM10', getPMDescription(jsonData.pm10, "pm10"));
        updateText('descTemp', getTempDescription(jsonData.temp));
        updateText('descPressure', getPressureDescription(jsonData.pressure));
        updateText('descHumidity', getHumidityDescription(jsonData.humidity));

        // --- Update Line Chart ---
        if (aqiLineChart) {
            const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
            const labels = aqiLineChart.data.labels;
            const datasets = aqiLineChart.data.datasets;
            
            labels.push(now);
            datasets[0].data.push(jsonData.aqi);
            // datasets[1].data.push(jsonData.vocClass); // Add VOC class to chart if desired
            datasets[1].data.push(jsonData.co); // Index 1 is now CO
            datasets[2].data.push(jsonData.co2); // Index 2 is now CO2
            datasets[3].data.push(jsonData.pm25); // Index 3 is now PM2.5
            datasets[4].data.push(jsonData.pm10); // Index 4 is now PM10
            datasets[5].data.push(jsonData.temp); // Index 5 is now Temp
            datasets[6].data.push(jsonData.pressure); // Index 6 is now Pressure
            datasets[7].data.push(jsonData.humidity); // Index 7 is now Humidity

            const maxDataPoints = 30; // Increased number of points
            while (labels.length > maxDataPoints) { // Use while for robustness
                labels.shift();
                datasets.forEach(dataset => {
                    if(dataset.data.length > 0) dataset.data.shift();
                });
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
                if (id.startsWith('value')) el.innerText = 'ERR';
                if (id.startsWith('desc')) el.innerText = 'Load Error';
            }
        });
    }
};

// --- Date/Time Update Function ---
function updateDateTime() {
    const now = new Date();
    // Added timeZone for consistency
    const options = { 
        weekday: "long", year: "numeric", month: "long", day: "numeric", 
        hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: true,
        timeZone: "Asia/Manila" // Use IANA time zone for Quezon City
    };
    const dateTimeElement = document.getElementById("dateTime");
    if (dateTimeElement) {
        try {
            dateTimeElement.textContent = now.toLocaleString("en-US", options);
        } catch (e) { // Fallback if timezone formatting fails in some browsers
             dateTimeElement.textContent = now.toLocaleString("en-US", { /* basic options */ });
             console.error("Error formatting date with timezone:", e);
        }
    }
}

// --- Initial calls and intervals ---
document.addEventListener('DOMContentLoaded', () => {
    console.log("DOM Loaded. Initializing data fetch and timers.");
    fetchData(); // Initial data fetch
    setInterval(fetchData, 30000); // Fetch new data every 30 seconds (adjust as needed)

    updateDateTime(); // Initial date-time update
    setInterval(updateDateTime, 1000); // Update date-time every second
});
