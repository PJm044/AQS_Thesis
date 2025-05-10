// ----------- Constants -----------
const MAX_CHART_DATAPOINTS = 20; // Number of data points to show on the line chart
const LOCAL_STORAGE_CHART_KEY = 'sensorDashboardChartData';

// ----------- Gauge setup -----------
const gaugeConfigs = {
  type: 'doughnut',
  options: {
    responsive: true,
    rotation: -90,
    circumference: 180,
    cutout: '80%',
    plugins: {
      tooltip: { enabled: false },
      legend: { display: false }
    },
    animation: {
        duration: 0 // Disable animation for instant updates
    }
  }
};

const gaugeData = (value, max, color) => ({
  labels: ['Value', 'Remaining'],
  datasets: [{
    data: [Math.min(value, max), Math.max(0, max - Math.min(value, max))], // Ensure value doesn't exceed max
    backgroundColor: [color, '#e0e0e0'],
    borderWidth: 0
  }]
});

const createGauge = (id, max, color) => {
  return new Chart(document.getElementById(id), {
    ...gaugeConfigs,
    data: gaugeData(0, max, color)
  });
};

// ----------- Gauges with correct maxes -----------
// Max values for gauges (ensure these align with expected data ranges and interpretation functions)
const GAUGE_MAX_VALUES = {
  aqi: 500,
  voc: 3,
  co: 15.4, // Based on Unhealthy threshold
  co2: 2000, // Up to "Unhealthy" or "Moderate"
  pm25: 150.4, // Based on Unhealthy on AQI scale
  pm10: 154, // Based on Unhealthy for Sensitive on AQI scale (can be higher)
  temp: 50,
  pressure: 1100,
  humidity: 100
};

const gauges = {
  aqi:      createGauge('gaugeAQI',      GAUGE_MAX_VALUES.aqi,      '#f44336'),
  voc:      createGauge('gaugeVOC',      GAUGE_MAX_VALUES.voc,      '#ff9800'),
  co:       createGauge('gaugeCO',       GAUGE_MAX_VALUES.co,       '#ffeb3b'),
  co2:      createGauge('gaugeCO2',      GAUGE_MAX_VALUES.co2,      '#4caf50'),
  pm25:     createGauge('gaugePM25',     GAUGE_MAX_VALUES.pm25,     '#2196f3'),
  pm10:     createGauge('gaugePM10',     GAUGE_MAX_VALUES.pm10,     '#9c27b0'),
  temp:     createGauge('gaugeTemp',     GAUGE_MAX_VALUES.temp,     '#e91e63'),
  pressure: createGauge('gaugePressure', GAUGE_MAX_VALUES.pressure, '#00bcd4'),
  humidity: createGauge('gaugeHumidity', GAUGE_MAX_VALUES.humidity, '#673ab7')
};

// ----------- AQI calculation & descriptions -----------
function calculateAQI(pm25_value) {
  const C = parseFloat(pm25_value);
  if (isNaN(C) || C < 0) return 0; // Return 0 or handle as appropriate if value is invalid

  let I_low, I_high, C_low, C_high;

  if (C >= 0 && C <= 12.0) { I_low = 0; I_high = 50; C_low = 0.0; C_high = 12.0; }
  else if (C > 12.0 && C <= 35.4) { I_low = 51; I_high = 100; C_low = 12.1; C_high = 35.4; }
  else if (C > 35.4 && C <= 55.4) { I_low = 101; I_high = 150; C_low = 35.5; C_high = 55.4; }
  else if (C > 55.4 && C <= 150.4) { I_low = 151; I_high = 200; C_low = 55.5; C_high = 150.4; }
  else if (C > 150.4 && C <= 250.4) { I_low = 201; I_high = 300; C_low = 150.5; C_high = 250.4; }
  else if (C > 250.4 && C <= 350.4) { I_low = 301; I_high = 400; C_low = 250.5; C_high = 350.4; }
  else if (C > 350.4 && C <= 500.4) { I_low = 401; I_high = 500; C_low = 350.5; C_high = 500.4; }
  else { return 500; } // Cap at 500 if C > 500.4
  
  return Math.round(((I_high - I_low) / (C_high - C_low)) * (C - C_low) + I_low);
}

