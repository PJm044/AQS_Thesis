// script.js

// The Invoke URL for your GET method on the /data resource from API Gateway
const API_ENDPOINT = 'https://YOUR_API_GATEWAY_INVOKE_URL/YOUR_STAGE/data'; // Replace with your actual URL!

// Chart.js instances (to be initialized later)
let aqiGaugeChart, vocGaugeChart, coGaugeChart, co2GaugeChart, pm25GaugeChart, pm10GaugeChart, tempGaugeChart, pressureGaugeChart, humidityGaugeChart;
let aqiLineChartInstance;

// Helper function to get description and color for AQI
function getAQIDetails(aqi) {
    if (aqi === null || aqi === undefined) return { description: "Unknown", color: "#cccccc" };
    if (aqi <= 50) return { description: "Good", color: "#00e400" };
    if (aqi <= 100) return { description: "Moderate", color: "#ffff00" };
    if (aqi <= 150) return { description: "Unhealthy for Sensitive Groups", color: "#ff7e00" };
    if (aqi <= 200) return { description: "Unhealthy", color: "#ff0000" };
    if (aqi <= 300) return { description: "Very Unhealthy", color: "#8f3f97" };
    return { description: "Hazardous", color: "#7e0023" };
}

// Helper function for VOC description (based on vocClass)
function getVOCDetails(vocClass) {
    if (vocClass === null || vocClass === undefined) return { description: "Unknown" };
    // Assuming vocClass is like "Clean", "Moderate Pollution", "High Pollution"
    // You might want to map these classes to specific descriptions/colors
    return { description: vocClass }; // Or more detailed based on your classes
}

// Generic helper for other pollutants (add ranges as per standards)
function getPollutantDescription(value, type) {
    if (value === null || value === undefined) return "Unknown";
    // Add your logic for CO, CO2, PM2.5, PM10 descriptions
    // For example:
    if (type === "CO" && value > 10) return "High";
    if (type === "CO" && value > 5) return "Moderate";
    return "Normal"; // Placeholder
}

// Function to update a gauge's displayed value and description
function updateGaugeDisplay(valueElementId, descElementId, value, description) {
    const valueEl = document.getElementById(valueElementId);
    const descEl = document.getElementById(descElementId);
    if (valueEl) valueEl.textContent = (value !== null && value !== undefined) ? value : "N/A";
    if (descEl) descEl.textContent = description || "Unknown";
}

// Function to update the actual Chart.js gauge (you'll need to implement this based on your chart type)
function updateChartJSGauge(chartInstance, canvasId, value, maxValue, label, color) {
    const ctx = document.getElementById(canvasId).getContext('2d');
    if (!chartInstance) {
        // This is a placeholder for creating a new gauge chart
        // You might use a doughnut chart with one segment for the value
        // and another for the remainder, or a dedicated gauge plugin.
        console.warn(`Chart.js gauge for ${canvasId} needs to be initialized.`);
        // Example (very basic, needs proper Chart.js setup for a gauge):
        // chartInstance = new Chart(ctx, {
        // type: 'doughnut',
        // data: {
        // datasets: [{
        // data: [value, maxValue - value],
        // backgroundColor: [color, '#e0e0e0'],
        // label: label
        // }]
        // },
        // options: { rotation: -90, circumference: 180, cutout: '70%' }
        // });
        // return chartInstance;
    } else {
        // Update existing chart
        // chartInstance.data.datasets[0].data = [value, maxValue - value];
        // chartInstance.data.datasets[0].backgroundColor[0] = color;
        // chartInstance.update();
    }
    // For now, we'll just update the text until gauge logic is in place
    console.log(`Visually update ${canvasId} to ${value} with color ${color}`);
}


