// script.js (Revised - Interval 60s, Handles AQI & VOC Class)

// --- Chart.js Global Settings ---
// Chart.defaults.animation = false; // Optional: uncomment to disable all animations globally

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
    const numericMax = (max === null || isNaN(max) || max <= 0) ? 1 : max; // Ensure max is valid positive
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

// Function to create a new gauge chart instance
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

// --- Gauge Definitions / Instances ---
const gauges = {
    aqi: createGauge('gaugeAQI', 500, '#6fcf97'),
    voc: createGauge('gaugeVOC', 3, '#f2994a'),     // Max = 3 for VOC Class 0-3
    co: createGauge('gaugeCO', 50, '#f2c94c'),      // Max 50ppm (Adjust if needed)
    co2: createGauge('gaugeCO2', 2000, '#56ccf2'),   // Max 2000ppm
    pm25: createGauge('gaugePM25', 250, '#bb6bd9'),  // Max 250 ug/m3
    pm10: createGauge('gaugePM10', 425, '#eb5757'),  // Max 425 ug/m3
    temp: createGauge('gaugeTemp', 50, '#e91e63'),    // Max 50 C
    pressure: createGauge('gaugePressure', 1100, '#00bcd4'), // Max 1100 hPa
    humidity: createGauge('gaugeHumidity', 100, '#2f80ed')  // Max 100 %
};


// --- Description Functions --- (Ensure these correctly handle null/NaN inputs)
function getAQIDescription(aqi) {
    if (aqi === null || isNaN(aqi)) return "N/A";
    if (aqi <= 50) return "Good";
    if (aqi <= 100) return "Moderate";
    if (aqi <= 150) return "Unhealthy for Sensitive Groups";
    if (aqi <= 200) return "Unhealthy";
    if (aqi <= 300) return "Very Unhealthy";
    return "Hazardous";
}
function getAirQualityLevelDescription(level) { // For VOC Class
    if (level === null || isNaN(level)) return "N/A";
    switch (level) {
        case 0: return "Clean Air";
        case 1: return "Slight Pollution";
        case 2: return "Moderate Pollution";
        case 3: return "Heavy Pollution";
        default: return "Unknown";
    }
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
    if (co2 <= 1500) return "Fair";
    if (co2 <= 2000) return "Poor";
    return "Very Poor";
}
function getPMDescription(pm, type = "pm25") {
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
            ]
        },
        options: {
            scales: {
                y: { beginAtZero: true, ticks: { color: '#CCC' }, grid: { color: 'rgba(204, 204, 204, 0.2)' } },
                x: { ticks: { color: '#CCC' }, grid: { color: 'rgba(204, 204, 204, 0.2)' } }
            },
            responsive: true,
            maintainAspectRatio: false,
            animation: false, // Disable animations
            plugins: {
                legend: { position: 'top', labels: { color: '#CCC' },
                    onClick: (e, legendItem, legend) => { Chart.defaults.plugins.legend.onClick(e, legendItem, legend); } // Default toggle behavior
                },
                tooltip: { enabled: true, mode: 'index', intersect: false }, // Keep tooltips unless lagging
            }
        }
    });
} else {
    console.error("Line chart canvas element 'aqiLineChart' not found.");
}


// --- Data Fetching and Updating ---
let isFetching = false; // Prevent overlapping fetches