function getAQIDescription(aqi) {
  if (isNaN(aqi)) return "N/A";
  if (aqi <= 50)   return "Good";
  if (aqi <= 100)  return "Moderate";
  if (aqi <= 150)  return "Unhealthy for Sensitive Groups";
  if (aqi <= 200)  return "Unhealthy";
  if (aqi <= 300)  return "Very Unhealthy";
  return "Hazardous";
}

function getVOCDescription(vocClass) {
  const voc = parseInt(vocClass);
  if (isNaN(voc)) return `Unknown (${vocClass})`;
  switch (voc) {
    case 0: return "Clean Air (No VOCs)";
    case 1: return "Low VOCs";
    case 2: return "Moderate VOCs";
    case 3: return "High VOCs";
    default: return `Unknown (${vocClass})`;
  }
}

function getCODescription(co) {
  if (isNaN(co)) return "N/A";
  if (co <= 4.4)   return "Good";
  if (co <= 9.4)   return "Moderate";
  if (co <= 12.4)  return "Unhealthy for Sensitive Groups";
  if (co <= 15.4)  return "Unhealthy";
  return "Very Unhealthy";
}

function getCO2Description(co2) {
  if (isNaN(co2)) return "N/A";
  if (co2 <= 600)   return "Excellent (Typical Outdoor)";
  if (co2 <= 1000)  return "Good (Typical Indoor)";
  if (co2 <= 2000)  return "Moderate (Complaints of drowsiness)";
  return "High (Potential health effects)";
}

function getPMDescription(pm_value) {
    const val = parseFloat(pm_value);
    if (isNaN(val)) return "N/A";
    if (val <= 12.0) return "Good";
    if (val <= 35.4) return "Moderate";
    if (val <= 55.4) return "Unhealthy for Sensitive Groups";
    if (val <= 150.4) return "Unhealthy";
    if (val <= 250.4) return "Very Unhealthy";
    return "Hazardous";
}

function getTempDescription(t) {
  if (isNaN(t)) return "N/A";
  if (t < 10)   return "Cold";
  if (t <= 18)  return "Cool";
  if (t <= 25)  return "Comfortable";
  if (t <= 32)  return "Warm";
  return "Hot";
}

function getPressureDescription(p) {
  if (isNaN(p)) return "N/A";
  if (p < 1000)   return "Low Pressure";
  if (p <= 1020)  return "Normal Pressure";
  return "High Pressure";
}

function getHumidityDescription(h) {
  if (isNaN(h)) return "N/A";
  if (h < 30)    return "Dry";
  if (h <= 60)   return "Comfortable";
  return "Humid";
}


