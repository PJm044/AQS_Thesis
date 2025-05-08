// script.js (Based on Original - Fetches AWS Data & Processes in Frontend)

// --- Chart/Gauge Setup (Copied from Original) ---
const gaugeConfigs = { type: 'doughnut', options: { responsive: true, rotation: -90, circumference: 180, cutout: '80%', animation: false, /* Added */ plugins: { tooltip: { enabled: false }, legend: { display: false } } } };
const gaugeData = (value, max, color) => { /* ... (same as original) ... */
    const numericValue = (value === null || isNaN(value)) ? 0 : value; const numericMax = (max === null || isNaN(max) || max <= 0) ? 1 : max; const clampedValue = Math.max(0, Math.min(numericValue, numericMax)); const remaining = Math.max(0, numericMax - clampedValue);
    return { labels: ['Value', 'Remaining'], datasets: [{ data: [clampedValue, remaining], backgroundColor: [color, '#e0e0e0'], borderWidth: 0 }] };
};
const createGauge = (id, max, color) => { /* ... (same as original) ... */
    const ctx = document.getElementById(id); if (!ctx) { console.error(`Canvas ${id} not found.`); return null; } return new Chart(ctx, { ...gaugeConfigs, data: gaugeData(0, max, color) });
};
// --- Gauge Definitions (Copied from Original) ---
// Note: VOC gauge max is 1000, matching original expectation of ppb
const gauges = {
    aqi: createGauge('gaugeAQI', 500, '#f44336'),
    voc: createGauge('gaugeVOC', 1000, '#ff9800'), // Expects ppb
    co: createGauge('gaugeCO', 100, '#ffeb3b'), // Max 100 ppm (adjust?)
    co2: createGauge('gaugeCO2', 2000, '#4caf50'),
    pm25: createGauge('gaugePM25', 200, '#2196f3'), // Max 200 ug/m3 (adjust?)
    pm10: createGauge('gaugePM10', 300, '#9c27b0'), // Max 300 ug/m3 (adjust?)
    temp: createGauge('gaugeTemp', 50, '#e91e63'),
    pressure: createGauge('gaugePressure', 1100, '#00bcd4'),
    humidity: createGauge('gaugeHumidity', 100, '#673ab7')
};

// --- Description Functions (Copied from Original) ---
// These expect data in the original format (e.g., voc in ppb)
function getAQIDescription(aqi) { /* ... (same as original) ... */ }
function getVOCDescription(voc) { /* ... (same as original - expects ppb) ... */ }
function getCO2Description(co2) { /* ... (same as original) ... */ }
function getPMDescription(pm) { /* ... (same as original - simple version) ... */ }
function getCODescription(co) { /* ... (same as original) ... */ }
function getTempDescription(temp) { /* ... (same as original) ... */ }
function getPressureDescription(pressure) { /* ... (same as original) ... */ }
function getHumidityDescription(h) { /* ... (same as original) ... */ }

// --- Line Chart Setup (Copied from Original) ---
const aqiChart = new Chart(document.getElementById('aqiLineChart'), { /* ... (same chart setup as original) ... */ });


// *** ADDED: Placeholder function to estimate VOC ppb from pollution class ***
// You MUST adjust this logic based on how you want to estimate ppb.
// This is a VERY rough example.
function estimateVocFromClass(vocClass, /* you could pass other data like temp, humidity here */) {
    if (vocClass === null || isNaN(vocClass)) return null;
    // Example rough mapping: Class 0 -> 50ppb, 1 -> 300, 2 -> 600, 3 -> 900
    // You could potentially adjust based on temperature etc. if desired.
    switch (vocClass) {
        case 0: return 50;
        case 1: return 300;
        case 2: return 600;
        case 3: return 900;
        default: return null;
    }
}

