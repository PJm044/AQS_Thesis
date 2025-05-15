// script.js

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
    data: [Math.min(value, max), Math.max(0, max - Math.min(value, max))],
    backgroundColor: [color, '#e0e0e0'],
    borderWidth: 0
  }]
});

const createGauge = (id, max, color) => {
  const ctx = document.getElementById(id);
  if (!ctx) {
    console.error(`Gauge canvas with ID "${id}" not found.`);
    return null;
  }
  return new Chart(ctx, { // Ensure Chart is globally available or imported
    ...gaugeConfigs,
    data: gaugeData(0, max, color)
  });
};

// ----------- Gauges with correct maxes -----------
const GAUGE_MAX_VALUES = {
  aqi: 500, voc: 3, co: 15.4, co2: 2000, pm25: 150.4,
  pm10: 154, temp: 50, pressure: 1100, humidity: 100
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

// ----------- AQI calculation & descriptions (Your existing functions) -----------
function calculateAQI(pm25_value) {
  const C = parseFloat(pm25_value);
  if (isNaN(C) || C < 0) return 0;
  let I_low, I_high, C_low, C_high;
  if (C >= 0 && C <= 12.0) { I_low = 0; I_high = 50; C_low = 0.0; C_high = 12.0; }
  else if (C > 12.0 && C <= 35.4) { I_low = 51; I_high = 100; C_low = 12.1; C_high = 35.4; }
  else if (C > 35.4 && C <= 55.4) { I_low = 101; I_high = 150; C_low = 35.5; C_high = 55.4; }
  else if (C > 55.4 && C <= 150.4) { I_low = 151; I_high = 200; C_low = 55.5; C_high = 150.4; }
  else if (C > 150.4 && C <= 250.4) { I_low = 201; I_high = 300; C_low = 150.5; C_high = 250.4; }
  else if (C > 250.4 && C <= 350.4) { I_low = 301; I_high = 400; C_low = 250.5; C_high = 350.4; }
  else if (C > 350.4 && C <= 500.4) { I_low = 401; I_high = 500; C_low = 350.5; C_high = 500.4; }
  else { return 500; }
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
    case 0: return "Clean Air (No VOCs)"; case 1: return "Low VOCs";
    case 2: return "Moderate VOCs"; case 3: return "High VOCs";
    default: return `Unknown (${vocClass})`;
  }
}
function getCODescription(co) {
  const val = parseFloat(co);
  if (isNaN(val)) return "N/A";
  if (val <= 4.4)   return "Good"; if (val <= 9.4)   return "Moderate";
  if (val <= 12.4)  return "Unhealthy for Sensitive Groups";
  if (val <= 15.4)  return "Unhealthy"; return "Very Unhealthy";
}
function getCO2Description(co2) {
  const val = parseFloat(co2);
  if (isNaN(val)) return "N/A";
  if (val <= 600)   return "Excellent (Typical Outdoor)";
  if (val <= 1000)  return "Good (Typical Indoor)";
  if (val <= 2000)  return "Moderate (Complaints of drowsiness)";
  return "High (Potential health effects)";
}
function getPMDescription(pm_value) {
    const val = parseFloat(pm_value);
    if (isNaN(val)) return "N/A";
    if (val <= 12.0) return "Good"; if (val <= 35.4) return "Moderate";
    if (val <= 55.4) return "Unhealthy for Sensitive Groups";
    if (val <= 150.4) return "Unhealthy"; if (val <= 250.4) return "Very Unhealthy";
    return "Hazardous";
}
function getTempDescription(t) {
  const val = parseFloat(t);
  if (isNaN(val)) return "N/A";
  if (val < 10)   return "Cold"; if (val <= 18)  return "Cool";
  if (val <= 25)  return "Comfortable"; if (val <= 32)  return "Warm";
  return "Hot";
}
function getPressureDescription(p) {
  const val = parseFloat(p);
  if (isNaN(val)) return "N/A";
  if (val < 1000)   return "Low Pressure";
  if (val <= 1020)  return "Normal Pressure"; return "High Pressure";
}
function getHumidityDescription(h) {
  const val = parseFloat(h);
  if (isNaN(val)) return "N/A";
  if (val < 30)    return "Dry"; if (val <= 60)   return "Comfortable";
  return "Humid";
}