// ----------- Historical line chart -----------
const aqiChartContext = document.getElementById('aqiLineChart').getContext('2d');
const aqiChart = new Chart(aqiChartContext, {
  type: 'line',
  data: {
    labels: [],
    datasets: [
      { label: 'AQI', data: [], borderColor: '#f44336', backgroundColor: 'rgba(244,67,54,0.2)', fill: true, tension: 0.3, yAxisID: 'yAQI' },
      { label: 'VOC (Class)', data: [], borderColor: '#ff9800', backgroundColor: 'rgba(255,152,0,0.2)', fill: true, tension: 0.3, yAxisID: 'yVOC' },
      { label: 'CO (ppm)', data: [], borderColor: '#ffeb3b', backgroundColor: 'rgba(255,235,59,0.2)', fill: true, tension: 0.3, yAxisID: 'yOtherSmall' },
      { label: 'CO₂ (ppm)', data: [], borderColor: '#4caf50', backgroundColor: 'rgba(76,175,80,0.2)', fill: true, tension: 0.3, yAxisID: 'yCO2' },
      { label: 'PM2.5 (µg/m³)', data: [], borderColor: '#2196f3', backgroundColor: 'rgba(33,150,243,0.2)', fill: true, tension: 0.3, yAxisID: 'yOtherMedium' },
      { label: 'PM10 (µg/m³)', data: [], borderColor: '#9c27b0', backgroundColor: 'rgba(156,39,176,0.2)', fill: true, tension: 0.3, yAxisID: 'yOtherMedium' },
      { label: 'Temp (°C)', data: [], borderColor: '#e91e63', backgroundColor: 'rgba(233,30,99,0.2)', fill: true, tension: 0.3, yAxisID: 'yOtherSmall' },
      { label: 'Pressure (hPa)', data: [], borderColor: '#00bcd4', backgroundColor: 'rgba(0,188,212,0.2)', fill: true, tension: 0.3, yAxisID: 'yPressure' },
      { label: 'Humidity (%)', data: [], borderColor: '#673ab7', backgroundColor: 'rgba(103,58,183,0.2)', fill: true, tension: 0.3, yAxisID: 'yOtherMedium' }
    ]
  },
  options: {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: 'index', intersect: false },
    stacked: false,
    plugins: { legend: { position: 'top' }, tooltip: { mode: 'index', intersect: false }},
    scales: {
      yAQI: { type: 'linear', display: true, position: 'left', beginAtZero: true, max: GAUGE_MAX_VALUES.aqi, title: { display: true, text: 'AQI' }},
      yVOC: { type: 'linear', display: true, position: 'right', beginAtZero: true, max: GAUGE_MAX_VALUES.voc + 1, ticks: { stepSize: 1 }, grid: { drawOnChartArea: false }, title: { display: true, text: 'VOC Class' }},
      yCO2: { type: 'linear', display: true, position: 'right', beginAtZero: true, max: GAUGE_MAX_VALUES.co2 + 500, grid: { drawOnChartArea: false }, title: { display: true, text: 'CO₂ (ppm)' }},
      yPressure: { type: 'linear', display: true, position: 'right', min: 900, max: GAUGE_MAX_VALUES.pressure, grid: { drawOnChartArea: false }, title: { display: true, text: 'Pressure (hPa)' }},
      yOtherSmall: { type: 'linear', display: true, position: 'left', beginAtZero: true, max: 50, grid: { drawOnChartArea: false }, title: { display: true, text: 'Value (Small Scale)' }}, // For CO, Temp
      yOtherMedium: { type: 'linear', display: true, position: 'left', beginAtZero: true, max: 200, grid: { drawOnChartArea: false }, title: { display: true, text: 'Value (Medium Scale)' }}, // For PM2.5, PM10, Humidity
      x: { title: { display: true, text: 'Time' }}
    },
    animation: {
        duration: 0 // Disable animation for chart updates
    }
  }
});

// ----------- localStorage Functions for Chart Data -----------
function saveChartDataToLocalStorage(chart) {
  const dataToSave = {
    labels: chart.data.labels,
    datasets: chart.data.datasets.map(dataset => ({
        label: dataset.label,
        data: dataset.data,
        // Retain styling properties if needed, or re-apply on load from initial config
        borderColor: dataset.borderColor,
        backgroundColor: dataset.backgroundColor,
        fill: dataset.fill,
        tension: dataset.tension,
        yAxisID: dataset.yAxisID
    }))
  };
  try {
    localStorage.setItem(LOCAL_STORAGE_CHART_KEY, JSON.stringify(dataToSave));
  } catch (e) {
    console.error("Error saving chart data to localStorage:", e);
    // Potentially handle quota exceeded errors
  }
}

function loadChartDataFromLocalStorage(chart) {
  const savedData = localStorage.getItem(LOCAL_STORAGE_CHART_KEY);
  if (savedData) {
    try {
      const parsedData = JSON.parse(savedData);
      if (parsedData && parsedData.labels && parsedData.datasets) {
        chart.data.labels = parsedData.labels;
        chart.data.datasets.forEach((chartDataset, index) => {
            // Find the saved dataset by label, as order might not be guaranteed
            // or assume saved order matches initial config order
            const savedDataset = parsedData.datasets.find(ds => ds.label === chartDataset.label);
            if (savedDataset && savedDataset.data) {
                chartDataset.data = savedDataset.data;
                // Optionally restore other properties if not relying on initial config
                // chartDataset.borderColor = savedDataset.borderColor;
                // ... etc.
            } else if (parsedData.datasets[index]) { // Fallback to order if label not found
                 chartDataset.data = parsedData.datasets[index].data;
            }
        });
        chart.update('none');
        console.log("Chart data loaded from localStorage.");
      }
    } catch (e) {
      console.error("Error parsing chart data from localStorage:", e);
      localStorage.removeItem(LOCAL_STORAGE_CHART_KEY); // Clear corrupted data
    }
  }
}


