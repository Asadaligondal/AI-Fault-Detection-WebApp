let fftChart = null;
let zoomFactor = 1.0;

const socket = new WebSocket("ws://localhost:8080");
// import { analyzeFFTData } from "./ai_model.js";

socket.onmessage = function (event) {
    const fftData = JSON.parse(event.data);
    console.log("Received FFT Data:", fftData);

    if (fftData.frequencies && fftData.magnitudes) {
        updateFFTChart(fftData.frequencies, fftData.magnitudes);
        checkForFaults(fftData.magnitudes);
    } else {
        console.error("FFT Data is missing frequencies or magnitudes.");
    }
};

// Function to Initialize FFT Chart with Panning & Zooming
function createFFTChart() {
    const ctx = document.getElementById("fftChart").getContext("2d");

    fftChart = new Chart(ctx, {
        type: "bar",
        data: {
            labels: [],
            datasets: [
                {
                    label: "FFT Magnitude",
                    data: [],
                    backgroundColor: "red",
                    borderColor: "darkred",
                    borderWidth: 1,
                    barThickness: 10,
                },
            ],
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: {
                    title: { display: true, text: "Frequency (Hz)" },
                    grid: { display: false },
                },
                y: {
                    title: { display: true, text: "Magnitude" },
                    min: 0,
                },
            },
            plugins: {
                zoom: {
                    pan: {
                        enabled: true,
                        mode: "xy", // Allow panning in both X and Y directions
                        onPanComplete: function () {
                            console.log("Panning completed");
                        },
                    },
                    zoom: {
                        wheel: {
                            enabled: true, // Enable zoom with the mouse wheel
                        },
                        drag: {
                            enabled: true, // Enable dragging to zoom
                        },
                        pinch: {
                            enabled: true, // Enable pinch-to-zoom for touch screens
                        },
                        mode: "xy", // Zoom in both X and Y directions
                        onZoomComplete: function () {
                            console.log("Zooming completed");
                        },
                    },
                },
            },
        },
    });

    console.log("FFT Chart Initialized with Zoom & Panning.");
}

// Function to Update FFT Chart
function updateFFTChart(frequencies, magnitudes) {
    if (!fftChart) {
        console.error("FFT Chart is not initialized yet!");
        return;
    }

    console.log("Updating Chart with Data:", frequencies, magnitudes);

    fftChart.data.labels = frequencies;
    fftChart.data.datasets[0].data = magnitudes;
    fftChart.update();
}

// Function to Zoom In
function zoomInFFT() {
    fftChart.zoom(1.2);
}

// Function to Zoom Out
function zoomOutFFT() {
    fftChart.zoom(0.8);
}

// Function to Reset Zoom & Pan
function resetZoomFFT() {
    fftChart.resetZoom();
}

// Event Listener for "View FFT Data" Button
document.getElementById("viewDataBtn").addEventListener("click", function () {
    const sensorDataDiv = document.getElementById("sensorData");

    if (sensorDataDiv.style.display === "none" || sensorDataDiv.style.display === "") {
        sensorDataDiv.style.display = "block";

        if (!fftChart) {
            createFFTChart();
        }
    } else {
        sensorDataDiv.style.display = "none";
    }
});

// Simulating Real-Time FFT Signal with Variations
setInterval(() => {
    let frequencies = Array.from({ length: 50 }, (_, i) => i * 5);
    let magnitudes = frequencies.map(f => Math.sin(f * 0.1) * 5 + Math.random() * 2);

    updateFFTChart(frequencies, magnitudes);
}, 1000);
