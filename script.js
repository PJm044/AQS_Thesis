// script.js (Based on Your Uploaded Original - Connects to AWS, Displays VOC Class)

// --- Chart/Gauge Setup (Copied from Your Uploaded Original) ---
const gaugeConfigs = { type: 'doughnut', options: { responsive: true, rotation: -90, circumference: 180, cutout: '80%', animation: false, /* Added */ plugins: { tooltip: { enabled: false }, legend: { display: false } } } };
const gaugeData = (value, max, color) => { const numericValue = (value === null || isNaN(value)) ? 0 : value; const numericMax = (max === null || isNaN(max) || max <= 0) ? 1 : max; const clampedValue = Math.max(0, Math.min(numericValue, numericMax)); const remaining = Math.max(0, numericMax - clampedValue); return { labels: ['Value', 'Remaining'], datasets: [{ data: [clampedValue, remaining], backgroundColor: [color, '#e0e0e0'], borderWidth: 0 }] }; };
const createGauge = (id, max, color) => { const ctx = document.getElementById(id); if (!ctx) { console.error(`Canvas ${id} not found.`); return null; } return new Chart(ctx, { ...gaugeConfigs, data: gaugeData(0, max, color) }); };

// *** MODIFIED: Max for VOC gauge set to 3 (for Class 0-3) ***
const gauges = {
    aqi: createGauge('gaugeAQI', 500, '#f44336'),
    voc: createGauge('gaugeVOC', 3, '#ff9800'), // Max is 3 for the class
    co: createGauge('gaugeCO', 100, '#ffeb3b'), // Original max
    co2: createGauge('gaugeCO2', 2000, '#4caf50'),
    pm25: createGauge('gaugePM25', 200, '#2196f3'),
    pm10: createGauge('gaugePM10', 300, '#9c27b0'),
    temp: createGauge('gaugeTemp', 50, '#e91e63'),
    pressure: createGauge('gaugePressure', 1100, '#00bcd4'),
    humidity: createGauge('gaugeHumidity', 100, '#673ab7')
};

// --- Original Description Functions ---
function getAQIDescription(aqi) { if (aqi === null || isNaN(aqi)) return "N/A"; if (aqi <= 50) return "Good"; if (aqi <= 100) return "Moderate"; /* ... rest */ return "Hazardous"; }
// We won't use the original getVOCDescription as it expects ppb
// function getVOCDescription(voc) { if (voc <= 200) return "Good"; /* ... rest */ }
function getCO2Description(co2) { if (co2 === null || isNaN(co2)) return "N/A"; if (co2 <= 600) return "Good"; /* ... rest */ return "Very Unhealthy"; }
function getPMDescription(pm) { if (pm === null || isNaN(pm)) return "N/A"; if (pm <= 12) return "Good"; /* ... rest */ return "Very Unhealthy"; }
function getCODescription(co) { if (co === null || isNaN(co)) return "N/A"; if (co <= 4.4) return "Good"; /* ... rest */ return "Very Unhealthy"; }
function getTempDescription(temp) { if (temp === null || isNaN(temp)) return "N/A"; if (temp <= 10) return "Cold"; /* ... rest */ return "Hot"; }
function getPressureDescription(pressure) { if (pressure === null || isNaN(pressure)) return "N/A"; if (pressure < 1000) return "Low Pressure"; /* ... rest */ return "High Pressure"; }
function getHumidityDescription(h) { if (h === null || isNaN(h)) return "N/A"; if (h < 30) return "Dry"; /* ... rest */ return "Humid";}

// *** ADDED: Function to describe the VOC pollution class ***
function getVocClassDescription(level) {
    if (level === null || isNaN(level)) return "N/A";
    switch (level) {
        case 0: return "Clean Air";        // From ZP07 Datasheet
        case 1: return "Slight Pollution"; // From ZP07 Datasheet
        case 2: return "Moderate Pollution"; // From ZP07 Datasheet (Middle -> Moderate)
        case 3: return "Heavy Pollution";  // From ZP07 Datasheet
        default: return "Unknown";
    }
}

// --- Line Chart Setup (Copied from Original) ---
// Note: Dataset label for VOC might be misleading if kept as "VOC (ppb)"
const aqiChart = new Chart(document.getElementById('aqiLineChart'), {
  type: 'line',
  data: { labels: [], datasets: [ { label: 'AQI', data: [], borderColor: '#f44336', /* ... */ }, { label: 'VOC Level', data: [], borderColor: '#ff9800', /* ... MODIFIED LABEL */ }, { label: 'CO (ppm)', data: [], borderColor: '#ffeb3b', /* ... */ }, { label: 'CO₂ (ppm)', data: [], borderColor: '#4caf50', /* ... */ }, { label: 'PM2.5', data: [], borderColor: '#2196f3', /* Shortened Label */ }, { label: 'PM10', data: [], borderColor: '#9c27b0', /* Shortened Label */ }, { label: 'Temp (°C)', data: [], borderColor: '#e91e63', /* ... */ }, { label: 'Pressure', data: [], borderColor: '#00bcd4', /* Shortened Label */ }, { label: 'Humidity (%)', data: [], borderColor: '#673ab7', /* ... */ } ] },
  options: { scales: { y: { beginAtZero: true } }, responsive: true, animation: false, plugins: { legend: { position: 'top' } } }
});

