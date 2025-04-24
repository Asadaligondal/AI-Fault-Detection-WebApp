/**
 * Accelerometer Data Handler
 * 
 * This script handles real-time accelerometer data from a Raspberry Pi via WebSocket
 * and also provides simulation capabilities as a fallback.
 */

document.addEventListener('DOMContentLoaded', function() {
    // Global variables
    let socket = null;
    window.accelDataPaused = false;
    
    // Chart configuration and setup
    const setupChart = () => {
        const ctx = document.getElementById('accelChart').getContext('2d');
        
        // Create the accelerometer chart
        window.accelChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: Array(50).fill(''),  // Initialize with empty labels
                datasets: [
                    {
                        label: 'X-Axis',
                        data: [],
                        borderColor: 'rgba(255, 99, 132, 1)',
                        backgroundColor: 'rgba(255, 99, 132, 0.2)',
                        borderWidth: 2,
                        tension: 0.2
                    },
                    {
                        label: 'Y-Axis',
                        data: [],
                        borderColor: 'rgba(54, 162, 235, 1)',
                        backgroundColor: 'rgba(54, 162, 235, 0.2)',
                        borderWidth: 2,
                        tension: 0.2
                    },
                    {
                        label: 'Z-Axis',
                        data: [],
                        borderColor: 'rgba(75, 192, 192, 1)',
                        backgroundColor: 'rgba(75, 192, 192, 0.2)',
                        borderWidth: 2,
                        tension: 0.2
                    }
                ]
            },
            options: {
                animation: {
                    duration: 0  // Disable animation for better performance
                },
                scales: {
                    y: {
                        beginAtZero: false,
                        title: {
                            display: true,
                            text: 'Acceleration (g)'
                        }
                    },
                    x: {
                        title: {
                            display: true,
                            text: 'Time'
                        }
                    }
                },
                plugins: {
                    tooltip: {
                        mode: 'index',
                        intersect: false,
                    },
                    legend: {
                        position: 'top',
                    }
                },
                responsive: true,
                maintainAspectRatio: false
            }
        });
        
        return window.accelChart;
    };
    
    // Initialize chart if the element exists
    if (document.getElementById('accelChart')) {
        setupChart();
    }
    
    // WebSocket connection handlers
    const connectToServer = () => {
        const serverUrl = document.getElementById('serverAddress').value;
        const connectionStatus = document.getElementById('connectionStatus');
        
        // Disconnect existing connection if any
        if (socket) {
            socket.disconnect();
        }
        
        // Update status
        connectionStatus.textContent = 'Connecting...';
        connectionStatus.style.color = 'orange';
        
        // Create new connection
        try {
            socket = io(serverUrl);
            
            // Connection events
            socket.on('connect', () => {
                connectionStatus.textContent = 'Connected';
                connectionStatus.style.color = 'green';
                console.log("Connected to Raspberry Pi WebSocket server");
            });
            
            socket.on('disconnect', () => {
                connectionStatus.textContent = 'Disconnected';
                connectionStatus.style.color = 'red';
                console.log("Disconnected from WebSocket server");
            });
            
            socket.on('connect_error', (error) => {
                connectionStatus.textContent = 'Connection Error';
                connectionStatus.style.color = 'red';
                console.error("Connection error:", error);
                
                // Fall back to simulation if connection fails
                if (!window.simulationActive) {
                    console.log("Falling back to simulation mode");
                    startSimulation();
                }
            });
            
            // Handle incoming sensor data
            socket.on('sensor_data', (data) => {
                if (window.accelDataPaused) return;
                
                // Process the incoming data from Raspberry Pi
                // Note: The Raspberry Pi sends voltage, we'll convert it to accelerometer-like data
                
                // For X, Y, Z, we'll simulate three axes from the single voltage input
                // In a real accelerometer, you'd have actual X, Y, Z data from your sensor
                const voltage = data.voltage;
                
                // Generate 3-axis data from the single voltage value
                // This is just for visualization - in reality, you'd use actual X, Y, Z values
                const xValue = voltage;
                const yValue = voltage * 0.8 + (Math.random() * 0.1 - 0.05);
                const zValue = voltage * 0.6 + (Math.random() * 0.1 - 0.05);
                
                updateChart({
                    x: xValue,
                    y: yValue,
                    z: zValue,
                    timestamp: data.timestamp
                });
            });
            
        } catch (error) {
            console.error("Error creating WebSocket:", error);
            connectionStatus.textContent = 'Connection Failed';
            connectionStatus.style.color = 'red';
            
            // Fall back to simulation
            if (!window.simulationActive) {
                startSimulation();
            }
        }
    };
    
    // Disconnect from server
    const disconnectFromServer = () => {
        if (socket) {
            socket.disconnect();
            socket = null;
            
            const connectionStatus = document.getElementById('connectionStatus');
            connectionStatus.textContent = 'Disconnected';
            connectionStatus.style.color = 'red';
        }
    };
    
    // Update chart with new data
    const updateChart = (data) => {
        if (!window.accelChart || window.accelDataPaused) return;
        
        // Get datasets
        const datasets = window.accelChart.data.datasets;
        
        // Add new data points
        datasets[0].data.push(data.x);
        datasets[1].data.push(data.y);
        datasets[2].data.push(data.z);
        
        // Keep only the latest 50 points to avoid performance issues
        if (datasets[0].data.length > 50) {
            datasets[0].data.shift();
            datasets[1].data.shift();
            datasets[2].data.shift();
        }
        
        // Update the chart
        window.accelChart.update();
    };
    
    // Clear chart data
    const clearChartData = () => {
        if (!window.accelChart) return;
        
        const datasets = window.accelChart.data.datasets;
        datasets[0].data = [];
        datasets[1].data = [];
        datasets[2].data = [];
        
        window.accelChart.update();
    };
    
    // === SIMULATION CODE (FALLBACK) ===
    
    // Base frequencies and amplitudes for simulation
    const baseFrequencies = {
        motor: 60, // 60Hz motor rotation
        pulley: 30, // 30Hz pulley rotation
        belt: 15,  // 15Hz belt movement
        bearing: 120, // 120Hz bearing vibration
        gear: 45    // 45Hz gear meshing
    };
    
    const baseAmplitudes = {
        motor: 0.5,
        pulley: 0.3,
        belt: 0.2,
        bearing: 0.4,
        gear: 0.35
    };
    
    // Fault simulation parameters
    const faultParams = {
        beltActive: true,
        gearActive: true,
        faultFrequency: 7.5,
        beltFaultAmp: 0.15,
        gearFaultAmp: 0.25
    };
    
    // Variables for simulation
    let timeCounter = 0;
    let updateInterval = 20; // ms
    let simulationTimer = null;
    window.simulationActive = false;
    
    // Generate simulated accelerometer data
    function generateSimulatedData() {
        const time = timeCounter / 1000; // Convert to seconds
        
        // Calculate component signals
        const motorSignal = baseAmplitudes.motor * Math.sin(2 * Math.PI * baseFrequencies.motor * time);
        const pulleySignal = baseAmplitudes.pulley * Math.sin(2 * Math.PI * baseFrequencies.pulley * time);
        
        let beltSignal = baseAmplitudes.belt * Math.sin(2 * Math.PI * baseFrequencies.belt * time);
        if (faultParams.beltActive) {
            beltSignal += faultParams.beltFaultAmp * Math.sin(2 * Math.PI * faultParams.faultFrequency * time);
        }
        
        const bearingSignal = baseAmplitudes.bearing * Math.sin(2 * Math.PI * baseFrequencies.bearing * time);
        
        let gearSignal = baseAmplitudes.gear * Math.sin(2 * Math.PI * baseFrequencies.gear * time);
        if (faultParams.gearActive) {
            gearSignal += faultParams.gearFaultAmp * Math.sin(2 * Math.PI * faultParams.faultFrequency * time);
        }
        
        // Add some random noise
        const noise = 0.05 * (Math.random() - 0.5);
        
        // Generate 3-axis data
        const xAccel = motorSignal + gearSignal + noise;
        const yAccel = pulleySignal + bearingSignal + noise;
        const zAccel = beltSignal + 0.1 * (Math.random() - 0.5);
        
        return { 
            x: xAccel, 
            y: yAccel, 
            z: zAccel,
            timestamp: Date.now() / 1000
        };
    }
    
    // Start simulation function
    function startSimulation() {
        if (window.simulationActive) return;
        
        console.log("Starting accelerometer simulation");
        window.simulationActive = true;
        
        // Update connection status to show we're using simulation
        const connectionStatus = document.getElementById('connectionStatus');
        if (connectionStatus) {
            connectionStatus.textContent = 'Using Simulation';
            connectionStatus.style.color = 'blue';
        }
        
        // Start the simulation loop
        simulationTimer = setInterval(() => {
            if (window.accelDataPaused) return;
            
            const data = generateSimulatedData();
            updateChart(data);
            timeCounter += updateInterval;
        }, updateInterval);
    }
    
    // Stop simulation function
    function stopSimulation() {
        if (!window.simulationActive) return;
        
        console.log("Stopping accelerometer simulation");
        window.simulationActive = false;
        
        if (simulationTimer) {
            clearInterval(simulationTimer);
            simulationTimer = null;
        }
    }
    
    // === EVENT LISTENERS ===
    
    // Set up UI controls
    document.addEventListener('click', function(event) {
        // Connect button
        if (event.target.id === 'connectBtn') {
            stopSimulation(); // Stop simulation if running
            connectToServer();
        }
        
        // Disconnect button
        if (event.target.id === 'disconnectBtn') {
            disconnectFromServer();
        }
        
        // Pause button
        if (event.target.id === 'pauseBtn') {
            window.accelDataPaused = true;
        }
        
        // Resume button
        if (event.target.id === 'resumeBtn') {
            window.accelDataPaused = false;
        }
        
        // Clear button
        if (event.target.id === 'clearBtn') {
            clearChartData();
        }
    });
    
    // When the accelerometer tab is clicked, ensure chart is initialized
    document.getElementById('accelDataBtn').addEventListener('click', function() {
        // Show accelerometer container and hide components container
        document.getElementById('accelDataContainer').style.display = 'block';
        document.getElementById('componentsContainer').style.display = 'none';
        
        // Make sure chart is initialized
        if (!window.accelChart) {
            setupChart();
        }
        
        // If not connected and not simulating, start simulation
        if (!socket && !window.simulationActive) {
            startSimulation();
        }
    });
    
    // When analytics button is clicked
    document.getElementById('analyticsBtn').addEventListener('click', function() {
        // Show components container and hide accelerometer container
        document.getElementById('componentsContainer').style.display = 'block';
        document.getElementById('accelDataContainer').style.display = 'none';
    });
    
    // Initialize with simulation if the accelerometer container is visible
    const accelContainer = document.getElementById('accelDataContainer');
    if (accelContainer && accelContainer.style.display !== 'none') {
        if (!socket && !window.simulationActive) {
            startSimulation();
        }
    }
    
    // Add this to the global scope for other scripts to use
    window.connectToAccelerometer = connectToServer;
    window.disconnectFromAccelerometer = disconnectFromServer;
    window.updateComponentHealth = function(componentId, healthPercent, status) {
        const card = document.getElementById(componentId);
        if (!card) return;
        
        // Update health percentage
        const percentElement = card.querySelector('.health-percentage');
        if (percentElement) {
            percentElement.textContent = `${healthPercent}%`;
        }
        
        // Update health meter
        const meterFill = card.querySelector('.meter-fill');
        if (meterFill) {
            meterFill.style.width = `${healthPercent}%`;
            
            // Reset classes
            meterFill.classList.remove('normal', 'warning', 'faulty');
            
            // Add appropriate class
            if (status === 'normal') {
                meterFill.classList.add('normal');
            } else if (status === 'warning') {
                meterFill.classList.add('warning');
            } else if (status === 'faulty') {
                meterFill.classList.add('faulty');
            }
        }
        
        // Update status badge
        const statusBadge = card.querySelector('.status-badge');
        if (statusBadge) {
            // Reset classes
            statusBadge.classList.remove('normal', 'warning', 'faulty');
            
            // Update text and class
            statusBadge.textContent = status.charAt(0).toUpperCase() + status.slice(1);
            statusBadge.classList.add(status);
        }
    };
    
    // Example of how to simulate component health changes over time
    setInterval(() => {
        // Only run if the components container is visible
        const container = document.getElementById('componentsContainer');
        if (container && container.style.display !== 'none') {
            
            // Simulate random fluctuations in the warning/faulty components
            const beltHealth = 55 + Math.floor(Math.random() * 10);
            window.updateComponentHealth('beltCard', beltHealth, 'warning');
            
            const gearHealth = 30 + Math.floor(Math.random() * 10);
            window.updateComponentHealth('gearCard', gearHealth, 'faulty');
            
            // Occasionally make small changes to "normal" components
            if (Math.random() > 0.7) {
                const motorHealth = 85 + Math.floor(Math.random() * 10);
                window.updateComponentHealth('motorCard', motorHealth, 'normal');
            }
            
            if (Math.random() > 0.8) {
                const pulleyHealth = 80 + Math.floor(Math.random() * 10);
                window.updateComponentHealth('pulleyCard', pulleyHealth, 'normal');
            }
            
            if (Math.random() > 0.9) {
                const bearingHealth = 90 + Math.floor(Math.random() * 10);
                window.updateComponentHealth('bearingCard', bearingHealth, 'normal');
            }
        }
    }, 2000); // Update every 2 seconds
});