async function fetchDataAndUpdateDashboard() {
    try {
        const response = await fetch(API_ENDPOINT);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        console.log("Data from AWS:", data);

        if (data.message && data.message === "Waiting for live sensor data...") {
            console.log("Waiting for data, using defaults from Lambda if provided.");
            // Update displays with the "waiting" message or default values
        }

        // Update AQI
        const aqiDetails = getAQIDetails(data.aqi);
        updateGaugeDisplay('valueAQI', 'descAQI', data.aqi, aqiDetails.description);
        updateChartJSGauge(aqiGaugeChart, 'gaugeAQI', data.aqi, 500, 'AQI', aqiDetails.color); // Max AQI 500

        // Update VOC
        // Lambda returns voc: null and vocClass: "description string"
        // The HTML has valueVOC (ppb) and descVOC.
        // We will display "N/A" or 0 for ppb and use vocClass for description.
        const vocDetails = getVOCDetails(data.vocClass);
        updateGaugeDisplay('valueVOC', 'descVOC', data.voc, vocDetails.description); // data.voc is likely null
        // updateChartJSGauge for VOC might need to be based on vocClass severity if no numeric value
        // For now, let's assume valueVOC will show 'N/A' if data.voc is null.

        // Update CO
        updateGaugeDisplay('valueCO', 'descCO', data.co, getPollutantDescription(data.co, "CO"));
        // updateChartJSGauge(coGaugeChart, 'gaugeCO', data.co, 50, 'CO', getPollutantColor(data.co)); // Max CO e.g. 50ppm

        // Update CO2
        updateGaugeDisplay('valueCO2', 'descCO2', data.co2, getPollutantDescription(data.co2, "CO2"));
        // updateChartJSGauge(co2GaugeChart, 'gaugeCO2', data.co2, 5000, 'CO2', getPollutantColor(data.co2)); // Max CO2 e.g. 5000ppm

        // Update PM2.5
        updateGaugeDisplay('valuePM25', 'descPM25', data.pm25, getPollutantDescription(data.pm25, "PM2.5"));
        // updateChartJSGauge(pm25GaugeChart, 'gaugePM25', data.pm25, 300, 'PM2.5', getPollutantColor(data.pm25)); // Max PM2.5 e.g. 300µg/m³

        // Update PM10
        updateGaugeDisplay('valuePM10', 'descPM10', data.pm10, getPollutantDescription(data.pm10, "PM10"));
        // updateChartJSGauge(pm10GaugeChart, 'gaugePM10', data.pm10, 600, 'PM10', getPollutantColor(data.pm10)); // Max PM10 e.g. 600µg/m³

        // Update Temperature
        updateGaugeDisplay('valueTemp', 'descTemp', data.temp, `${data.temp}°C`); // Simple desc or add ranges
        // updateChartJSGauge(tempGaugeChart, 'gaugeTemp', data.temp, 50, 'Temp', '#2196F3'); // Max Temp e.g. 50°C

        // Update Pressure
        updateGaugeDisplay('valuePressure', 'descPressure', data.pressure, `${data.pressure} hPa`);
        // updateChartJSGauge(pressureGaugeChart, 'gaugePressure', data.pressure, 1100, 'Pressure', '#795548'); // Range e.g. 900-1100 hPa

        // Update Humidity
        updateGaugeDisplay('valueHumidity', 'descHumidity', data.humidity, `${data.humidity}%`);
        // updateChartJSGauge(humidityGaugeChart, 'gaugeHumidity', data.humidity, 100, 'Humidity', '#00BCD4');

        // Update Timestamp in the header
        const dateTimeEl = document.getElementById('dateTime');
        if (dateTimeEl && data.timestamp) {
            dateTimeEl.textContent = `Last Updated: ${new Date(data.timestamp).toLocaleString()}`;
        }

        // Update line chart (assuming you have historical data or want to plot current AQI over time)
        // This requires more complex data handling (e.g., fetching a series of data points)
        // For now, this is a placeholder:
        // updateAqiLineChart([{ timestamp: new Date(data.timestamp).toLocaleTimeString(), aqiValue: data.aqi }]);

    } catch (error) {
        console.error("Could not fetch or update air quality data:", error);
        updateGaugeDisplay('valueAQI', 'descAQI', 'Error', 'Failed to load data');
        // Update other gauges to show error state
        document.getElementById('valueVOC').textContent = "Error";
        document.getElementById('descVOC').textContent = "Failed to load data";
        // ... and so on for all other gauges
    }
}

