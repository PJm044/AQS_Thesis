const gaugeConfigs = { type: 'doughnut', options: { responsive: true, rotation: -90, circumference: 180, cutout: '80%', plugins: { tooltip: { enabled: false }, legend: { display: false } } } };

const gaugeData = (value, max, color) => ({ labels: [''], datasets: [{ data: [value, max - value], backgroundColor: [color, '#e0e0e0'], borderWidth: 0 }] });

const createGauge = (id, max, color) => { return new Chart(document.getElementById(id), { ...gaugeConfigs, data: gaugeData(0, max, color) }); };

const gauges = {
  aqi: createGauge('gaugeAQI', 500, '#f44336'),
  voc: createGauge('gaugeVOC', 1000, '#ff9800'),
  co: createGauge('gaugeCO', 100, '#ffeb3b'),
  co2: createGauge('gaugeCO2', 2000, '#4caf50'),
  pm25: createGauge('gaugePM25', 200, '#2196f3'),
  pm10: createGauge('gaugePM10', 300, '#9c27b0'),
  temp: createGauge('gaugeTemp', 50, '#e91e63'),
  pressure: createGauge('gaugePressure', 1100, '#00bcd4'),
  humidity: createGauge('gaugeHumidity', 100, '#673ab7')
};

function getAQIDescription(aqi) { if (aqi <= 50) return "Good"; if (aqi <= 100) return "Moderate"; if (aqi <= 150) return "Unhealthy for Sensitive Groups"; if (aqi <= 200) return "Unhealthy"; if (aqi <= 300) return "Very Unhealthy"; return "Hazardous"; }
function getVOCDescription(voc) { if (voc <= 200) return "Good"; if (voc <= 400) return "Moderate"; if (voc <= 800) return "Unhealthy"; return "Very Unhealthy"; }
function getCO2Description(co2) { if (co2 <= 600) return "Good"; if (co2 <= 1000) return "Moderate"; if (co2 <= 2000) return "Unhealthy"; return "Very Unhealthy"; }
function getPMDescription(pm) { if (pm <= 12) return "Good"; if (pm <= 35) return "Moderate"; if (pm <= 55) return "Unhealthy for Sensitive Groups"; if (pm <= 150) return "Unhealthy"; return "Very Unhealthy"; }
function getCODescription(co) { if (co <= 4.4) return "Good"; if (co <= 9.4) return "Moderate"; if (co <= 12.4) return "Unhealthy for Sensitive Groups"; if (co <= 15.4) return "Unhealthy"; return "Very Unhealthy"; }
function getTempDescription(temp) { if (temp <= 10) return "Cold"; if (temp <= 25) return "Comfortable"; if (temp <= 35) return "Warm"; return "Hot"; }
function getPressureDescription(pressure) { if (pressure < 1000) return "Low Pressure"; if (pressure <= 1020) return "Normal Pressure"; return "High Pressure"; }
function getHumidityDescription(h) { if (h < 30) return "Dry"; if (h <= 60) return "Comfortable"; return "Humid";}

const aqiChart = new Chart(document.getElementById('aqiLineChart'), {
  type: 'line',
  data: {
    labels: [],
    datasets: [
      { label: 'AQI', data: [], borderColor: '#f44336', backgroundColor: 'rgba(244, 67, 54, 0.2)', fill: true, tension: 0.3 },
      { label: 'VOC (ppb)', data: [], borderColor: '#ff9800', backgroundColor: 'rgba(255, 152, 0, 0.2)', fill: true, tension: 0.3 },
      { label: 'CO (ppm)', data: [], borderColor: '#ffeb3b', backgroundColor: 'rgba(255, 235, 59, 0.2)', fill: true, tension: 0.3 },
      { label: 'CO₂ (ppm)', data: [], borderColor: '#4caf50', backgroundColor: 'rgba(76, 175, 80, 0.2)', fill: true, tension: 0.3 },
      { label: 'PM2.5 (µg/m³)', data: [], borderColor: '#2196f3', backgroundColor: 'rgba(33, 150, 243, 0.2)', fill: true, tension: 0.3 },
      { label: 'PM10 (µg/m³)', data: [], borderColor: '#9c27b0', backgroundColor: 'rgba(156, 39, 176, 0.2)', fill: true, tension: 0.3 },
      { label: 'Temperature (°C)', data: [], borderColor: '#e91e63', backgroundColor: 'rgba(233, 30, 99, 0.2)', fill: true, tension: 0.3 },
      { label: 'Pressure (hPa)', data: [], borderColor: '#00bcd4', backgroundColor: 'rgba(0, 188, 212, 0.2)', fill: true, tension: 0.3 },
      { label: 'Humidity (%)', data: [], borderColor: '#673ab7', backgroundColor: 'rgba(103, 58, 183, 0.2)', fill: true, tension: 0.3 }
    ]
  },
  options: { scales: { y: { beginAtZero: true } }, responsive: true, plugins: { legend: { position: 'top' } } }
});

