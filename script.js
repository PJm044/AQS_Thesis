// script.js (Handles AQI & VOC Class Display, Interval 60s)

// --- Chart/Gauge Setup ---
const gaugeConfigs = { /* ... same ... */ };
const gaugeData = (value, max, color) => { /* ... same ... */ };
const createGauge = (id, max, color) => { /* ... same ... */ };

// *** MODIFIED: Max value for VOC gauge set to 3 ***
const gauges = {
    aqi: createGauge('gaugeAQI', 500, '#6fcf97'),
    voc: createGauge('gaugeVOC', 3, '#f2994a'), // Max = 3 for Class 0-3
    co: createGauge('gaugeCO', 50, '#f2c94c'),
    // ... other gauges same ...
    humidity: createGauge('gaugeHumidity', 100, '#2f80ed')
};

// --- Description Functions ---
function getAQIDescription(aqi) { /* ... same ... */ }
// *** Use this function for VOC description ***
function getAirQualityLevelDescription(level) { if (level === null || isNaN(level)) return "N/A"; switch (level) { case 0: return "Clean Air"; case 1: return "Slight Pollution"; case 2: return "Moderate Pollution"; case 3: return "Heavy Pollution"; default: return "Unknown"; } }
function getCODescription(co) { /* ... same ... */ }
function getCO2Description(co2) { /* ... same ... */ }
function getPMDescription(pm, type = "pm25") { /* ... same (ensure type param used) ... */ }
function getTempDescription(temp) { /* ... same ... */ }
function getPressureDescription(pressure) { /* ... same ... */ }
function getHumidityDescription(h) { /* ... same ... */ }

// --- Line Chart Setup ---
const lineChartCanvas = document.getElementById('aqiLineChart');
let aqiLineChart = null;
if (lineChartCanvas) { /* ... same chart setup ... */ } else { console.error("Line chart canvas element 'aqiLineChart' not found."); }

// --- Data Fetching and Updating ---
let isFetching = false;
const fetchData = async () => {
    if (isFetching) return;
    isFetching = true;
    const apiEndpoint = 'https://9j1fz04gx1.execute-api.ap-southeast-1.amazonaws.com/prod/sensordata';

    try {
        const res = await fetch(apiEndpoint);
        if (!res.ok) { throw new Error(`HTTP error! status: ${res.status}`); }
        const jsonData = await res.json();
        console.log("Data received:", jsonData);

        // --- Update Gauges ---
        const updateGauge = (gaugeKey, value, max, color) => { /* ... same ... */ };
        updateGauge('aqi', jsonData.aqi, 500, '#6fcf97');
        // *** MODIFIED: Use vocClass for VOC gauge, max=3 ***
        updateGauge('voc', jsonData.vocClass, 3, '#f2994a'); 
        updateGauge('co', jsonData.co, 50, '#f2c94c');
        updateGauge('co2', jsonData.co2, 2000, '#56ccf2');
        updateGauge('pm25', jsonData.pm25, 250, '#bb6bd9');
        updateGauge('pm10', jsonData.pm10, 425, '#eb5757');
        updateGauge('temp', jsonData.temp, 50, '#e91e63');
        updateGauge('pressure', jsonData.pressure, 1100, '#00bcd4');
        updateGauge('humidity', jsonData.humidity, 100, '#2f80ed');

        // --- Update Text Displays ---
        const updateText = (elementId, text) => { /* ... same ... */ };
        updateText('valueAQI', jsonData.aqi !== null ? jsonData.aqi : 'N/A');
        // *** MODIFIED: Display VOC Class ***
        updateText('valueVOC', `Level: ${jsonData.vocClass !== null ? jsonData.vocClass : 'N/A'}`); 
        updateText('valueCO', `${jsonData.co !== null ? jsonData.co.toFixed(1) : 'N/A'} ppm`);
        updateText('valueCO2', `${jsonData.co2 !== null ? jsonData.co2 : 'N/A'} ppm`);
        updateText('valuePM25', `${jsonData.pm25 !== null ? jsonData.pm25.toFixed(1) : 'N/A'} µg/m³`);
        updateText('valuePM10', `${jsonData.pm10 !== null ? jsonData.pm10.toFixed(1) : 'N/A'} µg/m³`);
        updateText('valueTemp', `${jsonData.temp !== null ? jsonData.temp.toFixed(1) : 'N/A'} °C`);
        updateText('valuePressure', `${jsonData.pressure !== null ? jsonData.pressure.toFixed(0) : 'N/A'} hPa`);
        updateText('valueHumidity', `${jsonData.humidity !== null ? jsonData.humidity.toFixed(1) : 'N/A'} %`);

        // --- Update Descriptions ---
        updateText('descAQI', getAQIDescription(jsonData.aqi));
        // *** MODIFIED: Use correct function for VOC description ***
        updateText('descVOC', getAirQualityLevelDescription(jsonData.vocClass)); 
        updateText('descCO', getCODescription(jsonData.co));
        updateText('descCO2', getCO2Description(jsonData.co2));
        updateText('descPM25', getPMDescription(jsonData.pm25, "pm25"));
        updateText('descPM10', getPMDescription(jsonData.pm10, "pm10"));
        updateText('descTemp', getTempDescription(jsonData.temp));
        updateText('descPressure', getPressureDescription(jsonData.pressure));
        updateText('descHumidity', getHumidityDescription(jsonData.humidity));

        // --- Update Line Chart ---
        if (aqiLineChart) { /* ... same chart update logic ... */ }

    } catch (err) { /* ... same error handling ... */
         console.error('Failed to fetch or process data from API:', err);
    } finally {
        isFetching = false;
    }
};

// --- Date/Time Update Function ---
function updateDateTime() { /* ... same ... */ }

// --- Initial calls and intervals ---
document.addEventListener('DOMContentLoaded', () => {
    console.log("DOM Loaded.");
    fetchData(); // Initial fetch
    // *** Interval set to 60 seconds ***
    setInterval(fetchData, 60000); 
    updateDateTime(); // Initial clock update
    setInterval(updateDateTime, 1000);
});
