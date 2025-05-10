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

// ----------- Gauges with correct maxes -----------
const gauges = {
  aqi:      createGauge('gaugeAQI',      500,   '#f44336'), // AQI 0–500
  voc:      createGauge('gaugeVOC',      3,     '#ff9800'), // VOC class 0–3
  co:       createGauge('gaugeCO',       15.4,  '#ffeb3b'), // CO ppm 0–15.4
  co2:      createGauge('gaugeCO2',      2000,  '#4caf50'), // CO₂ ppm 0–2000
  pm25:     createGauge('gaugePM25',     150,   '#2196f3'), // PM2.5 µg/m³ 0–150
  pm10:     createGauge('gaugePM10',     150,   '#9c27b0'), // PM10 µg/m³ 0–150
  temp:     createGauge('gaugeTemp',     50,    '#e91e63'), // °C 0–50
  pressure: createGauge('gaugePressure', 1100,  '#00bcd4'), // hPa 0–1100
  humidity: createGauge('gaugeHumidity', 100,   '#673ab7')  // % 0–100
};

// ----------- AQI calculation & descriptions -----------
function calculateAQI(pm25) {
  const breakpoints = [
    { pmLow:   0.0, pmHigh:  12.0, aqiLow:   0, aqiHigh:  50 },
    { pmLow:  12.1, pmHigh:  35.4, aqiLow:  51, aqiHigh: 100 },
    { pmLow:  35.5, pmHigh:  55.4, aqiLow: 101, aqiHigh: 150 },
    { pmLow:  55.5, pmHigh: 150.4, aqiLow: 151, aqiHigh: 200 },
    { pmLow: 150.5, pmHigh: 250.4, aqiLow: 201, aqiHigh: 300 },
    { pmLow: 250.5, pmHigh: 350.4, aqiLow: 301, aqiHigh: 400 },
    { pmLow: 350.5, pmHigh: 500.4, aqiLow: 401, aqiHigh: 500 }
  ];
  for (const bp of breakpoints) {
    if (pm25 >= bp.pmLow && pm25 <= bp.pmHigh) {
      return Math.round(
        ((bp.aqiHigh - bp.aqiLow) / (bp.pmHigh - bp.pmLow)) * (pm25 - bp.pmLow) +
        bp.aqiLow
      );
    }
  }
  return 500;
}

function getAQIDescription(aqi) {
  if (aqi <= 50)   return "Good";
  if (aqi <= 100)  return "Moderate";
  if (aqi <= 150)  return "Unhealthy for Sensitive Groups";
  if (aqi <= 200)  return "Unhealthy";
  if (aqi <= 300)  return "Very Unhealthy";
  return "Hazardous";
}

function getVOCDescription(v) {
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
  if (co2 <= 600)   return "Good";
  if (co2 <= 1000)  return "Moderate";
  if (co2 <= 2000)  return "Unhealthy";
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
  if (p < 1000)   return "Low Pressure";
  if (p <= 1020)  return "Normal Pressure";
  return "High Pressure";
}

function getHumidityDescription(h) {
  if (h < 30)    return "Dry";
  if (h <= 60)   return "Comfortable";
  return "Humid";
}

// ----------- Historical line chart -----------
const aqiChart = new Chart(document.getElementById('aqiLineChart'), {
  type: 'line',
  data: {
    labels: [],
    datasets: [
      { label: 'AQI',    data: [], borderColor: '#f44336', backgroundColor: 'rgba(244,67,54,0.2)', fill: true, tension: 0.3 },
      { label: 'VOC',    data: [], borderColor: '#ff9800', backgroundColor: 'rgba(255,152,0,0.2)', fill: true, tension: 0.3 },
      { label: 'CO',     data: [], borderColor: '#ffeb3b', backgroundColor: 'rgba(255,235,59,0.2)', fill: true, tension: 0.3 },
      { label: 'CO₂',    data: [], borderColor: '#4caf50', backgroundColor: 'rgba(76,175,80,0.2)', fill: true, tension: 0.3 },
      { label: 'PM2.5',  data: [], borderColor: '#2196f3', backgroundColor: 'rgba(33,150,243,0.2)', fill: true, tension: 0.3 },
      { label: 'PM10',   data: [], borderColor: '#9c27b0', backgroundColor: 'rgba(156,39,176,0.2)', fill: true, tension: 0.3 },
      { label: 'Temp (°C)',     data: [], borderColor: '#e91e63', backgroundColor: 'rgba(233,30,99,0.2)', fill: true, tension: 0.3 },
      { label: 'Pressure (hPa)',data: [], borderColor: '#00bcd4', backgroundColor: 'rgba(0,188,212,0.2)', fill: true, tension: 0.3 },
      { label: 'Humidity (%)',  data: [], borderColor: '#673ab7', backgroundColor: 'rgba(103,58,183,0.2)', fill: true, tension: 0.3 }
    ]
  },
  options: {
    scales: { y: { beginAtZero: true } },
    responsive: true,
    plugins: { legend: { position: 'top' } }
  }
});

// ----------- Fetch & render data every 5s -----------
const fetchData = async () => {
  try {
    const apiUrl = 'https://rhbwfu9pxk.execute-api.ap-southeast-1.amazonaws.com/prod/latest-sensor';
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

    const processedData = {
      aqi:      calculateAQI(data.PM2_5),    // true AQI from PM2.5
      voc:      data.VOC_ZP07_Class,         // 0–3
      co:       data.CO,
      co2:      data.CO2,
      pm25:     data.PM2_5,
      pm10:     data.PM10_0,
      temp:     data.Temp_AHT20,
      pressure: data.Pressure_BMP280,
      humidity: data.Humidity_AHT20
    };

    // Update gauges
    gauges.aqi.data      = gaugeData(processedData.aqi,      500,   '#f44336');
    gauges.voc.data      = gaugeData(processedData.voc,        3,   '#ff9800');
    gauges.co.data       = gaugeData(processedData.co,       15.4,  '#ffeb3b');
    gauges.co2.data      = gaugeData(processedData.co2,     2000,   '#4caf50');
    gauges.pm25.data     = gaugeData(processedData.pm25,     150,   '#2196f3');
    gauges.pm10.data     = gaugeData(processedData.pm10,     150,   '#9c27b0');
    gauges.temp.data     = gaugeData(processedData.temp,      50,   '#e91e63');
    gauges.pressure.data = gaugeData(processedData.pressure, 1100,   '#00bcd4');
    gauges.humidity.data = gaugeData(processedData.humidity, 100,   '#673ab7');
    Object.values(gauges).forEach(g => g.update());

    // Update numeric text
    document.getElementById('valueAQI').innerText      = processedData.aqi;
    document.getElementById('valueVOC').innerText      = processedData.voc;
    document.getElementById('valueCO').innerText       = `${processedData.co} ppm`;
    document.getElementById('valueCO2').innerText      = `${processedData.co2} ppm`;
    document.getElementById('valuePM25').innerText     = `${processedData.pm25} µg/m³`;
    document.getElementById('valuePM10').innerText     = `${processedData.pm10} µg/m³`;
    document.getElementById('valueTemp').innerText     = `${processedData.temp} °C`;
    document.getElementById('valuePressure').innerText = `${processedData.pressure} hPa`;
    document.getElementById('valueHumidity').innerText = `${processedData.humidity} %`;

    // Update descriptions
    document.getElementById('descAQI').innerText      = getAQIDescription(processedData.aqi);
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
    ds[0].data.push(processedData.aqi);
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

// ----------- Date/time display -----------
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