const fetchData = async () => {
    if (isFetching) {
        return; 
    }
    isFetching = true;
    
    const apiEndpoint = 'https://9j1fz04gx1.execute-api.ap-southeast-1.amazonaws.com/prod/sensordata';

    try {
        const res = await fetch(apiEndpoint);
        if (!res.ok) {
            let errorDetails = `HTTP error! status: ${res.status} - ${res.statusText}`;
            try { const errorData = await res.json(); /* try to get more details */ } catch (e) {}
            throw new Error(errorDetails);
        }
        const jsonData = await res.json();
        console.log("Data received, updating UI:", jsonData); // Good for debugging

        // --- Update Gauges ---
        const updateGauge = (gaugeKey, value, max, color) => {
            if (gauges[gaugeKey]) {
                gauges[gaugeKey].data = gaugeData(value, max, color);
                gauges[gaugeKey].update('none'); // Update without animation
            }
        };
        updateGauge('aqi', jsonData.aqi, 500, '#6fcf97');
        updateGauge('voc', jsonData.vocClass, 3, '#f2994a'); // Use vocClass (0-3)
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
            if (element) {
                 // Use rAF for potentially smoother updates
                 window.requestAnimationFrame(() => { 
                     element.innerText = (text === null || text === undefined) ? 'N/A' : text;
                 });
            }
        };
        updateText('valueAQI', jsonData.aqi !== null ? jsonData.aqi : 'N/A'); // Show N/A if null
        updateText('valueVOC', `Level: ${jsonData.vocClass !== null ? jsonData.vocClass : 'N/A'}`); // Use vocClass
        updateText('valueCO', `${jsonData.co !== null ? jsonData.co.toFixed(1) : 'N/A'} ppm`);
        updateText('valueCO2', `${jsonData.co2 !== null ? jsonData.co2 : 'N/A'} ppm`);
        updateText('valuePM25', `${jsonData.pm25 !== null ? jsonData.pm25.toFixed(1) : 'N/A'} µg/m³`);
        updateText('valuePM10', `${jsonData.pm10 !== null ? jsonData.pm10.toFixed(1) : 'N/A'} µg/m³`);
        updateText('valueTemp', `${jsonData.temp !== null ? jsonData.temp.toFixed(1) : 'N/A'} °C`);
        updateText('valuePressure', `${jsonData.pressure !== null ? jsonData.pressure.toFixed(0) : 'N/A'} hPa`);
        updateText('valueHumidity', `${jsonData.humidity !== null ? jsonData.humidity.toFixed(1) : 'N/A'} %`);

        // --- Update Descriptions ---
        updateText('descAQI', getAQIDescription(jsonData.aqi));
        updateText('descVOC', getAirQualityLevelDescription(jsonData.vocClass)); // Use vocClass
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
            // Push data, use null if value is null/undefined from JSON
            datasets[0].data.push(jsonData.aqi ?? null);       
            datasets[1].data.push(jsonData.co ?? null);        
            datasets[2].data.push(jsonData.co2 ?? null);       
            datasets[3].data.push(jsonData.pm25 ?? null);      
            datasets[4].data.push(jsonData.pm10 ?? null);      
            datasets[5].data.push(jsonData.temp ?? null);      
            datasets[6].data.push(jsonData.pressure ?? null);  
            datasets[7].data.push(jsonData.humidity ?? null);  

            const maxDataPoints = 30; // Keep history reasonable
            while (labels.length > maxDataPoints) {
                labels.shift();
                datasets.forEach(dataset => {
                    if(dataset.data.length > 0) dataset.data.shift();
                });
            }
            // Use rAF for chart update
            window.requestAnimationFrame(() => {
                 aqiLineChart.update('none'); 
            });
        }

    } catch (err) {
        console.error('Failed to fetch or process data from API:', err);
        const errorDisplayIds = ['valueAQI', 'descAQI', 'valueVOC', 'descVOC', 'valueCO', 'descCO', 'valueCO2', 'descCO2', 'valuePM25', 'descPM25', 'valuePM10', 'descPM10', 'valueTemp', 'descTemp', 'valuePressure', 'descPressure', 'valueHumidity', 'descHumidity'];
        errorDisplayIds.forEach(id => {
            const el = document.getElementById(id);
            if (el) {
                if (id.startsWith('value')) el.innerText = 'ERR';
                if (id.startsWith('desc')) el.innerText = 'Load Error';
            }
        });

    } finally {
        isFetching = false; 
    }
};

// --- Date/Time Update Function --- 
// Ensure this element exists in index.html with id="dateTime"
function updateDateTime() {
    const now = new Date();
    const options = { 
        weekday: "long", year: "numeric", month: "long", day: "numeric", 
        hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: true,
        timeZone: "Asia/Manila" // Timezone for Philippines
    };
    const dateTimeElement = document.getElementById("dateTime");
    if (dateTimeElement) {
        try {
             // Use rAF for smoother clock update (optional)
             window.requestAnimationFrame(() => {
                 dateTimeElement.textContent = now.toLocaleString("en-US", options);
             });
        } catch (e) { 
             // Basic fallback if timezone formatting fails
             dateTimeElement.textContent = now.toLocaleString("en-US", { hour: '2-digit', minute: '2-digit', second: '2-digit' }); 
             console.error("Error formatting date with timezone:", e);
        }
    } else {
         // console.warn("dateTime element not found"); // Optional warning
    }
}

// --- Initial calls and intervals ---
document.addEventListener('DOMContentLoaded', () => {
    console.log("DOM Loaded. Initializing data fetch and timers.");
    fetchData(); // Initial data fetch

    // *** Fetch interval set to 60 seconds (60000 ms) to reduce lag ***
    // *** Increase if still lagging: 120000 (2 min), 300000 (5 min) ***
    setInterval(fetchData, 60000); 

    updateDateTime(); // Initial clock update
    setInterval(updateDateTime, 1000); // Update clock every second (generally fine)
});