// --- Data Fetching and Updating (MODIFIED) ---
let isFetching = false;
const fetchData = async () => {
    if (isFetching) return;
    isFetching = true;
    const apiEndpoint = 'https://9j1fz04gx1.execute-api.ap-southeast-1.amazonaws.com/prod/sensordata'; // Your API endpoint

    try {
        // *** Simulation code REMOVED ***

        // *** Real fetch code ENABLED ***
        console.log("Fetching data from API...");
        const res = await fetch(apiEndpoint);
         if (!res.ok) { throw new Error(`HTTP error! status: ${res.status}`); }
        
        // *** Data 'json' comes from API Gateway / Lambda ***
        // This script now expects the Lambda to send fields like:
        // aqi, vocClass, co, co2, pm25, pm10, temp, pressure, humidity
        const json = await res.json();
        console.log("Data received from API:", json);

        // --- Update UI using received 'json' data ---
        const updateGauge = (gaugeKey, value, max, color) => { if (gauges[gaugeKey]) { gauges[gaugeKey].data = gaugeData(value, max, color); gauges[gaugeKey].update('none'); } };
        
        updateGauge('aqi', json.aqi, 500, '#f44336');
        updateGauge('voc', json.vocClass, 3, '#ff9800'); // Use vocClass (0-3) for gauge
        updateGauge('co', json.co, 100, '#ffeb3b'); // Use co
        updateGauge('co2', json.co2, 2000, '#4caf50'); // Use co2
        updateGauge('pm25', json.pm25, 200, '#2196f3'); // Use pm25
        updateGauge('pm10', json.pm10, 300, '#9c27b0'); // Use pm10
        updateGauge('temp', json.temp, 50, '#e91e63'); // Use temp
        updateGauge('pressure', json.pressure, 1100, '#00bcd4'); // Use pressure
        updateGauge('humidity', json.humidity, 100, '#673ab7'); // Use humidity

        for (let key in gauges) { if(gauges[key]) gauges[key].update('none'); }

        // Update text displays
        const updateText = (elementId, text) => { const el = document.getElementById(elementId); if (el) el.innerText = (text === null || text === undefined) ? 'N/A' : text; };
        updateText('valueAQI', json.aqi);
        // *** MODIFIED: Display VOC Class level ***
        updateText('valueVOC', `Level: ${json.vocClass ?? 'N/A'}`);
        updateText('valueCO', `${json.co !== null ? Number(json.co).toFixed(1) : 'N/A'} ppm`);
        updateText('valueCO2', `${json.co2 ?? 'N/A'} ppm`);
        updateText('valuePM25', `${json.pm25 !== null ? Number(json.pm25).toFixed(1) : 'N/A'} µg/m³`);
        updateText('valuePM10', `${json.pm10 !== null ? Number(json.pm10).toFixed(1) : 'N/A'} µg/m³`);
        updateText('valueTemp', `${json.temp !== null ? Number(json.temp).toFixed(1) : 'N/A'} °C`);
        updateText('valuePressure', `${json.pressure !== null ? Number(json.pressure).toFixed(0) : 'N/A'} hPa`);
        updateText('valueHumidity', `${json.humidity !== null ? Number(json.humidity).toFixed(1) : 'N/A'} %`);

        // Update descriptions
        updateText('descAQI', getAQIDescription(json.aqi));
        // *** MODIFIED: Use new description function for VOC class ***
        updateText('descVOC', getVocClassDescription(json.vocClass));
        updateText('descCO', getCODescription(json.co));
        updateText('descCO2', getCO2Description(json.co2));
        updateText('descPM25', getPMDescription(json.pm25)); // Use original simple PM func
        updateText('descPM10', getPMDescription(json.pm10)); // Use original simple PM func
        updateText('descTemp', getTempDescription(json.temp));
        updateText('descPressure', getPressureDescription(json.pressure));
        updateText('descHumidity', getHumidityDescription(json.humidity));

        // Update line chart
        const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        const ds = aqiChart.data.datasets;
        aqiChart.data.labels.push(now);
        ds[0].data.push(json.aqi ?? null);
        ds[1].data.push(json.vocClass ?? null); // *** Push VOC class to chart ***
        ds[2].data.push(json.co ?? null);
        ds[3].data.push(json.co2 ?? null);
        ds[4].data.push(json.pm25 ?? null);
        ds[5].data.push(json.pm10 ?? null);
        ds[6].data.push(json.temp ?? null);
        ds[7].data.push(json.pressure ?? null);
        ds[8].data.push(json.humidity ?? null);

        if (aqiChart.data.labels.length > 20) { aqiChart.data.labels.shift(); ds.forEach(d => { if(d.data.length > 0) d.data.shift(); }); }
        aqiChart.update('none');

    } catch (err) {
        console.error('Failed to fetch or process data from API:', err);
         const errorIds = ['valueAQI','valueVOC','valueCO','valueCO2','valuePM25','valuePM10','valueTemp','valuePressure','valueHumidity', 'descAQI','descVOC','descCO','descCO2','descPM25','descPM10','descTemp','descPressure','descHumidity'];
         errorIds.forEach(id => { const el = document.getElementById(id); if (el) el.innerText = 'ERR'; });
    } finally {
        isFetching = false;
    }
};

// *** MODIFIED: Interval increased to 60 seconds (60000 ms) for performance ***
setInterval(fetchData, 60000);
fetchData(); // Initial fetch

// --- Date/Time Update Function (Copied from Original) ---
function updateDateTime() { /* ... (same as original) ... */ }
setInterval(updateDateTime, 1000);
updateDateTime();
