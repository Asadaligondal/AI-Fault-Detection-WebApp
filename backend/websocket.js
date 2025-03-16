const WebSocket = require("ws");
const fft = require("fft-js").fft;
const fftUtil = require("fft-js").util;

const wss = new WebSocket.Server({ port: 8080 });

console.log("WebSocket server running on ws://localhost:8080");

let t = 0;
const sampleSize = 64;  // FFT works best with powers of 2
let sensorBuffer = [];  // Buffer to store recent sensor data

// Function to generate oscillating accelerometer data
function generateSensorData() {
    t += 0.1;

    const dataPoint = Math.sin(t) * 2; // Single oscillating value
    return dataPoint;
}

// Function to compute FFT when enough data is collected
function computeFFT() {
    if (sensorBuffer.length < sampleSize) return null;  // Not enough data

    const fftResult = fft(sensorBuffer);  // Compute FFT
    const frequencies = fftUtil.fftFreq(fftResult, 500); // Assume 500Hz sample rate
    const magnitudes = fftUtil.fftMag(fftResult);

    return {
        frequencies: frequencies.slice(0, sampleSize / 2).map(f => f.toFixed(2)),
        magnitudes: magnitudes.slice(0, sampleSize / 2).map(m => m.toFixed(2))
    };
}

// Send data to connected clients every 500ms
setInterval(() => {
    const newReading = generateSensorData();
    sensorBuffer.push(newReading);

    if (sensorBuffer.length > sampleSize) {
        sensorBuffer.shift(); // Keep only the latest N samples
    }

    const fftData = computeFFT();
    if (!fftData) return; // Skip sending if FFT isn't ready yet

    const dataToSend = JSON.stringify(fftData);
    wss.clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(dataToSend);
        }
    });
}, 10);
