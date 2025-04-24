document.addEventListener('DOMContentLoaded', function() {
    // UI Elements
    const analyticsBtn = document.getElementById('analyticsBtn');
    const accelDataBtn = document.getElementById('accelDataBtn');
    const componentsContainer = document.getElementById('componentsContainer');
    const accelDataContainer = document.getElementById('accelDataContainer');
    
    // Control buttons
    const pauseBtn = document.getElementById('pauseBtn');
    const resumeBtn = document.getElementById('resumeBtn');
    const clearBtn = document.getElementById('clearBtn');
    
    // Set initial state - hide components by default
    componentsContainer.style.display = 'none';
    accelDataContainer.style.display = 'none';
    
    // Analytics Button Click Handler
    analyticsBtn.addEventListener('click', function(e) {
        e.preventDefault();
        
        // Toggle component cards visibility
        if (componentsContainer.style.display === 'none') {
            componentsContainer.style.display = 'block';
            // Add entrance animation
            animateComponentCards();
            
            // Hide accelerometer data if it's visible
            accelDataContainer.style.display = 'none';
        } else {
            componentsContainer.style.display = 'none';
        }
    });
    
    // Accelerometer Data Button Click Handler
    accelDataBtn.addEventListener('click', function(e) {
        e.preventDefault();
        
        // Toggle accelerometer data visibility
        if (accelDataContainer.style.display === 'none') {
            accelDataContainer.style.display = 'block';
            
            // Initialize/start the chart if it's not already running
            if (!window.accelChart) {
                initAccelerometerChart();
            }
            
            // Hide component cards if they're visible
            componentsContainer.style.display = 'none';
        } else {
            accelDataContainer.style.display = 'none';
        }
    });
    
    // Function to animate component cards
    function animateComponentCards() {
        const cards = document.querySelectorAll('.component-card');
        
        cards.forEach((card, index) => {
            // Set initial state
            card.style.opacity = '0';
            card.style.transform = 'translateY(30px)';
            
            // Animate with delay based on index
            setTimeout(() => {
                card.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
                card.style.opacity = '1';
                card.style.transform = 'translateY(0)';
            }, 100 * index);
        });
    }
    
    // Function to show notification
    function showNotification(message, type) {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        // Slide in
        setTimeout(() => {
            notification.style.transform = 'translateX(0)';
            notification.style.opacity = '1';
        }, 10);
        
        // Remove after 3 seconds
        setTimeout(() => {
            notification.style.transform = 'translateX(100%)';
            notification.style.opacity = '0';
            
            // Remove from DOM after animation
            setTimeout(() => {
                notification.remove();
            }, 500);
        }, 3000);
    }

    // Add notification styling
    const style = document.createElement('style');
    style.textContent = `
        .notification {
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 12px 20px;
            border-radius: 5px;
            color: white;
            font-weight: 500;
            box-shadow: 0 3px 10px rgba(0,0,0,0.2);
            z-index: 1000;
            transform: translateX(100%);
            opacity: 0;
            transition: transform 0.4s ease, opacity 0.4s ease;
        }
        
        .notification.success {
            background-color: #2ecc71;
        }
        
        .notification.error {
            background-color: #e74c3c;
        }
    `;
    document.head.appendChild(style);
    
    // Function to initialize the accelerometer chart
    function initAccelerometerChart() {
        const ctx = document.getElementById('accelChart').getContext('2d');
        
        // Chart configuration
        window.accelChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: Array(50).fill(''),
                datasets: [
                    {
                        label: 'X-Axis',
                        data: Array(50).fill(0),
                        borderColor: 'rgba(231, 76, 60, 1)',
                        backgroundColor: 'rgba(231, 76, 60, 0.1)',
                        borderWidth: 2,
                        tension: 0.4,
                        pointRadius: 0,
                        fill: true
                    },
                    {
                        label: 'Y-Axis',
                        data: Array(50).fill(0),
                        borderColor: 'rgba(46, 204, 113, 1)',
                        backgroundColor: 'rgba(46, 204, 113, 0.1)',
                        borderWidth: 2,
                        tension: 0.4,
                        pointRadius: 0,
                        fill: true
                    },
                    {
                        label: 'Z-Axis',
                        data: Array(50).fill(0),
                        borderColor: 'rgba(52, 152, 219, 1)',
                        backgroundColor: 'rgba(52, 152, 219, 0.1)',
                        borderWidth: 2,
                        tension: 0.4,
                        pointRadius: 0,
                        fill: true
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                animation: {
                    duration: 0
                },
                scales: {
                    y: {
                        beginAtZero: false,
                        grid: {
                            color: 'rgba(255, 255, 255, 0.1)'
                        },
                        ticks: {
                            color: 'rgba(255, 255, 255, 0.7)'
                        }
                    },
                    x: {
                        grid: {
                            display: false
                        },
                        ticks: {
                            display: false
                        }
                    }
                },
                plugins: {
                    legend: {
                        position: 'top',
                        labels: {
                            color: 'rgba(255, 255, 255, 0.7)',
                            padding: 20,
                            font: {
                                size: 14
                            }
                        }
                    },
                    tooltip: {
                        enabled: false
                    }
                }
            }
        });
        
        // Start the data stream from WebSocket
        connectToAccelerometerData();
        setTimeout(connectToAccelerometerData, 100);
    }
    
    // Control button event listeners
    if (pauseBtn) {
        pauseBtn.addEventListener('click', function() {
            if (window.accelDataPaused === true) return;
            window.accelDataPaused = true;
            showNotification('Data stream paused', 'success');
        });
    }
    
    if (resumeBtn) {
        resumeBtn.addEventListener('click', function() {
            if (window.accelDataPaused === false) return;
            window.accelDataPaused = false;
            showNotification('Data stream resumed', 'success');
        });
    }
    
    if (clearBtn) {
        clearBtn.addEventListener('click', function() {
            if (window.accelChart) {
                window.accelChart.data.datasets.forEach(dataset => {
                    dataset.data = Array(50).fill(0);
                });
                window.accelChart.update();
                showNotification('Chart data cleared', 'success');
            }
        });
    }
    
    // Function to connect to the accelerometer data WebSocket
    function connectToAccelerometerData() {
        // In a real implementation, you'd connect to an actual WebSocket server
        // For now, we'll simulate data using the accelerometer.js script
        window.accelDataPaused = false;
        console.log('Connected to accelerometer data stream');
        
        // If the accelerometer script is loaded, start the simulation
        if (window.simulateWebSocketConnection) {
            window.simulateWebSocketConnection();
        } else {
            console.error('Accelerometer script not loaded properly');
        }
    }
});