// --- Data Fetching and Updating (MODIFIED) ---
let isFetching = false;
const fetchData = async () => {
    if (isFetching) return;
    isFetching = true;
    const apiEndpoint = 'https://9j1fz04gx1.execute-api.ap-southeast-1.amazonaws.com/prod/sensordata'; // Your API endpoint

    try {
        // *** REMOVED Simulation data code block ***

        // *** ENABLED Real code ***
        console.log("Fetching data from:", apiEndpoint);
        const res = await fetch(apiEndpoint);
        if (!res.ok) {
            let errorDetails = `HTTP error! status: ${res.status} - ${res.statusText}`;
            try { const errorData = await res.json(); if(errorData && errorData.message) errorDetails = errorData.message; } catch (e) {}
            throw new Error(errorDetails);
        }
        // *** Data received from getAirQualityDataLambda ***
        // This data has fields like aqi, co_ppm, pm2_5, voc_pollution_class, temperature_c etc.
        const rawJsonData = await res.json();
        console.log("Raw data received from API:", rawJsonData);

        // *** ADDED: Process/Map data here to match original script's expectations ***
        const processedJson = {
            aqi: rawJsonData.aqi ?? null,
            // Estimate VOC ppb based on class received from backend
            voc: estimateVocFromClass(rawJsonData.voc_pollution_class /*, pass other rawData fields if needed */),
            co: rawJsonData.co_ppm ?? null, // Use co_ppm as co
            co2: rawJsonData.co2_ppm ?? null, // Use co2_ppm as co2
            pm25: rawJsonData.pm2_5 ?? null, // Use pm2_5 as pm25
            pm10: rawJsonData.pm10_0 ?? null, // Use pm10_0 as pm10
            temp: rawJsonData.temperature_c ?? null, // Use temperature_c as temp
            pressure: rawJsonData.pressure_hpa ?? null, // Use pressure_hpa as pressure
            humidity: rawJsonData.humidity_percent ?? null, // Use humidity_percent as humidity
            // Add other fields if the original script used them directly
        };
        console.log("Processed data for UI:", processedJson);

        // --- Update UI (Using original logic with processedJson) ---
        // Use the 'processedJson' object which now has the expected field names/formats
        gauges.aqi.data = gaugeData(processedJson.aqi, 500, '#f44336');
        gauges.voc.data = gaugeData(processedJson.voc, 1000, '#ff9800'); // Uses estimated ppb
        gauges.co.data = gaugeData(processedJson.co, 100, '#ffeb3b');
        gauges.co2.data = gaugeData(processedJson.co2, 2000, '#4caf50');
        gauges.pm25.data = gaugeData(processedJson.pm25, 200, '#2196f3');
        gauges.pm10.data = gaugeData(processedJson.pm10, 300, '#9c27b0');
        gauges.temp.data = gaugeData(processedJson.temp, 50, '#e91e63');
        gauges.pressure.data = gaugeData(processedJson.pressure, 1100, '#00bcd4');
        gauges.humidity.data = gaugeData(processedJson.humidity, 100, '#673ab7');

        for (let key in gauges) { if(gauges[key]) gauges[key].update('none'); }

        // Update text using processedJson fields
        document.getElementById('valueAQI').innerText = `${processedJson.aqi ?? 'N/A'}`;
        document.getElementById('valueVOC').innerText = `${processedJson.voc ?? 'N/A'} ppb`; // Shows estimated ppb
        document.getElementById('valueCO').innerText = `${processedJson.co !== null ? processedJson.co.toFixed(1) : 'N/A'} ppm`;
        document.getElementById('valueCO2').innerText = `${processedJson.co2 ?? 'N/A'} ppm`;
        document.getElementById('valuePM25').innerText = `${processedJson.pm25 !== null ? processedJson.pm25.toFixed(1) : 'N/A'} µg/m³`;
        document.getElementById('valuePM10').innerText = `${processedJson.pm10 !== null ? processedJson.pm10.toFixed(1) : 'N/A'} µg/m³`;
        document.getElementById('valueTemp').innerText = `${processedJson.temp !== null ? processedJson.temp.toFixed(1) : 'N/A'} °C`;
        document.getElementById('valuePressure').innerText = `${processedJson.pressure !== null ? processedJson.pressure.toFixed(0) : 'N/A'} hPa`;
        document.getElementById('valueHumidity').innerText = `${processedJson.humidity !== null ? processedJson.humidity.toFixed(1) : 'N/A'} %`;

        // Update descriptions using processedJson fields and original functions
        document.getElementById('descAQI').innerText = getAQIDescription(processedJson.aqi);
        document.getElementById('descVOC').innerText = getVOCDescription(processedJson.voc); // Uses estimated ppb
        document.getElementById('descCO').innerText = getCODescription(processedJson.co);
        document.getElementById('descCO2').innerText = getCO2Description(processedJson.co2);
        document.getElementById('descPM25').innerText = getPMDescription(processedJson.pm25); // Uses original PM func
        document.getElementById('descPM10').innerText = getPMDescription(processedJson.pm10); // Uses original PM func
        document.getElementById('descTemp').innerText = getTempDescription(processedJson.temp);
        document.getElementById('descPressure').innerText = getPressureDescription(processedJson.pressure);
        document.getElementById('descHumidity').innerText = getHumidityDescription(processedJson.humidity);

        // Update line chart using processedJson fields
        const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        const ds = aqiChart.data.datasets;
        aqiChart.data.labels.push(now);
        ds[0].data.push(processedJson.aqi ?? null);
        ds[1].data.push(processedJson.voc ?? null); // Pushing estimated ppb
        ds[2].data.push(processedJson.co ?? null);
        ds[3].data.push(processedJson.co2 ?? null);
        ds[4].data.push(processedJson.pm25 ?? null);
        ds[5].data.push(processedJson.pm10 ?? null);
        ds[6].data.push(processedJson.temp ?? null);
        ds[7].data.push(processedJson.pressure ?? null);
        ds[8].data.push(processedJson.humidity ?? null);

        if (aqiChart.data.labels.length > 20) { /* ... (limit history) ... */ }
        aqiChart.update('none');

    } catch (err) {
        console.error('Failed to fetch or process data from API:', err);
        // Optional: Add simple UI error display here if needed
        // e.g., document.getElementById('valueAQI').innerText = 'ERR';
    } finally {
        isFetching = false;
    }
};

// *** MODIFIED: Interval increased to 60 seconds for performance ***
setInterval(fetchData, 60000); // Fetch every 60 seconds
fetchData(); // Initial fetch

// --- Date/Time Update Function (Copied from Original) ---
function updateDateTime() { /* ... (same as original) ... */ }
setInterval(updateDateTime, 1000);
updateDateTime();

// Original Daft Punk comment
// ...
