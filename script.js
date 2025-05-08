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

function getAQIDescription(aqi) { // Note: This function now receives the mapped AQI value (based on ZP07 class)
    // You might want to adjust this function or its input
    // to better represent the ZP07 pollution class (0-3) directly.
    // Based on the mapped value (0, 100, 200, 300):
    if (aqi <= 50) return "Clean Air (ZP07 Class 0)"; // Mapping from class 0
    if (aqi <= 100) return "Slight Pollution (ZP07 Class 1)"; // Mapping from class 1
    if (aqi <= 200) return "Middle Pollution (ZP07 Class 2)"; // Mapping from class 2
    if (aqi <= 300) return "Heavy Pollution (ZP07 Class 3)"; // Mapping from class 3
    return "Hazardous"; // For mapped values above 300 or other cases
}
function getVOCDescription(voc) { // Currently using 0 for VOC
    if (voc === 0) return "No VOC data";
    if (voc <= 200) return "Good";
    if (voc <= 400) return "Moderate";
    if (voc <= 800) return "Unhealthy"; return "Very Unhealthy";
}
function getCODescription(co) { if (co <= 4.4) return "Good"; if (co <= 9.4) return "Moderate"; if (co <= 12.4) return "Unhealthy for Sensitive Groups"; if (co <= 15.4) return "Unhealthy"; return "Very Unhealthy"; }
function getCO2Description(co2) { if (co2 <= 600) return "Good"; if (co2 <= 1000) return "Moderate"; if (co2 <= 2000) return "Unhealthy"; return "Very Unhealthy"; }
function getPMDescription(pm) { if (pm <= 12) return "Good"; if (pm <= 35) return "Moderate"; if (pm <= 55) return "Unhealthy for Sensitive Groups"; if (pm <= 150) return "Unhealthy"; return "Very Unhealthy"; }
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
    // >>> Start Real Data Fetch <<<
    // Replace with your actual API Gateway Invoke URL + /data resource
    const apiUrl = 'https://xcek49wvp7.execute-api.ap-southeast-1.amazonaws.com/v1/data';
    const res = await fetch(apiUrl);

    if (!res.ok) {
        // Handle HTTP errors (e.g., 404 if no data, 500 if Lambda error)
        console.error(`API fetch failed: ${res.status} ${res.statusText}`);
        // Optionally update UI to show error state
        return; // Stop processing if fetch failed
    }

    const data = await res.json(); // Data returned from your Lambda function (keys like mhz19_co2, temp_aht etc.)

    // Ensure data object is not empty (e.g., if Lambda returned {} on 404 without body)
    if (!data || Object.keys(data).length === 0) {
        console.warn("API returned no data.");
        // Optionally handle UI for no data
        return;
    }
    // >>> End Real Data Fetch <<<

    // >>> Map incoming data keys to frontend expected keys <<<
    // The data object contains keys from your DynamoDB item (e.g., mhz19_co2, temp_aht, pm2_5)
    // The rest of this function expects keys like json.co2, json.temp, json.pm25.
    // We map them to a new object called processedData.

    const processedData = {
        // Map sensor data keys from Lambda response (data) to frontend keys (expected by gauge/text/chart updates)
        co2: data.mhz19_co2, // MH-Z19C CO2 maps to frontend co2
        co: data.mq7_co_ppm,   // MQ-7 CO maps to frontend co
        pm25: data.pm2_5,    // PMS PM2.5 maps to frontend pm25
        pm10: data.pm10_0,   // PMS PM10 maps to frontend pm10
        temp: data.temp_aht, // AHT10 Temp maps to frontend temp (or use BMP temp if preferred)
        pressure: data.pressure_bmp, // BMP280 Pressure maps to frontend pressure
        humidity: data.humidity_aht, // AHT10 Humidity maps to frontend humidity

        // Special handling for ZP07-MP503 Pollution Class and frontend AQI/VOC:
        // The ZP07 gives a class (0-3). The frontend has an 'AQI' gauge/display.
        // Let's map the ZP07 class to the AQI gauge value for visualization scale,
        // and use the ZP07 class itself for the description. This isn't a standard AQI,
        // but uses the existing AQI gauge.
        // Map ZP07 class (0, 1, 2, 3) to AQI gauge scale values (e.g., 50, 100, 200, 300)
        aqi: data.zp07_class !== undefined && data.zp07_class !== null ? (data.zp07_class * 100) : 0, // Map class to a scale value (0, 100, 200, 300) for gauge
        zp07Class: data.zp07_class, // Keep ZP07 class for description mapping

        // The frontend also has a 'VOC' gauge, but we don't have a sensor explicitly measuring VOC.
        // If MQ-7 Rs/Raw is somewhat indicative or you have another sensor, map it here.
        // Otherwise, you might leave this gauge/display showing 0 or remove it.
        voc: 0 // Set VOC to 0 or another placeholder if no data
    };

    // >>> Update Gauges <<<
    // Now use the keys from the processedData object
    gauges.aqi.data = gaugeData(processedData.aqi, 500, '#f44336');
    gauges.voc.data = gaugeData(processedData.voc, 1000, '#ff9800');
    gauges.co.data = gaugeData(processedData.co, 100, '#ffeb3b');
    gauges.co2.data = gaugeData(processedData.co2, 2000, '#4caf50');
    gauges.pm25.data = gaugeData(processedData.pm25, 200, '#2196f3');
    gauges.pm10.data = gaugeData(processedData.pm10, 300, '#9c27b0');
    gauges.temp.data = gaugeData(processedData.temp, 50, '#e91e63');
    gauges.pressure.data = gaugeData(processedData.pressure, 1100, '#00bcd4');
    gauges.humidity.data = gaugeData(processedData.humidity, 100, '#673ab7');

    for (let key in gauges) { gauges[key].update(); }

    // >>> Update Text Values <<<
    // Use the keys from the processedData object.
    // For AQI value display, let's show the ZP07 class directly instead of the mapped value.
    document.getElementById('valueAQI').innerText = `${processedData.zp07Class}`; // Display ZP07 class (0-3)
    document.getElementById('valueVOC').innerText = `${processedData.voc} ppb`; // Display 0 or other value
    document.getElementById('valueCO').innerText = `${processedData.co} ppm`;
    document.getElementById('valueCO2').innerText = `${processedData.co2} ppm`;
    document.getElementById('valuePM25').innerText = `${processedData.pm25} µg/m³`;
    document.getElementById('valuePM10').innerText = `${processedData.pm10} µg/m³`;
    document.getElementById('valueTemp').innerText = `${processedData.temp} °C`;
    document.getElementById('valuePressure').innerText = `${processedData.pressure} hPa`;
    document.getElementById('valueHumidity').innerText = `${processedData.humidity} %`;

    // >>> Update Descriptions <<<
    // Use the keys from the processedData object.
    // For AQI description, use the ZP07 class for the lookup.
    document.getElementById('descAQI').innerText = getAQIDescription(processedData.aqi); // Using mapped value for lookup - you might want to update getAQIDescription or map zp07Class here instead
    document.getElementById('descVOC').innerText = getVOCDescription(processedData.voc);
    document.getElementById('descCO').innerText = getCODescription(processedData.co);
    document.getElementById('descCO2').innerText = getCO2Description(processedData.co2);
    document.getElementById('descPM25').innerText = getPMDescription(processedData.pm25);
    document.getElementById('descPM10').innerText = getPMDescription(processedData.pm10);
    document.getElementById('descTemp').innerText = getTempDescription(processedData.temp);
    document.getElementById('descPressure').innerText = getPressureDescription(processedData.pressure);
    document.getElementById('descHumidity').innerText = getHumidityDescription(processedData.humidity);

    // >>> Update Line Chart <<<
    const now = new Date().toLocaleTimeString(); // Use current browser time for chart label
    const ds = aqiChart.data.datasets;
    aqiChart.data.labels.push(now); // Add timestamp label

    // Add data points using keys from processedData
    ds[0].data.push(processedData.aqi); // AQI (mapped ZP07)
    ds[1].data.push(processedData.voc); // VOC (currently 0)
    ds[2].data.push(processedData.co); // CO
    ds[3].data.push(processedData.co2); // CO2
    ds[4].data.push(processedData.pm25); // PM2.5
    ds[5].data.push(processedData.pm10); // PM10
    ds[6].data.push(processedData.temp); // Temperature
    ds[7].data.push(processedData.pressure); // Pressure
    ds[8].data.push(processedData.humidity); // Humidity


    if (aqiChart.data.labels.length > 20) { // Limit number of points on chart
      aqiChart.data.labels.shift();
      ds.forEach(d => d.data.shift());
    }

    aqiChart.update(); // Update the chart
  } catch (err) {
      console.error('Failed to fetch or process data:', err);
      // Handle UI update on error if needed
  }
};

setInterval(fetchData, 5000); // Fetch data every 5 seconds
fetchData(); // Fetch data immediately on load

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

setInterval(updateDateTime, 1000); // Update date/time every second
updateDateTime(); // Update date/time immediately on load

//Work it, make it, do it, makes us
//Harder, better, faster, stronger
//More than, hour, hour, never, ever, after, work is, over
//Work it harder, make it better, Do it faster, makes us stronger
//More than ever, hour after hour, Work is never over