// ----------- Historical line chart -----------
let aqiChart = null;
const initializeChart = () => {
    const aqiChartContext = document.getElementById('aqiLineChart')?.getContext('2d');
    if (!aqiChartContext) {
        console.error("AQI Line Chart canvas context not found!");
        return;
    }
    aqiChart = new Chart(aqiChartContext, {
      type: 'line',
      data: { labels: [], datasets: [
          { label: 'AQI', data: [], borderColor: '#f44336', backgroundColor: 'rgba(244,67,54,0.2)', fill: true, tension: 0.3, yAxisID: 'yAQI' },
          { label: 'VOC (Class)', data: [], borderColor: '#ff9800', backgroundColor: 'rgba(255,152,0,0.2)', fill: true, tension: 0.3, yAxisID: 'yVOC' },
          { label: 'CO (ppm)', data: [], borderColor: '#ffeb3b', backgroundColor: 'rgba(255,235,59,0.2)', fill: true, tension: 0.3, yAxisID: 'yOtherSmall' },
          { label: 'CO₂ (ppm)', data: [], borderColor: '#4caf50', backgroundColor: 'rgba(76,175,80,0.2)', fill: true, tension: 0.3, yAxisID: 'yCO2' },
          { label: 'PM2.5 (µg/m³)', data: [], borderColor: '#2196f3', backgroundColor: 'rgba(33,150,243,0.2)', fill: true, tension: 0.3, yAxisID: 'yOtherMedium' },
          { label: 'PM10 (µg/m³)', data: [], borderColor: '#9c27b0', backgroundColor: 'rgba(156,39,176,0.2)', fill: true, tension: 0.3, yAxisID: 'yOtherMedium' },
          { label: 'Temp (°C)', data: [], borderColor: '#e91e63', backgroundColor: 'rgba(233,30,99,0.2)', fill: true, tension: 0.3, yAxisID: 'yOtherSmall' },
          { label: 'Pressure (hPa)', data: [], borderColor: '#00bcd4', backgroundColor: 'rgba(0,188,212,0.2)', fill: true, tension: 0.3, yAxisID: 'yPressure' },
          { label: 'Humidity (%)', data: [], borderColor: '#673ab7', backgroundColor: 'rgba(103,58,183,0.2)', fill: true, tension: 0.3, yAxisID: 'yOtherMedium' }
      ]},
      options: { responsive: true, maintainAspectRatio: false, interaction: { mode: 'index', intersect: false },
        stacked: false, plugins: { legend: { position: 'top' }, tooltip: { mode: 'index', intersect: false }},
        scales: {
          yAQI: { type: 'linear', display: true, position: 'left', beginAtZero: true, max: GAUGE_MAX_VALUES.aqi, title: { display: true, text: 'AQI' }},
          yVOC: { type: 'linear', display: true, position: 'right', beginAtZero: true, max: GAUGE_MAX_VALUES.voc + 1, ticks: { stepSize: 1 }, grid: { drawOnChartArea: false }, title: { display: true, text: 'VOC Class' }},
          yCO2: { type: 'linear', display: true, position: 'right', beginAtZero: true, max: GAUGE_MAX_VALUES.co2 + 500, grid: { drawOnChartArea: false }, title: { display: true, text: 'CO₂ (ppm)' }},
          yPressure: { type: 'linear', display: true, position: 'right', min: 900, max: GAUGE_MAX_VALUES.pressure, grid: { drawOnChartArea: false }, title: { display: true, text: 'Pressure (hPa)' }},
          yOtherSmall: { type: 'linear', display: true, position: 'left', beginAtZero: true, max: 50, grid: { drawOnChartArea: false }, title: { display: true, text: 'Value (Small Scale)' }},
          yOtherMedium: { type: 'linear', display: true, position: 'left', beginAtZero: true, max: 200, grid: { drawOnChartArea: false }, title: { display: true, text: 'Value (Medium Scale)' }},
          x: { title: { display: true, text: 'Time' }}
        },
        animation: { duration: 0 }
      }
    });
};


// ----------- localStorage Functions for Chart Data -----------
function saveChartDataToLocalStorage(chart) {
  if (!chart) return;
  const dataToSave = { labels: chart.data.labels, datasets: chart.data.datasets.map(ds => ({
    label: ds.label, data: [...ds.data], borderColor: ds.borderColor, backgroundColor: ds.backgroundColor,
    fill: ds.fill, tension: ds.tension, yAxisID: ds.yAxisID
  }))};
  try { localStorage.setItem(LOCAL_STORAGE_CHART_KEY, JSON.stringify(dataToSave)); }
  catch (e) { console.error("Error saving chart data to localStorage:", e); }
}
function loadChartDataFromLocalStorage(chart) {
  if (!chart) return;
  const savedData = localStorage.getItem(LOCAL_STORAGE_CHART_KEY);
  if (savedData) {
    try {
      const parsedData = JSON.parse(savedData);
      if (parsedData && parsedData.labels && parsedData.datasets) {
        chart.data.labels = parsedData.labels;
        chart.data.datasets.forEach((chartDataset) => {
            const savedDataset = parsedData.datasets.find(ds => ds.label === chartDataset.label);
            if (savedDataset && savedDataset.data) {
                chartDataset.data = savedDataset.data;
            }
        });
        chart.update('none'); 
        console.log("Chart data loaded from localStorage.");
      }
    } catch (e) { 
        console.error("Error parsing chart data from localStorage:", e); 
        localStorage.removeItem(LOCAL_STORAGE_CHART_KEY);
    }
  }
}