// Function to update the main date and time (client-side clock for the header)
// You can choose to use the server timestamp for "Last Updated" as done above.
function updateClientDateTime() {
    const now = new Date();
    const dateTimeElement = document.getElementById('dateTime');
    if (dateTimeElement && !dateTimeElement.textContent.startsWith("Last Updated")) { // Only if not set by server data
         dateTimeElement.textContent = now.toLocaleString();
    }
}

// Initialize Chart.js Gauges and Line Chart (called once on load)
function initializeCharts() {
    // This is where you would use Chart.js to create your gauge and line chart instances.
    // For each canvas (e.g., 'gaugeAQI', 'gaugeVOC', ..., 'aqiLineChart'),
    // you'd create a new Chart object and store its instance in the global variables.
    // Example for the line chart (you'll need to adapt for gauges):
    const aqiLineCtx = document.getElementById('aqiLineChart').getContext('2d');
    aqiLineChartInstance = new Chart(aqiLineCtx, {
        type: 'line',
        data: {
            labels: [], // To be populated with timestamps
            datasets: [{
                label: 'AQI Over Time',
                data: [], // To be populated with AQI values
                borderColor: 'rgb(75, 192, 192)',
                tension: 0.1
            }]
        },
        options: {
            scales: {
                y: { beginAtZero: true, suggestedMax: 300 }, // Adjust suggestedMax as needed
                x: { type: 'time', time: { unit: 'minute' } } // If using time series data
            },
            responsive: true,
            maintainAspectRatio: false
        }
    });

    // You need to implement or find a Chart.js plugin for the gauge visuals.
    // For now, the updateChartJSGauge function above is a placeholder.
    // Initialize other gauge chart instances here (e.g., aqiGaugeChart = new Chart(...))
    console.log("Chart.js instances should be initialized here.");
}


// Run when the window loads
window.onload = () => {
    updateClientDateTime(); // Set initial time
    setInterval(updateClientDateTime, 60000); // Update client-side clock every minute if not using server time

    initializeCharts(); // Setup your Chart.js charts
    fetchDataAndUpdateDashboard(); // Fetch initial data

    // Fetch data periodically (e.g., every 1 minute)
    setInterval(fetchDataAndUpdateDashboard, 60 * 1000);
};

// Placeholder function to update the line chart with new data
// This is a simplified example; you'll need to manage labels and datasets properly
let historicalDataPoints = []; // Store data points for the line chart
const MAX_DATA_POINTS = 20; // Max points to show on the chart

function updateAqiLineChart(newDataPoint) { // newDataPoint = { timestamp: new Date(), aqiValue: data.aqi }
    if (!aqiLineChartInstance) return;

    const chart = aqiLineChartInstance;

    // Add new data
    chart.data.labels.push(newDataPoint.timestamp);
    chart.data.datasets.forEach((dataset) => {
        dataset.data.push(newDataPoint.aqiValue);
    });

    // Limit the number of data points
    if (chart.data.labels.length > MAX_DATA_POINTS) {
        chart.data.labels.shift(); // Remove the oldest label
        chart.data.datasets.forEach((dataset) => {
            dataset.data.shift(); // Remove the oldest data point
        });
    }
    chart.update();
}

// Modify fetchDataAndUpdateDashboard to call updateAqiLineChart
// Inside fetchDataAndUpdateDashboard, after getting `data`:
// if (data.aqi !== null && data.aqi !== undefined && data.timestamp) {
//     updateAqiLineChart({ timestamp: new Date(data.timestamp), aqiValue: data.aqi });
// }
