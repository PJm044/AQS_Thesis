// script.js (Attempt to Fix Lagging)

// --- Chart.js Global Settings (Optional performance tweak) ---
// Uncomment these lines to try disabling animations globally
// Chart.defaults.animation = false;
// Chart.defaults.animations.colors = false;
// Chart.defaults.animations.x = false;

// Configuration for all gauges (doughnut chart type)
const gaugeConfigs = {
    type: 'doughnut',
    options: {
        responsive: true,
        maintainAspectRatio: false,
        rotation: -90,
        circumference: 180,
        cutout: '80%',
        animation: false, // Explicitly disable animation here too
        plugins: {
            tooltip: { enabled: false }, // Tooltips off for gauges
            legend: { display: false }
        }
    }
};

// Function to create the data object for a gauge
const gaugeData = (value, max, color) => {
    const numericValue = (value === null || isNaN(value)) ? 0 : value;
    const numericMax = (max === null || isNaN(max) || max <= 0) ? 1 : max;
    const clampedValue = Math.max(0, Math.min(numericValue, numericMax));
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
    return new Chart(ctx, {
        ...gaugeConfigs, // Use shared configs (includes animation: false)
        data: gaugeData(0, max, color)
    });
};

// --- Gauge Definitions ---
const gauges = {
    aqi: createGauge('gaugeAQI', 500, '#6fcf97'),
    voc: createGauge('gaugeVOC', 3, '#f2994a'),     // Max = 3 for VOC Class 0-3
    co: createGauge('gaugeCO', 50, '#f2c94c'),
    co2: createGauge('gaugeCO2', 2000, '#56ccf2'),
    pm25: createGauge('gaugePM25', 250, '#bb6bd9'),
    pm10: createGauge('gaugePM10', 425, '#eb5757'),
    temp: createGauge('gaugeTemp', 50, '#e91e63'),
    pressure: createGauge('gaugePressure', 1100, '#00bcd4'),
    humidity: createGauge('gaugeHumidity', 100, '#2f80ed')
};


// --- Description Functions --- (No changes needed here)
function getAQIDescription(aqi) { /* ... */ }
function getAirQualityLevelDescription(level) { /* ... */ }
function getCODescription(co) { /* ... */ }
function getCO2Description(co2) { /* ... */ }
function getPMDescription(pm, type = "pm25") { /* ... */ }
function getTempDescription(temp) { /* ... */ }
function getPressureDescription(pressure) { /* ... */ }
function getHumidityDescription(h) { /* ... */ }
// Ensure all description functions handle null/NaN input gracefully


// --- Line Chart Setup ---
const lineChartCanvas = document.getElementById('aqiLineChart');
let aqiLineChart = null;

if (lineChartCanvas) {
    aqiLineChart = new Chart(lineChartCanvas, {
        type: 'line',
        data: {
            labels: [],
            datasets: [ // Make sure indexes match update logic below
                { label: 'AQI', data: [], borderColor: '#6fcf97', backgroundColor: 'rgba(111, 207, 151, 0.2)', fill: true, tension: 0.3, hidden: false }, // 0
                { label: 'CO (ppm)', data: [], borderColor: '#f2c94c', backgroundColor: 'rgba(242, 201, 76, 0.2)', fill: true, tension: 0.3, hidden: true },  // 1
                { label: 'CO₂ (ppm)', data: [], borderColor: '#56ccf2', backgroundColor: 'rgba(86, 204, 242, 0.2)', fill: true, tension: 0.3, hidden: true }, // 2
                { label: 'PM2.5 (µg/m³)', data: [], borderColor: '#bb6bd9', backgroundColor: 'rgba(187, 107, 217, 0.2)', fill: true, tension: 0.3, hidden: true }, // 3
                { label: 'PM10 (µg/m³)', data: [], borderColor: '#eb5757', backgroundColor: 'rgba(235, 87, 87, 0.2)', fill: true, tension: 0.3, hidden: true },  // 4
                { label: 'Temp (°C)', data: [], borderColor: '#e91e63', backgroundColor: 'rgba(233, 30, 99, 0.2)', fill: true, tension: 0.3, hidden: true },   // 5
                { label: 'Pressure (hPa)', data: [], borderColor: '#00bcd4', backgroundColor: 'rgba(0, 188, 212, 0.2)', fill: true, tension: 0.3, hidden: true }, // 6
                { label: 'Humidity (%)', data: [], borderColor: '#2f80ed', backgroundColor: 'rgba(47, 128, 237, 0.2)', fill: true, tension: 0.3, hidden: true }  // 7
               // { label: 'VOC Level', data: [], borderColor: '#f2994a', backgroundColor: 'rgba(242, 153, 74, 0.2)', fill: true, tension: 0.3, hidden: true }, // Optional: if charting vocClass
            ]
        },
        options: {
            scales: {
                y: { beginAtZero: true, ticks: { color: '#CCC' }, grid: { color: 'rgba(204, 204, 204, 0.2)' } },
                x: { ticks: { color: '#CCC' }, grid: { color: 'rgba(204, 204, 204, 0.2)' } }
            },
            responsive: true,
            maintainAspectRatio: false,
            animation: false, // Explicitly disable animation
            plugins: {
                legend: { position: 'top', labels: { color: '#CCC' },
                    onClick: (e, legendItem, legend) => { Chart.defaults.plugins.legend.onClick(e, legendItem, legend); }
                },
                tooltip: { enabled: true, mode: 'index', intersect: false }, // Keep tooltips enabled for line chart unless they cause lag
                // If lagging badly, try disabling tooltips:
                // tooltip: { enabled: false }, 
            }
        }
    });
} else {
    console.error("Line chart canvas element 'aqiLineChart' not found.");
}