// ----------- Fetch & render data (MODIFIED FOR NEW API GATEWAY ENDPOINT) -----------
const fetchData = async () => {
  try {
    // Replace 'main_air_quality_monitor' with your actual deviceId if it's different
    const deviceIdToQuery = 'main_air_quality_monitor'; 
    
    // !!! YOUR API GATEWAY INVOKE URL IS USED HERE !!!
    // The resource path is '/latestdata' and we pass 'deviceId' as a query parameter.
    const apiUrl = `https://bv26gf149c.execute-api.ap-southeast-1.amazonaws.com/prod/latestdata?deviceId=${deviceIdToQuery}`;
    
    console.log(`Workspaceing data from: ${apiUrl} at: ${new Date().toLocaleTimeString()}`);

    // If your API Gateway endpoint requires an API Key (configured in API Gateway, not Amplify):
    // const apiKey = 'YOUR_API_GATEWAY_GENERATED_API_KEY';
    // const res = await fetch(apiUrl, {
    //   headers: {
    //     'x-api-key': apiKey
    //   }
    // });
    // If no API Key is required by API Gateway:
    const res = await fetch(apiUrl);

    if (!res.ok) {
      const descAqiElement = document.getElementById('descAQI');
      if (descAqiElement) descAqiElement.innerText = `API Error: ${res.status}`;
      console.error(`API fetch failed: ${res.status} ${res.statusText}`);
      try { 
        const errorData = await res.json(); 
        console.error('Error details from API:', errorData); 
      } catch (e) { 
        const errorText = await res.text();
        console.error('Could not parse error response from API as JSON. Response text:', errorText);
      }
      return;
    }

    const data = await res.json(); 
    console.log("Raw data received from API:", JSON.stringify(data));

    if (!data || Object.keys(data).length === 0 || data.timestamp === undefined || data.timestamp === null) { 
      console.warn('API returned no data, an empty object, or data missing a "timestamp" field. Current data:', JSON.stringify(data));
      const descAqiElement = document.getElementById('descAQI');
      if (descAqiElement) descAqiElement.innerText = 'Waiting for data...';
      return;
    }

    const processedData = {
      voc:      data.VOC_ZP07_Class !== null && data.VOC_ZP07_Class !== undefined ? parseFloat(data.VOC_ZP07_Class) : NaN,
      co:       data.CO !== null && data.CO !== undefined ? parseFloat(data.CO) : NaN,
      co2:      data.CO2 !== null && data.CO2 !== undefined ? parseFloat(data.CO2) : NaN,
      pm25:     data.PM2_5 !== null && data.PM2_5 !== undefined ? parseFloat(data.PM2_5) : NaN,
      pm10:     data.PM10_0 !== null && data.PM10_0 !== undefined ? parseFloat(data.PM10_0) : NaN,
      temp:     data.Temp_AHT20 !== null && data.Temp_AHT20 !== undefined ? parseFloat(data.Temp_AHT20) : NaN,
      pressure: data.Pressure_BMP280 !== null && data.Pressure_BMP280 !== undefined ? parseFloat(data.Pressure_BMP280) : NaN,
      humidity: data.Humidity_AHT20 !== null && data.Humidity_AHT20 !== undefined ? parseFloat(data.Humidity_AHT20) : NaN,
      apiTimestamp: data.timestamp 
    };
    processedData.aqi = calculateAQI(processedData.pm25);

    console.log("Data processed for UI update:", JSON.stringify(processedData));
    
    const updateGauge = (gaugeName, value) => {
        const val = parseFloat(value);
        const max = GAUGE_MAX_VALUES[gaugeName];
        const currentGauge = gauges[gaugeName];
        if (currentGauge) {
            if (!isNaN(val)) {
                currentGauge.data.datasets[0].data = [Math.min(val, max), Math.max(0, max - Math.min(val,max))];
            } else {
                currentGauge.data.datasets[0].data = [0, max];
            }
            currentGauge.update('none');
        }
    };
    updateGauge('aqi', processedData.aqi); updateGauge('voc', processedData.voc);
    updateGauge('co', processedData.co); updateGauge('co2', processedData.co2);
    updateGauge('pm25', processedData.pm25); updateGauge('pm10', processedData.pm10);
    updateGauge('temp', processedData.temp); updateGauge('pressure', processedData.pressure);
    updateGauge('humidity', processedData.humidity);

    const setElementText = (id, text) => {
        const element = document.getElementById(id);
        if (element) { element.innerText = text; } 
        else { console.warn(`HTML element with ID "${id}" not found for text update.`); }
    };
    const formatValue = (value, unit = '', decimals = 1) => 
        !isNaN(parseFloat(value)) ? `${parseFloat(value).toFixed(decimals)}${unit}` : 'N/A';

    setElementText('valueAQI',      formatValue(processedData.aqi, '', 0));
    setElementText('valueVOC',      formatValue(processedData.voc, '', 0));
    setElementText('valueCO',       formatValue(processedData.co, ' ppm'));
    setElementText('valueCO2',      formatValue(processedData.co2, ' ppm', 0));
    setElementText('valuePM25',     formatValue(processedData.pm25, ' µg/m³'));
    setElementText('valuePM10',     formatValue(processedData.pm10, ' µg/m³'));
    setElementText('valueTemp',     formatValue(processedData.temp, ' °C'));
    setElementText('valuePressure', formatValue(processedData.pressure, ' hPa', 0));
    setElementText('valueHumidity', formatValue(processedData.humidity, ' %'));

    setElementText('descAQI',      getAQIDescription(processedData.aqi));
    setElementText('descVOC',      getVOCDescription(processedData.voc));
    setElementText('descCO',       getCODescription(processedData.co));
    setElementText('descCO2',      getCO2Description(processedData.co2));
    setElementText('descPM25',     getPMDescription(processedData.pm25));
    setElementText('descPM10',     getPMDescription(processedData.pm10));
    setElementText('descTemp',     getTempDescription(processedData.temp));
    setElementText('descPressure', getPressureDescription(processedData.pressure));
    setElementText('descHumidity', getHumidityDescription(processedData.humidity));

    if (!aqiChart) {
        console.warn("aqiChart object not initialized. Skipping chart update.");
        return;
    }
    const dataTime = processedData.apiTimestamp ? 
                     new Date(processedData.apiTimestamp).toLocaleTimeString("en-US", { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : 
                     new Date().toLocaleTimeString("en-US", { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    
    console.log("Current dataTime for chart:", dataTime);

    if (aqiChart.data.labels.length === 0 || aqiChart.data.labels[aqiChart.data.labels.length - 1] !== dataTime) {
        console.log("Updating chart: new dataTime or first data point.");
        aqiChart.data.labels.push(dataTime);
        const datasets = aqiChart.data.datasets;
        const pushChartData = (value) => (isNaN(parseFloat(value)) ? null : parseFloat(value));

        datasets[0].data.push(pushChartData(processedData.aqi)); 
        datasets[1].data.push(pushChartData(processedData.voc));
        datasets[2].data.push(pushChartData(processedData.co)); 
        datasets[3].data.push(pushChartData(processedData.co2));
        datasets[4].data.push(pushChartData(processedData.pm25)); 
        datasets[5].data.push(pushChartData(processedData.pm10));
        datasets[6].data.push(pushChartData(processedData.temp)); 
        datasets[7].data.push(pushChartData(processedData.pressure));
        datasets[8].data.push(pushChartData(processedData.humidity));

        if (aqiChart.data.labels.length > MAX_CHART_DATAPOINTS) {
          aqiChart.data.labels.shift();
          datasets.forEach(ds => ds.data.shift());
        }
        aqiChart.update('none');
        saveChartDataToLocalStorage(aqiChart);
    } else {
        console.log("Skipping chart data point addition: timestamp (dataTime) is identical to the last point.");
    }

  } catch (err) {
    console.error('Failed to fetch or process data in fetchData:', err);
    const descAqiElement = document.getElementById('descAQI');
    if (descAqiElement) {
        descAqiElement.innerText = 'Error processing data. Check console.';
    }
  }
};

// ----------- Date/time display -----------
function updateDateTime() {
  const now = new Date();
  const dateTimeElement = document.getElementById("dateTime");
  if (dateTimeElement) {
    dateTimeElement.textContent = now.toLocaleString("en-US", {
        weekday: "long", year: "numeric", month: "long", day: "numeric",
        hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: true
    });
  }
}

// ----------- Initial Setup -----------
document.addEventListener('DOMContentLoaded', () => {
  initializeChart(); 

  if (aqiChart) { 
    loadChartDataFromLocalStorage(aqiChart);
  }
  
  updateDateTime();
  setInterval(updateDateTime, 1000);
  
  fetchData(); 
  setInterval(fetchData, 5000);
});
