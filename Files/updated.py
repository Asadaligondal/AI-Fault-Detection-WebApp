#!/usr/bin/python
# -*- coding:utf-8 -*-

import ADS1263
import RPi.GPIO as GPIO
from flask import Flask, render_template, request
from flask_socketio import SocketIO, emit
import time
import threading
import logging

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize Flask app with SocketIO
app = Flask(__name__)
app.config['SECRET_KEY'] = 'secret!'
socketio = SocketIO(app, cors_allowed_origins="*")  # Allow connections from any origin

REF = 1.6  # Reference voltage, adjust to your HAT's actual Vref (e.g., 2.5V if internal)

# Global variable to store latest ADC value
latest_value = 0
is_streaming = False
stream_thread = None

# ADC instance
try:
    ADC = ADS1263.ADS1263()
    
    # Initialize ADC1 with 38.4 kSPS
    if ADC.ADS1263_init_ADC1('ADS1263_38400SPS') == -1:
        logger.error("ADC1 initialization failed")
        exit()
    ADC.ADS1263_SetMode(0)  # Single-channel mode
    logger.info("ADC initialized successfully")

except IOError as e:
    logger.error(f"IOError: {e}")
    exit()

# Function to read ADC data from AIN0
def read_adc():
    global latest_value
    try:
        # Read single channel (AIN0)
        raw = ADC.ADS1263_GetChannalValue(0)
        # Convert raw 32-bit value to voltage
        if raw >> 31 == 1:  # Negative voltage
            latest_value = -(REF * 2 - raw * REF / 0x80000000)
        else:  # Positive voltage
            latest_value = raw * REF / 0x7fffffff
    except Exception as e:
        logger.error(f"ADC read error: {e}")
    return latest_value

# Background task to send ADC data via WebSocket
def send_adc_data():
    global is_streaming
    logger.info("Starting data streaming")
    while is_streaming:
        voltage = read_adc()
        data = {
            'timestamp': time.time(),
            'voltage': voltage
        }
        socketio.emit('sensor_data', data)
        time.sleep(0.1)  # Update every 100ms
    logger.info("Stopped data streaming")

# Serve a basic HTML page for testing
@app.route('/')
def index():
    return """
    <html>
        <head>
            <title>Pi Sensor Data</title>
        </head>
        <body>
            <h1>Raspberry Pi Sensor Data Server</h1>
            <p>This server is streaming sensor data via WebSocket.</p>
            <p>Connect to it from your client application.</p>
            <p>Server status: Running</p>
        </body>
    </html>
    """

# WebSocket connection handler
@socketio.on('connect')
def handle_connect():
    global is_streaming, stream_thread
    client_ip = request.remote_addr if hasattr(request, 'remote_addr') else 'unknown'
    logger.info(f"Client connected: {client_ip}")
    
    if not is_streaming:
        is_streaming = True
        stream_thread = socketio.start_background_task(send_adc_data)

@socketio.on('disconnect')
def handle_disconnect():
    logger.info("Client disconnected")

# Command to explicitly start streaming (optional)
@socketio.on('start_stream')
def handle_start_stream():
    global is_streaming, stream_thread
    if not is_streaming:
        is_streaming = True
        stream_thread = socketio.start_background_task(send_adc_data)
        emit('status', {'status': 'streaming_started'})
    else:
        emit('status', {'status': 'already_streaming'})

# Command to stop streaming (optional)
@socketio.on('stop_stream')
def handle_stop_stream():
    global is_streaming
    is_streaming = False
    emit('status', {'status': 'streaming_stopped'})

# Main execution
if __name__ == "__main__":
    try:
        # Print server information
        logger.info("Starting Flask-SocketIO server")
        logger.info("Access via: http://0.0.0.0:5000 or http://<raspberry_pi_ip>:5000")
        
        # Start the server
        socketio.run(app, host='0.0.0.0', port=5000, debug=False)
    
    except KeyboardInterrupt:
        logger.info("Program terminated with Ctrl+C")
    finally:
        # Cleanup
        is_streaming = False
        if stream_thread:
            stream_thread.join(timeout=1.0)
        ADC.ADS1263_Exit()
        logger.info("Resources cleaned up. Exiting.")