// ----------- Fetch & render data -----------
const fetchData = async () => {
  try {
    // !!! API URL Updated with your endpoint !!!
    const apiUrl = 'https://3yy35wil8i.execute-api.ap-southeast-1.amazonaws.com/prod/latestdata';
    
    const res = await fetch(apiUrl);
    if (!res.ok) {
      document.getElementById('descAQI').innerText = `API Error: ${res.status}`; // Update UI
      console.error(`API fetch failed: ${res.status} ${res.statusText}`);
      try { const errorData = await res.json(); console.error('Error details:', errorData); } catch (e) { /* ignore if response not json */ }
      return;
    }

    const data = await res.json();

    // --- NAMING SCHEME ---
    // VITAL: Ensure these keys (e.g., data.VOC_ZP07_Class) EXACTLY match your DynamoDB attribute names.
    // Case sensitivity matters!
    if (!data || Object.keys(data).length === 0 || !data.Data_timestamp) { // Check for a key field like Data_timestamp
      console.warn('API returned no data or incomplete data. Waiting for next fetch.');
      // document.getElementById('descAQI').innerText = 'Waiting for new data...'; // Update UI
      return;
    }

    const processedData = {
      // -----BEGIN --- Double Check Your DynamoDB Naming Scheme Here -----
      voc:      parseFloat(data.VOC_ZP07_Class),
      co:       parseFloat(data.CO),
      co2:      parseFloat(data.CO2),
      pm25:     parseFloat(data.PM2_5),
      pm10:     parseFloat(data.PM10_0), // Example: Is it PM10_0 or PM10? Confirm this.
      temp:     parseFloat(data.Temp_AHT20), // Example: Is it Temp_AHT20 or Temperature_AHT20? Confirm.
      pressure: parseFloat(data.Pressure_BMP280),
      humidity: parseFloat(data.Humidity_AHT20),
      timestamp: data.Data_timestamp // Assuming 'Data_timestamp' is the field name from your DB
      // -----END --- Double Check Your DynamoDB Naming Scheme Here -----
    };
    processedData.aqi = calculateAQI(processedData.pm25);

    // Validate processed data (simple check for NaN)
    for (const key in processedData) {
        if (typeof processedData[key] === 'number' && isNaN(processedData[key])) {
            console.warn(`Processed data for ${key} is NaN. Original value from API: ${data[key]}. Using 0 as default.`);
            processedData[key] = 0; // Default to 0 if parsing failed, to prevent chart errors. Adjust as needed.
        }
    }
    
    // Update gauges
    const updateGauge = (gaugeName, value) => {
        const val = parseFloat(value); // Ensure it's a number
        const max = GAUGE_MAX_VALUES[gaugeName];
        if (!isNaN(val) && gauges[gaugeName]) { // Check if gauge exists and value is a number
            gauges[gaugeName].data.datasets[0].data = [Math.min(val, max), Math.max(0, max - Math.min(val,max))];
            gauges[gaugeName].update('none');
        } else {
            console.warn(`Cannot update gauge "${gaugeName}". Value: ${value}, Max: ${max}`);
        }
    };

    updateGauge('aqi', processedData.aqi);
    updateGauge('voc', processedData.voc);
    updateGauge('co', processedData.co);
    updateGauge('co2', processedData.co2);
    updateGauge('pm25', processedData.pm25);
    updateGauge('pm10', processedData.pm10);
    updateGauge('temp', processedData.temp);
    updateGauge('pressure', processedData.pressure);
    updateGauge('humidity', processedData.humidity);


    // Update numeric text
    const setElementText = (id, text) => {
        const element = document.getElementById(id);
        if (element) {
            element.innerText = text;
        } else {
            console.warn(`HTML element with ID "${id}" not found for text update.`);
        }
    };
    setElementText('valueAQI',      !isNaN(processedData.aqi) ? processedData.aqi : 'N/A');
    setElementText('valueVOC',      !isNaN(processedData.voc) ? processedData.voc : 'N/A'); // Displaying class number
    setElementText('valueCO',       !isNaN(processedData.co) ? `${processedData.co.toFixed(1)} ppm` : 'N/A');
    setElementText('valueCO2',      !isNaN(processedData.co2) ? `${processedData.co2.toFixed(0)} ppm` : 'N/A');
    setElementText('valuePM25',     !isNaN(processedData.pm25) ? `${processedData.pm25.toFixed(1)} µg/m³` : 'N/A');
    setElementText('valuePM10',     !isNaN(processedData.pm10) ? `${processedData.pm10.toFixed(1)} µg/m³` : 'N/A');
    setElementText('valueTemp',     !isNaN(processedData.temp) ? `${processedData.temp.toFixed(1)} °C` : 'N/A');
    setElementText('valuePressure', !isNaN(processedData.pressure) ? `${processedData.pressure.toFixed(0)} hPa` : 'N/A');
    setElementText('valueHumidity', !isNaN(processedData.humidity) ? `${processedData.humidity.toFixed(1)} %` : 'N/A');

    // Update descriptions
    setElementText('descAQI',      getAQIDescription(processedData.aqi));
    setElementText('descVOC',      getVOCDescription(processedData.voc));
    setElementText('descCO',       getCODescription(processedData.co));
    setElementText('descCO2',      getCO2Description(processedData.co2));
    setElementText('descPM25',     getPMDescription(processedData.pm25));
    setElementText('descPM10',     getPMDescription(processedData.pm10));
    setElementText('descTemp',     getTempDescription(processedData.temp));
    setElementText('descPressure', getPressureDescription(processedData.pressure));
    setElementText('descHumidity', getHumidityDescription(processedData.humidity));

    // Update line chart
    const dataTime = processedData.timestamp ? new Date(processedData.timestamp).toLocaleTimeString("en-US", { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : new Date().toLocaleTimeString("en-US", { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    
    if (aqiChart.data.labels.length === 0 || aqiChart.data.labels[aqiChart.data.labels.length - 1] !== dataTime) {
        aqiChart.data.labels.push(dataTime);
        const datasets = aqiChart.data.datasets;
        datasets[0].data.push(processedData.aqi);
        datasets[1].data.push(processedData.voc);
        datasets[2].data.push(processedData.co);
        datasets[3].data.push(processedData.co2);
        datasets[4].data.push(processedData.pm25);
        datasets[5].data.push(processedData.pm10);
        datasets[6].data.push(processedData.temp);
        datasets[7].data.push(processedData.pressure);
        datasets[8].data.push(processedData.humidity);

        if (aqiChart.data.labels.length > MAX_CHART_DATAPOINTS) {
          aqiChart.data.labels.shift();
          datasets.forEach(ds => ds.data.shift());
        }
        aqiChart.update('none');
        saveChartDataToLocalStorage(aqiChart);
    } else {
        // console.log("Skipping chart update: timestamp identical to the last point.");
    }

  } catch (err) {
    console.error('Failed to fetch or process data:', err);
    const descAqiElement = document.getElementById('descAQI');
    if (descAqiElement) { // Update UI to show error
        descAqiElement.innerText = 'Error processing data.';
    }
  }
};

// ----------- Date/time display -----------
function updateDateTime() {
  const now = new Date();
  const dateTimeElement = document.getElementById("dateTime");
  if (dateTimeElement) {
    dateTimeElement.textContent = now.toLocaleString("en-US", { // Using en-US for consistency, adjust if needed
        weekday: "long", year: "numeric", month: "long", day: "numeric",
        hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: true
    });
  }
}

// ----------- Initial Setup -----------
// Ensure the script runs after the DOM is fully loaded
document.addEventListener('DOMContentLoaded', () => {
  if (document.getElementById('aqiLineChart')) { // Check if chart element exists
    loadChartDataFromLocalStorage(aqiChart);
  } else {
    console.error("Chart element 'aqiLineChart' not found. Chart cannot be initialized or loaded.");
  }
  
  updateDateTime(); // Initial call
  setInterval(updateDateTime, 1000); // Update time every second
  
  fetchData(); // Initial data fetch
  setInterval(fetchData, 5000); // Fetch new data every 5 seconds
});