// --- Data Fetching and Updating ---
let isFetching = false; // Flag to prevent concurrent fetches

const fetchData = async () => {
    if (isFetching) {
        console.log("Fetch already in progress, skipping interval.");
        return; // Don't start a new fetch if one is already running
    }
    isFetching = true; // Set flag
    console.log("Fetching data...");

    const apiEndpoint = 'https://9j1fz04gx1.execute-api.ap-southeast-1.amazonaws.com/prod/sensordata';

    try {
        const res = await fetch(apiEndpoint);
        if (!res.ok) {
            let errorDetails = `HTTP error! status: ${res.status} - ${res.statusText}`;
            try { const errorData = await res.json(); /* try to get more details */ } catch (e) {}
            throw new Error(errorDetails);
        }
        const jsonData = await res.json();
        console.log("Data received, updating UI:", jsonData);

        // --- Update Gauges ---
        const updateGauge = (gaugeKey, value, max, color) => {
            if (gauges[gaugeKey]) {
                gauges[gaugeKey].data = gaugeData(value, max, color);
                gauges[gaugeKey].update('none'); // Use 'none' to disable animation
            }
        };
        // Update calls remain the same...
        updateGauge('aqi', jsonData.aqi, 500, '#6fcf97');
        updateGauge('voc', jsonData.vocClass, 3, '#f2994a');
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
        // Update calls remain the same...
        updateText('valueAQI', jsonData.aqi);
        updateText('valueVOC', `Level: ${jsonData.vocClass !== null ? jsonData.vocClass : 'N/A'}`);
        updateText('valueCO', `${jsonData.co !== null ? jsonData.co.toFixed(1) : 'N/A'} ppm`);
        updateText('valueCO2', `${jsonData.co2 !== null ? jsonData.co2 : 'N/A'} ppm`);
        updateText('valuePM25', `${jsonData.pm25 !== null ? jsonData.pm25.toFixed(1) : 'N/A'} µg/m³`);
        updateText('valuePM10', `${jsonData.pm10 !== null ? jsonData.pm10.toFixed(1) : 'N/A'} µg/m³`);
        updateText('valueTemp', `${jsonData.temp !== null ? jsonData.temp.toFixed(1) : 'N/A'} °C`);
        updateText('valuePressure', `${jsonData.pressure !== null ? jsonData.pressure.toFixed(0) : 'N/A'} hPa`);
        updateText('valueHumidity', `${jsonData.humidity !== null ? jsonData.humidity.toFixed(1) : 'N/A'} %`);

        // --- Update Descriptions ---
        // Update calls remain the same...
        updateText('descAQI', getAQIDescription(jsonData.aqi));
        updateText('descVOC', getAirQualityLevelDescription(jsonData.vocClass));
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
            // Ensure data is pushed to the correct dataset index
            datasets[0].data.push(jsonData.aqi);       // AQI
            datasets[1].data.push(jsonData.co);        // CO
            datasets[2].data.push(jsonData.co2);       // CO2
            datasets[3].data.push(jsonData.pm25);      // PM2.5
            datasets[4].data.push(jsonData.pm10);      // PM10
            datasets[5].data.push(jsonData.temp);      // Temp
            datasets[6].data.push(jsonData.pressure);  // Pressure
            datasets[7].data.push(jsonData.humidity);  // Humidity
            // Optionally push vocClass if charting it: datasets[X].data.push(jsonData.vocClass);

            const maxDataPoints = 30; // Keep reasonably low for performance
            while (labels.length > maxDataPoints) {
                labels.shift();
                datasets.forEach(dataset => {
                    if(dataset.data.length > 0) dataset.data.shift();
                });
            }
            aqiLineChart.update('none'); // Update chart without animation
        }

    } catch (err) {
        console.error('Failed to fetch or process data from API:', err);
        // Error display logic remains the same...
        const errorDisplayIds = [ /* ... */ ]; // Previous list of IDs
        errorDisplayIds.forEach(id => { /* ... */ });

    } finally {
        isFetching = false; // Reset flag when fetch completes or errors out
    }
};

// --- Date/Time Update Function --- (No changes needed here)
function updateDateTime() { /* ... */ }


// --- Initial calls and intervals ---
document.addEventListener('DOMContentLoaded', () => {
    console.log("DOM Loaded. Initializing data fetch and timers.");
    fetchData(); // Initial data fetch

    // *** MODIFIED: Increased interval to 60 seconds (60000 ms) ***
    // *** If still lagging, try increasing further (e.g., 120000 for 2 mins) ***
    setInterval(fetchData, 60000); 

    updateDateTime(); // Initial date-time update
    setInterval(updateDateTime, 1000); // Clock update every second (usually fine)
});
