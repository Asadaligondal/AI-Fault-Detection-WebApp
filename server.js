const express = require('express');
const path = require('path');
const fs = require('fs');
const cors = require('cors');
const bodyParser = require('body-parser');
require ('./backend/websocket')
const app = express();

const port = 3000;
const devicesFile = path.join(__dirname, 'devices.json');
const devicesFolder = path.join(__dirname, 'devices'); // Folder for device pages
const templatePath = path.join(__dirname, 'deviceTemplate.html'); // Template file

app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname)));

// Ensure the "devices" folder exists
if (!fs.existsSync(devicesFolder)) {
    fs.mkdirSync(devicesFolder);
}

// Load devices from file
const loadDevices = () => {
    if (fs.existsSync(devicesFile)) {
        const data = fs.readFileSync(devicesFile, 'utf8');
        return data ? JSON.parse(data) : [];  // ✅ Handle empty file
    }
    return [];
};
app.delete('/devices/:name', (req, res) => {
    let devices = loadDevices();
    const deviceName = req.params.name;

    // Check if device exists
    const deviceIndex = devices.findIndex(device => device.name === deviceName);
    if (deviceIndex === -1) {
        return res.status(404).json({ success: false, message: "Device not found" });
    }

    // Remove device from list and save
    devices.splice(deviceIndex, 1);
    saveDevices(devices);

    // Remove the device's HTML file
    const deviceFilePath = path.join(devicesFolder, `${deviceName}.html`);
    if (fs.existsSync(deviceFilePath)) {
        fs.unlinkSync(deviceFilePath);
    }

    res.json({ success: true, message: "Device removed successfully" });
});


// Save devices to file
const saveDevices = (devices) => {
    fs.writeFileSync(devicesFile, JSON.stringify(devices, null, 2));
};

// Function to create a new device page
const createDevicePage = (deviceName) => {
    const newDevicePath = path.join(devicesFolder, `${deviceName}.html`);

    if (!fs.existsSync(templatePath)) {
        console.error('Template file not found!');
        return;
    }

    // Read the template and replace placeholders
    let templateContent = fs.readFileSync(templatePath, 'utf8');
    templateContent = templateContent.replace(/{{deviceName}}/g, deviceName);

    // Write new device page
    fs.writeFileSync(newDevicePath, templateContent);
};

// GET route for home page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// GET all devices
app.get('/devices', (req, res) => {
    res.json(loadDevices());
});

// POST a new device
app.post('/devices', (req, res) => {
    let devices = loadDevices();
    const { name } = req.body;

    if (!name) {
        return res.status(400).json({ error: 'Device name is required' });
    }

    // Check if device already exists
    if (devices.some(device => device.name === name)) {
        return res.status(400).json({ error: 'Device already exists' });
    }

    const newDevice = { name };
    devices.push(newDevice);
    saveDevices(devices);
    createDevicePage(name);

    res.json({ message: 'Device added successfully', newDevice });
});

// Serve dynamically created device pages
app.use('/devices', express.static(devicesFolder));

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});


