/**
 * Simplified Accelerometer FFT Analyzer
 */

document.addEventListener('DOMContentLoaded', function() {
    // Global variables
    let socket = null;
    window.accelDataPaused = false;
    window.accelChart = null;
    
    // FFT configuration
    const FFT_SIZE = 1024;
    const UPDATE_INTERVAL = 50; // ms
    
    // Single data buffer for FFT
    let dataBuffer = new Float32Array(FFT_SIZE);
    let bufferIndex = 0;
    let bufferFilled = false;
    
    // Component frequencies for marker display
    const componentFrequencies = {
        motor: 60,  // 60Hz
        pulley: 30, // 30Hz
        belt: 15,   // 15Hz
        bearing: 120, // 120Hz
        gear: 45    // 45Hz
    };
    
    // Web Audio API context for FFT
    let audioContext = null;
    let analyser = null;
    let simulationTimer = null;
    window.simulationActive = false;
    
    // Initialize Web Audio API for FFT
    function initFFT() {
        try {
            audioContext = new (window.AudioContext || window.webkitAudioContext)();
            analyser = audioContext.createAnalyser();
            analyser.fftSize = FFT_SIZE * 2;
            analyser.smoothingTimeConstant = 0.8;
            console.log("FFT initialized successfully");
        } catch (error) {
            console.error("Failed to initialize FFT:", error);
        }
    }
    
    // Set up the frequency chart
    function setupChart() {
        const ctx = document.getElementById('accelChart').getContext('2d');
        
        // Create annotations for component frequencies
        const annotations = {};
        const colors = {
            motor: 'rgba(255, 0, 0, 0.8)',
            pulley: 'rgba(0, 255, 0, 0.8)',
            belt: 'rgba(0, 0, 255, 0.8)',
            bearing: 'rgba(255, 165, 0, 0.8)',
            gear: 'rgba(128, 0, 128, 0.8)'
        };
        
        Object.keys(componentFrequencies).forEach(component => {
            const frequency = componentFrequencies[component];
            annotations[component] = {
                type: 'line',
                mode: 'vertical',
                scaleID: 'x',
                value: frequency,
                borderColor: colors[component],
                borderWidth: 2,
                label: {
                    backgroundColor: colors[component],
                    content: component,
                    display: true,
                    position: 'top'
                }
            };
        });
        
        // Create the chart
        window.accelChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: [], // Will be filled with frequency values
                datasets: [{
                    label: 'Frequency Spectrum',
                    data: [],
                    backgroundColor: 'rgba(75, 192, 192, 0.7)',
                    borderColor: 'rgba(75, 192, 192, 1)',
                    borderWidth: 1
                }]
            },
            options: {
                animation: { duration: 0 },
                scales: {
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'Magnitude'
                        }
                    },
                    x: {
                        title: {
                            display: true,
                            text: 'Frequency (Hz)'
                        }
                    }
                },
                plugins: {
                    tooltip: {
                        callbacks: {
                            title: function(tooltipItems) {
                                return `Frequency: ${tooltipItems[0].label} Hz`;
                            }
                        }
                    },
                    annotation: {
                        annotations: annotations
                    }
                },
                responsive: true,
                maintainAspectRatio: false
            }
        });
        
        return window.accelChart;
    }
    
    // Process data using FFT and update the chart
    function processFFT() {
        if (!audioContext || window.accelDataPaused || !bufferFilled) return;
        
        // Create frequency data array
        const frequencyData = new Uint8Array(analyser.frequencyBinCount);
        
        // Create temporary buffer with window function
        const tempBuffer = new Float32Array(dataBuffer);
        for (let i = 0; i < FFT_SIZE; i++) {
            // Apply Hann window to reduce spectral leakage
            const windowValue = 0.5 * (1 - Math.cos(2 * Math.PI * i / (FFT_SIZE - 1)));
            tempBuffer[i] *= windowValue;
        }
        
        // Create audio buffer and source
        const audioBuffer = audioContext.createBuffer(1, FFT_SIZE, audioContext.sampleRate);
        audioBuffer.copyToChannel(tempBuffer, 0);
        
        const source = audioContext.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(analyser);
        
        // Get frequency data
        analyser.getByteFrequencyData(frequencyData);
        
        // Start the source to trigger the analysis
        source.start();
        
        // Update chart with frequency data
        updateFrequencyChart(frequencyData);
    }
    
    // Update the chart with frequency data
    function updateFrequencyChart(frequencyData) {
        if (!window.accelChart) return;
        
        // Calculate the Nyquist frequency (half the sample rate)
        const sampleRate = 1000 / UPDATE_INTERVAL;
        const nyquist = sampleRate / 2;
        
        // Only use first half of FFT data (Nyquist theorem)
        const numBins = frequencyData.length / 2;
        const freqStep = nyquist / numBins;
        
        // Clear existing data
        window.accelChart.data.labels = [];
        window.accelChart.data.datasets[0].data = [];
        
        // Only show first 200Hz for better visualization
        const maxFreq = 200;
        const maxBin = Math.min(Math.floor(maxFreq / freqStep), numBins);
        
        // Update with new frequency data
        for (let i = 0; i < maxBin; i++) {
            const frequency = i * freqStep;
            window.accelChart.data.labels.push(frequency.toFixed(1));
            window.accelChart.data.datasets[0].data.push(frequencyData[i]);
        }
        
        // Update the chart
        window.accelChart.update();
    }
    
    // Add data to the buffer
    function addToBuffer(value) {
        dataBuffer[bufferIndex] = value;
        bufferIndex = (bufferIndex + 1) % FFT_SIZE;
        
        if (bufferIndex === 0) {
            bufferFilled = true;
        }
    }
    
    // Generate simulated data with specific frequency components
    function generateSimulatedData() {
        const time = Date.now() / 1000; // Current time in seconds
        
        // Create a signal with our 5 component frequencies
        let signal = 0;
        
        // Add each component with different amplitudes
        signal += 0.5 * Math.sin(2 * Math.PI * componentFrequencies.motor * time);
        signal += 0.3 * Math.sin(2 * Math.PI * componentFrequencies.pulley * time);
        signal += 0.2 * Math.sin(2 * Math.PI * componentFrequencies.belt * time);
        signal += 0.4 * Math.sin(2 * Math.PI * componentFrequencies.bearing * time);
        signal += 0.35 * Math.sin(2 * Math.PI * componentFrequencies.gear * time);
        
        // Add fault frequency (7.5 Hz) if enabled
        if (document.getElementById('faultToggle')?.checked) {
            signal += 0.25 * Math.sin(2 * Math.PI * 7.5 * time);
        }
        
        // Add some random noise
        signal += 0.05 * (Math.random() - 0.5);
        
        return signal;
    }
    
    // Start the simulation
    function startSimulation() {
        if (window.simulationActive) return;
        
        console.log("Starting accelerometer simulation");
        window.simulationActive = true;
        
        // Update status if element exists
        const statusElement = document.getElementById('connectionStatus');
        if (statusElement) {
            statusElement.textContent = 'Using Simulation';
            statusElement.style.color = 'blue';
        }
        
        // Start the simulation loop
        simulationTimer = setInterval(() => {
            if (window.accelDataPaused) return;
            
            // Generate and add data to buffer
            const value = generateSimulatedData();
            addToBuffer(value);
        }, 20); // 50Hz sampling rate
    }
    
    // Stop the simulation
    function stopSimulation() {
        if (!window.simulationActive) return;
        
        console.log("Stopping accelerometer simulation");
        window.simulationActive = false;
        
        if (simulationTimer) {
            clearInterval(simulationTimer);
            simulationTimer = null;
        }
    }
    
    // Connect to WebSocket server
    function connectToServer() {
        const serverUrl = document.getElementById('serverAddress')?.value || 'ws://localhost:8080';
        
        try {
            const ws = new WebSocket(serverUrl);
            
            ws.onopen = () => {
                console.log("Connected to server");
                stopSimulation();
                
                const statusElement = document.getElementById('connectionStatus');
                if (statusElement) {
                    statusElement.textContent = 'Connected';
                    statusElement.style.color = 'green';
                }
            };
            
            ws.onclose = () => {
                console.log("Disconnected from server");
                startSimulation(); // Fall back to simulation
                
                const statusElement = document.getElementById('connectionStatus');
                if (statusElement) {
                    statusElement.textContent = 'Disconnected';
                    statusElement.style.color = 'red';
                }
            };
            
            ws.onmessage = (event) => {
                if (window.accelDataPaused) return;
                
                // Parse the incoming data
                try {
                    const data = JSON.parse(event.data);
                    // Use the first value from the data (assuming it's a vibration value)
                    const value = data.value || data.acceleration || data.vibration || 0;
                    addToBuffer(value);
                } catch (e) {
                    console.error("Error processing data:", e);
                }
            };
            
            socket = ws;
        } catch (error) {
            console.error("Connection error:", error);
            startSimulation(); // Fall back to simulation
        }
    }
    
    // Initialize and start everything
    function init() {
        // Set up event listeners for control buttons
        document.getElementById('pauseBtn')?.addEventListener('click', () => {
            window.accelDataPaused = true;
        });
        
        document.getElementById('resumeBtn')?.addEventListener('click', () => {
            window.accelDataPaused = false;
        });
        
        document.getElementById('clearBtn')?.addEventListener('click', () => {
            dataBuffer.fill(0);
            bufferFilled = false;
            bufferIndex = 0;
            
            if (window.accelChart) {
                window.accelChart.data.datasets[0].data = Array(window.accelChart.data.labels.length).fill(0);
                window.accelChart.update();
            }
        });
        
        document.getElementById('connectBtn')?.addEventListener('click', () => {
            stopSimulation();
            connectToServer();
        });
        
        // Initialize FFT and chart
        initFFT();
        setupChart();
        
        // Start FFT processing loop
        setInterval(processFFT, UPDATE_INTERVAL);
        
        // Start with simulation by default
        startSimulation();
        
        // Make functions available globally if needed
        window.startSimulation = startSimulation;
        window.stopSimulation = stopSimulation;
        window.connectToServer = connectToServer;
    }
    
    // Initialize if the chart element exists
    if (document.getElementById('accelChart')) {
        init();
    }
});