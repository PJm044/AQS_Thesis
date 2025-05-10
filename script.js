// ----------- Gauge setup (no changes) -----------
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
    }
  }
};

const gaugeData = (value, max, color) => ({
  labels: [''],
  datasets: [{
    data: [value, max - value],
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

// ----------- Gauges with updated max values -----------
const gauges = {
  aqi: createGauge('gaugeAQI', 300, '#f44336'),          // ZP07 Class ▸ 0–3 mapped to 0–300
  voc: createGauge('gaugeVOC', 3,    '#ff9800'),         // VOC Class ▸ 0–3
  co: createGauge('gaugeCO',  15.4, '#ffeb3b'),          // CO ppm ▸ 0–15.4
  co2: createGauge('gaugeCO2',2000, '#4caf50'),          // CO₂ ppm ▸ 0–2000
  pm25: createGauge('gaugePM25',150, '#2196f3'),         // PM2.5 µg/m³ ▸ 0–150
  pm10: createGauge('gaugePM10',150, '#9c27b0'),         // PM10 µg/m³ ▸ 0–150
  temp: createGauge('gaugeTemp', 50,  '#e91e63'),        // °C ▸ -10–50 (treated as 0–50)
  pressure: createGauge('gaugePressure',1100,'#00bcd4'), // hPa ▸ 900–1100 (0–1100)
  humidity: createGauge('gaugeHumidity',100,'#673ab7')   // % ▸ 0–100
};

// ----------- Description functions with real ranges -----------
function getAQIDescription(classVal) {
  // Now we receive ZP07 class 0–3 directly
  switch (classVal) {
    case 0: return "Clean Air (Class 0)";
    case 1: return "Slight Pollution (Class 1)";
    case 2: return "Moderate Pollution (Class 2)";
    case 3: return "Heavy Pollution (Class 3)";
    default: return "Unknown AQI Class";
  }
}

function getVOCDescription(v) {
  // VOC class 0–3
  switch (v) {
    case 0: return "No VOCs Detected";
    case 1: return "Low VOCs";
    case 2: return "Moderate VOCs";
    case 3: return "High VOCs";
    default: return "Unknown VOC Level";
  }
}

function getCODescription(co) {
  if (co <= 4.4)   return "Good";
  if (co <= 9.4)   return "Moderate";
  if (co <= 12.4)  return "Unhealthy for Sensitive Groups";
  if (co <= 15.4)  return "Unhealthy";
  return "Very Unhealthy";
}

function getCO2Description(co2) {
  if (co2 <= 600)  return "Good";
  if (co2 <= 1000) return "Moderate";
  if (co2 <= 2000) return "Unhealthy";
  return "Very Unhealthy";
}

function getPMDescription(pm) {
  if (pm <= 12)    return "Good";
  if (pm <= 35)    return "Moderate";
  if (pm <= 55)    return "Unhealthy for Sensitive Groups";
  if (pm <= 150)   return "Unhealthy";
  return "Very Unhealthy";
}

function getTempDescription(t) {
  if (t <= 10)  return "Cold";
  if (t <= 25)  return "Comfortable";
  if (t <= 35)  return "Warm";
  return "Hot";
}

function getPressureDescription(p) {
  if (p < 1000) return "Low Pressure";
  if (p <= 1020) return "Normal Pressure";
  return "High Pressure";
}

function getHumidityDescription(h) {
  if (h < 30)   return "Dry";
  if (h <= 60)  return "Comfortable";
  return "Humid";
}

// ----------- Line chart (unchanged) -----------
const aqiChart = new Chart(document.getElementById('aqiLineChart'), {
  type: 'line',
  data: {
    labels: [],
    datasets: [
      { label: 'AQI', data: [], borderColor: '#f44336', backgroundColor: 'rgba(244, 67, 54, 0.2)', fill: true, tension: 0.3 },
      { label: 'VOC', data: [], borderColor: '#ff9800', backgroundColor: 'rgba(255, 152, 0, 0.2)', fill: true, tension: 0.3 },
      { label: 'CO', data: [], borderColor: '#ffeb3b', backgroundColor: 'rgba(255, 235, 59, 0.2)', fill: true, tension: 0.3 },
      { label: 'CO₂', data: [], borderColor: '#4caf50', backgroundColor: 'rgba(76, 175, 80, 0.2)', fill: true, tension: 0.3 },
      { label: 'PM2.5', data: [], borderColor: '#2196f3', backgroundColor: 'rgba(33, 150, 243, 0.2)', fill: true, tension: 0.3 },
      { label: 'PM10', data: [], borderColor: '#9c27b0', backgroundColor: 'rgba(156, 39, 176, 0.2)', fill: true, tension: 0.3 },
      { label: 'Temp (°C)', data: [], borderColor: '#e91e63', backgroundColor: 'rgba(233, 30, 99, 0.2)', fill: true, tension: 0.3 },
      { label: 'Pressure (hPa)', data: [], borderColor: '#00bcd4', backgroundColor: 'rgba(0, 188, 212, 0.2)', fill: true, tension: 0.3 },
      { label: 'Humidity (%)', data: [], borderColor: '#673ab7', backgroundColor: 'rgba(103, 58, 183, 0.2)', fill: true, tension: 0.3 }
    ]
  },
  options: {
    scales: { y: { beginAtZero: true } },
    responsive: true,
    plugins: { legend: { position: 'top' } }
  }
});

// ----------- Fetch & render real data -----------
const fetchData = async () => {
  try {
    const apiUrl = 'https://rhbwfu9pxk.execute-api.ap-southeast-1.amazonaws.com/prod';
    const res = await fetch(apiUrl);

    if (!res.ok) {
      console.error(`API fetch failed: ${res.status} ${res.statusText}`);
      return;
    }

    const data = await res.json();
    if (!data || Object.keys(data).length === 0) {
      console.warn('API returned no data.');
      return;
    }

    // Map DynamoDB fields → frontend keys
    const processedData = {
      aqi:   data.zp07_class * 100,    // for gauge scale
      zp07Class: data.zp07_class,      // for description & text
      voc:   data.voc_class ?? 0,      // 0–3
      co:    data.mq7_co_ppm,
      co2:   data.mhz19_co2,
      pm25:  data.pm2_5,
      pm10:  data.pm10_0,
      temp:  data.temp_aht,
      pressure: data.pressure_bmp,
      humidity: data.humidity_aht
    };

    // Update gauges
    gauges.aqi.data    = gaugeData(processedData.aqi,    300,  '#f44336');
    gauges.voc.data    = gaugeData(processedData.voc,      3,  '#ff9800');
    gauges.co.data     = gaugeData(processedData.co,     15.4,'#ffeb3b');
    gauges.co2.data    = gaugeData(processedData.co2,   2000, '#4caf50');
    gauges.pm25.data   = gaugeData(processedData.pm25,   150, '#2196f3');
    gauges.pm10.data   = gaugeData(processedData.pm10,   150, '#9c27b0');
    gauges.temp.data   = gaugeData(processedData.temp,    50, '#e91e63');
    gauges.pressure.data = gaugeData(processedData.pressure,1100,'#00bcd4');
    gauges.humidity.data = gaugeData(processedData.humidity,100,'#673ab7');

    Object.values(gauges).forEach(g => g.update());

    // Update numeric text
    document.getElementById('valueAQI').innerText      = processedData.zp07Class;
    document.getElementById('valueVOC').innerText      = processedData.voc;
    document.getElementById('valueCO').innerText       = `${processedData.co} ppm`;
    document.getElementById('valueCO2').innerText      = `${processedData.co2} ppm`;
    document.getElementById('valuePM25').innerText     = `${processedData.pm25} µg/m³`;
    document.getElementById('valuePM10').innerText     = `${processedData.pm10} µg/m³`;
    document.getElementById('valueTemp').innerText     = `${processedData.temp} °C`;
    document.getElementById('valuePressure').innerText = `${processedData.pressure} hPa`;
    document.getElementById('valueHumidity').innerText = `${processedData.humidity} %`;

    // Update descriptions
    document.getElementById('descAQI').innerText      = getAQIDescription(processedData.zp07Class);
    document.getElementById('descVOC').innerText      = getVOCDescription(processedData.voc);
    document.getElementById('descCO').innerText       = getCODescription(processedData.co);
    document.getElementById('descCO2').innerText      = getCO2Description(processedData.co2);
    document.getElementById('descPM25').innerText     = getPMDescription(processedData.pm25);
    document.getElementById('descPM10').innerText     = getPMDescription(processedData.pm10);
    document.getElementById('descTemp').innerText     = getTempDescription(processedData.temp);
    document.getElementById('descPressure').innerText = getPressureDescription(processedData.pressure);
    document.getElementById('descHumidity').innerText = getHumidityDescription(processedData.humidity);

    // Update line chart
    const now = new Date().toLocaleTimeString();
    const ds  = aqiChart.data.datasets;
    aqiChart.data.labels.push(now);
    ds[0].data.push(processedData.zp07Class);
    ds[1].data.push(processedData.voc);
    ds[2].data.push(processedData.co);
    ds[3].data.push(processedData.co2);
    ds[4].data.push(processedData.pm25);
    ds[5].data.push(processedData.pm10);
    ds[6].data.push(processedData.temp);
    ds[7].data.push(processedData.pressure);
    ds[8].data.push(processedData.humidity);

    if (aqiChart.data.labels.length > 20) {
      aqiChart.data.labels.shift();
      ds.forEach(d => d.data.shift());
    }
    aqiChart.update();

  } catch (err) {
    console.error('Failed to fetch or process data:', err);
  }
};

setInterval(fetchData, 5000);
fetchData();

// ----------- Date/time display (unchanged) -----------
function updateDateTime() {
  const now = new Date();
  const opts = {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
    hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: true
  };
  document.getElementById("dateTime").textContent =
    now.toLocaleString("en-US", opts);
}
setInterval(updateDateTime, 1000);
updateDateTime();