const fetchData = async () => {
  try {
    const json = {
      
      //Simulation data code
      aqi: Math.floor(Math.random() * 500), 
      voc: Math.floor(Math.random() * 1000),
      co: Math.floor(Math.random() * 100),  
      co2: Math.floor(Math.random() * 2000), 
      pm25: Math.floor(Math.random() * 200), 
      pm10: Math.floor(Math.random() * 300), 
      temp: (Math.random() * 50).toFixed(1), 
      pressure: Math.floor(950 + Math.random() * 150), 
      humidity: Math.floor(Math.random() * 101) };
    
    //Real code
    //const res = await fetch('/data');
    //const json = await res.json();

    gauges.aqi.data = gaugeData(json.aqi, 500, '#f44336');
    gauges.voc.data = gaugeData(json.voc, 1000, '#ff9800');
    gauges.co.data = gaugeData(json.co, 100, '#ffeb3b');
    gauges.co2.data = gaugeData(json.co2, 2000, '#4caf50');
    gauges.pm25.data = gaugeData(json.pm25, 200, '#2196f3');
    gauges.pm10.data = gaugeData(json.pm10, 300, '#9c27b0');  
    gauges.temp.data = gaugeData(json.temp, 50, '#e91e63');
    gauges.pressure.data = gaugeData(json.pressure, 1100, '#00bcd4');
    gauges.humidity.data = gaugeData(json.humidity, 100, '#673ab7');

    for (let key in gauges) { gauges[key].update(); }

    document.getElementById('valueAQI').innerText = `${json.aqi}`;
    document.getElementById('valueVOC').innerText = `${json.voc} ppb`;
    document.getElementById('valueCO').innerText = `${json.co} ppm`;
    document.getElementById('valueCO2').innerText = `${json.co2} ppm`;
    document.getElementById('valuePM25').innerText = `${json.pm25} µg/m³`;
    document.getElementById('valuePM10').innerText = `${json.pm10} µg/m³`;
    document.getElementById('valueTemp').innerText = `${json.temp} °C`;
    document.getElementById('valuePressure').innerText = `${json.pressure} hPa`;
    document.getElementById('valueHumidity').innerText = `${json.humidity} %`;

    document.getElementById('descAQI').innerText = getAQIDescription(json.aqi);
    document.getElementById('descVOC').innerText = getVOCDescription(json.voc);
    document.getElementById('descCO').innerText = getCODescription(json.co);
    document.getElementById('descCO2').innerText = getCO2Description(json.co2);
    document.getElementById('descPM25').innerText = getPMDescription(json.pm25);
    document.getElementById('descPM10').innerText = getPMDescription(json.pm10);
    document.getElementById('descTemp').innerText = getTempDescription(json.temp);
    document.getElementById('descPressure').innerText = getPressureDescription(json.pressure);
    document.getElementById('descHumidity').innerText = getHumidityDescription(json.humidity);

    const now = new Date().toLocaleTimeString();
    const ds = aqiChart.data.datasets;
    aqiChart.data.labels.push(now);
    ds[0].data.push(json.aqi);
    ds[1].data.push(json.voc);
    ds[2].data.push(json.co);  
    ds[3].data.push(json.co2); 
    ds[4].data.push(json.pm25); 
    ds[5].data.push(json.pm10); 
    ds[6].data.push(json.temp); 
    ds[7].data.push(json.pressure);
    ds[8].data.push(json.humidity);

    if (aqiChart.data.labels.length > 20) { 
      aqiChart.data.labels.shift(); 
      ds.forEach(d => d.data.shift()); 
    }

    aqiChart.update();
  } catch (err) { console.error('Failed to simulate data:', err); }
};

setInterval(fetchData, 5000);
fetchData();

function updateDateTime() {
  const now = new Date();
  const options = {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: true
  };
  const formatted = now.toLocaleString("en-US", options);
  document.getElementById("dateTime").textContent = formatted;
}

setInterval(updateDateTime, 1000);
updateDateTime();

//Work it, make it, do it, makes us
//Harder, better, faster, stronger
//More than, hour, hour, never, ever, after, work is, over
//Work it harder, make it better, Do it faster, makes us stronger
//More than ever, hour after hour, Work is never over
