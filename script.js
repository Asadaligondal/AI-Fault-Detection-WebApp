document.addEventListener("DOMContentLoaded", function () {
    const deviceForm = document.getElementById("deviceForm");
    const deviceModal = document.getElementById("deviceModal");
    const closeBtn = document.querySelector(".close");
    const deviceDropdown = document.getElementById("device-dropdown");

    // Elements for remove device functionality
    const removeDeviceBtn = document.getElementById("removeDeviceBtn");
    const removeDeviceModal = document.getElementById("removeDeviceModal");
    const closeRemoveModal = document.getElementById("closeRemoveModal");
    const deviceList = document.getElementById("deviceList");
    const confirmRemoveDevice = document.getElementById("confirmRemoveDevice");

    // Function to load devices from the server and update dropdown
    async function loadDevices() {
        try {
            const response = await fetch('/devices');
            const devices = await response.json();
            let html = `
                <a href="/devices/motor.html">Motor</a>
                <a href="/devices/Bearing.html">Bearing</a>
                <a href="/devices/Gear.html">Gear Box</a>
                <a href="/devices/Pully.html">Pully</a>
                <a href="/devices/Belt.html">Belt</a>
            `;
            devices.forEach(device => {
                html += `<a href="/devices/${device.name}.html">${device.name}</a>`;
            });
            if (deviceDropdown) {
                deviceDropdown.innerHTML = html;
            }
        } catch (error) {
            console.error("Error loading devices:", error);
        }
    }
    loadDevices();

    // Polling: Refresh devices every 10 seconds
    setInterval(loadDevices, 10000);

    // --- ADD DEVICE FUNCTIONALITY ---
    const addDeviceBtn = document.getElementById("addDeviceBtn");
    if (addDeviceBtn) {
        addDeviceBtn.addEventListener("click", function () {
            deviceModal.style.display = "block";
        });
    }
    if (closeBtn) {
        closeBtn.addEventListener("click", function () {
            deviceModal.style.display = "none";
        });
    }
    if (deviceForm) {
        deviceForm.addEventListener("submit", async function (event) {
            event.preventDefault();
            const deviceName = document.getElementById("deviceName").value.trim();
            if (!deviceName) return alert("Enter a valid device name!");

            const response = await fetch("/devices", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name: deviceName, type: "custom" })
            });
            const result = await response.json();
            if (result.message) {
                alert(result.message);
                loadDevices(); // Refresh dropdown on all pages
                deviceModal.style.display = "none";
                deviceForm.reset();
            } else {
                alert("Failed to add device.");
            }
        });
    }

    // --- REMOVE DEVICE FUNCTIONALITY ---
    if (removeDeviceBtn) {
        removeDeviceBtn.addEventListener("click", async function () {
            try {
                const response = await fetch('/devices');
                const devices = await response.json();
                deviceList.innerHTML = "";
                devices.forEach(device => {
                    const li = document.createElement("li");
                    li.textContent = device.name;
                    li.setAttribute("data-name", device.name);
                    li.addEventListener("click", function () {
                        document.querySelectorAll("#deviceList li").forEach(item => item.classList.remove("selected"));
                        li.classList.add("selected");
                    });
                    deviceList.appendChild(li);
                });
                removeDeviceModal.style.display = "block";
            } catch (error) {
                console.error("Error loading devices for removal:", error);
            }
        });
    }
    if (closeRemoveModal) {
        closeRemoveModal.addEventListener("click", function () {
            removeDeviceModal.style.display = "none";
        });
    }
    if (confirmRemoveDevice) {
        confirmRemoveDevice.addEventListener("click", async function () {
            const selectedDevice = document.querySelector("#deviceList .selected");
            if (!selectedDevice) {
                alert("Please select a device to remove!");
                return;
            }
            const deviceName = selectedDevice.getAttribute("data-name");
            const response = await fetch(`/devices/${deviceName}`, { method: "DELETE" });
            const result = await response.json();
            if (result.success) {
                alert(`${deviceName} removed successfully.`);
                removeDeviceModal.style.display = "none";
                loadDevices();
            } else {
                alert("Error removing device.");
            }
        });
    }
});
// // Connect to WebSocket Server
// const socket = new WebSocket("ws://localhost:8080");

// // When data is received, log it to console
// socket.onmessage = function(event) {
//     const data = JSON.parse(event.data);
//     console.log("Received Accelerometer Data:", data);
    
//     // Update UI with real-time values (if needed)
//     document.getElementById("x-axis").textContent = data.x;
//     document.getElementById("y-axis").textContent = data.y;
//     document.getElementById("z-axis").textContent = data.z;
// };
document.addEventListener("DOMContentLoaded", function () {
    const viewDataBtn = document.getElementById("viewDataBtn");
    const sensorDataDiv = document.getElementById("sensorData");
    const xValue = document.getElementById("xValue");
    const yValue = document.getElementById("yValue");
    const zValue = document.getElementById("zValue");
    const timestamp = document.getElementById("timestamp");

    let socket = null;
    let isViewing = false;

    // Function to toggle real-time data visibility
    viewDataBtn.addEventListener("click", function () {
        if (!isViewing) {
            // Connect to WebSocket only when the button is clicked
            if (!socket) {
                socket = new WebSocket("ws://localhost:8080"); // Ensure this is your correct WebSocket URL

                socket.onmessage = function (event) {
                    const data = JSON.parse(event.data);
                    xValue.textContent = data.x;
                    yValue.textContent = data.y;
                    zValue.textContent = data.z;
                    timestamp.textContent = data.timestamp;
                };

                socket.onerror = function (error) {
                    console.error("WebSocket Error:", error);
                };
            }

            sensorDataDiv.style.display = "block"; // Show data
            viewDataBtn.textContent = "Hide Data";
            isViewing = true;

        } else {
            sensorDataDiv.style.display = "none"; // Hide data
            viewDataBtn.textContent = "View Data";
            isViewing = false;
        }
    });
});
