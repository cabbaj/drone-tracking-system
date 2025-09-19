const socket = io();

const map = L.map("map").setView([0, 0], 2);

L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
}).addTo(map);

const markers = {};
let selectedDroneId = null;
let locationUpdateInterval = null;
const logData = [];

// Define the restricted area
const restrictedAreaCenter = [6.933056, 100.392778];
const restrictedAreaRadius = 9000; // 9 kilometers in meters

// Add the restricted area circle to the map
const restrictedArea = L.circle(restrictedAreaCenter, {
    color: 'red',
    fillColor: '#f03',
    fillOpacity: 0.1,
    radius: restrictedAreaRadius
}).addTo(map);

// Define custom icons
const blackDroneIcon = L.icon({
    iconUrl: 'picture/Black_drone.png', // Corrected path
    iconSize: [64, 64], // size of the icon
    iconAnchor: [16, 16], // point of the icon which will correspond to marker's location
    popupAnchor: [0, -16] // point from which the popup should open relative to the iconAnchor
});

const redDroneIcon = L.icon({
    iconUrl: 'picture/Red_drone.png', // Corrected path
    iconSize: [64, 64], // size of the icon
    iconAnchor: [16, 16], // point of the icon which will correspond to marker's location
    popupAnchor: [0, -16] // point from which the popup should open relative to the iconAnchor
});

function updateLocation(position) {
    const { latitude, longitude, speed, altitude } = position.coords;
    const id = socket.id;

    if (!selectedDroneId) {
        console.error('No drone_id selected');
        return;
    }

    socket.emit("locationUpdate", { id, drone_id: selectedDroneId, latitude, longitude, speed, altitude });

    if (!markers[id]) {
        markers[id] = L.marker([latitude, longitude], { icon: blackDroneIcon }).addTo(map);
    } else {
        markers[id].setLatLng([latitude, longitude]);
    }

    markers[id]
        .bindPopup(
            `Drone ID: ${selectedDroneId}<br>Lat: ${latitude}<br>Lng: ${longitude}<br>Speed: ${speed}<br>Altitude: ${altitude}`
        );
}

socket.on("locationUpdate", (data) => {
    const { id, latitude, longitude, speed, altitude, drone_id } = data;

    if (!markers[id]) {
        markers[id] = L.marker([latitude, longitude], { icon: blackDroneIcon }).addTo(map);
    } else {
        markers[id].setLatLng([latitude, longitude]);
    }

    // Check if the drone is within the restricted area
    const distanceToRestrictedArea = map.distance([latitude, longitude], restrictedAreaCenter);
    const isInRestrictedArea = distanceToRestrictedArea <= restrictedAreaRadius;

    // Update the marker icon based on whether the drone is in the restricted area
    if (isInRestrictedArea) {
        markers[id].setIcon(redDroneIcon);
    } else {
        markers[id].setIcon(blackDroneIcon);
    }

    markers[id]
        .bindPopup(
            `Drone ID: ${drone_id}<br>Lat: ${latitude}<br>Lng: ${longitude}<br>Speed: ${speed}<br>Altitude: ${altitude}`
        );

    // Update drone details display
    const deviceList = document.getElementById('deviceList');
    let droneInfo = document.getElementById(`drone-${drone_id}`);
    if (!droneInfo) {
        droneInfo = document.createElement('div');
        droneInfo.id = `drone-${drone_id}`;
        droneInfo.className = 'drone-info';
        droneInfo.innerHTML = `
            <h3 onclick="toggleDetails('${drone_id}')">${drone_id}</h3>
            <div class="drone-details" id="details-${drone_id}">
                <p>Latitude: <span id="lat-${drone_id}">${latitude}</span></p>
                <p>Longitude: <span id="lng-${drone_id}">${longitude}</span></p>
                <p>Altitude: <span id="alt-${drone_id}">${altitude}</span></p>
                <p>Speed: <span id="speed-${drone_id}">${speed}</span></p>
            </div>
        `;
        deviceList.appendChild(droneInfo);
    } else {
        document.getElementById(`lat-${drone_id}`).textContent = latitude;
        document.getElementById(`lng-${drone_id}`).textContent = longitude;
        document.getElementById(`alt-${drone_id}`).textContent = altitude;
        document.getElementById(`speed-${drone_id}`).textContent = speed;
    }

    // Change the color of the drone_id to red if it is in the restricted area
    const droneIdElement = droneInfo.querySelector('h3');
    if (isInRestrictedArea) {
        droneIdElement.style.color = 'red';
    } else {
        droneIdElement.style.color = '';
    }

    // Update log data
    const timestamp = new Date().toLocaleString();
    logData.push({ drone_id, timestamp, latitude, longitude, altitude, speed, isInRestrictedArea });
    updateLogFilterOptions();
    updateLogDisplay();
    applyAltitudeFilter();
});

function addLogEntry(drone_id, latitude, longitude, altitude, speed, isInRestrictedArea) {
    const logDisplay = document.getElementById('logDisplay');
    const logEntry = document.createElement('div');
    logEntry.textContent = `Drone ID: ${drone_id} || ${new Date().toLocaleString()} || Lat: ${latitude}, Lng: ${longitude}, Alt: ${altitude}, Speed: ${speed}`;
    if (isInRestrictedArea) {
        logEntry.textContent += ' (อยู่ในพื้นที่ห้ามเข้า)';
    }
    logDisplay.appendChild(logEntry);
}

document.getElementById('confirmDrone').addEventListener('click', () => {
    const droneSelect = document.getElementById('droneSelect');
    selectedDroneId = droneSelect.value;

    if (!selectedDroneId) {
        alert('Please select a drone ID');
        return;
    }

    // Notify the server about the selected drone ID
    socket.emit('selectDrone', selectedDroneId);

    // Display the selected drone ID
    alert(`Selected drone ID: ${selectedDroneId}`);

    // Update the dropdown text to show the selected drone ID
    const selectedOption = droneSelect.querySelector(`option[value="${selectedDroneId}"]`);
    if (selectedOption) {
        selectedOption.textContent = selectedDroneId;
    }

    // Update the display element with the selected drone ID
    document.getElementById('selectedDroneDisplay').textContent = `เลือกแล้ว: ${selectedDroneId}`;

    if (locationUpdateInterval) {
        clearInterval(locationUpdateInterval);
    }

    if (navigator.geolocation) {
        locationUpdateInterval = setInterval(() => {
            navigator.geolocation.getCurrentPosition(updateLocation, console.error, {
                enableHighAccuracy: true,
                maximumAge: 0,
                timeout: 5000,
            });
        }, 5000); // Set interval to 5 seconds
    } else {
        alert("Geolocation is not supported by your browser");
    }
});

document.getElementById('cancelDrone').addEventListener('click', () => {
    if (locationUpdateInterval) {
        clearInterval(locationUpdateInterval);
        locationUpdateInterval = null;
    }
    if (selectedDroneId) {
        // แจ้งเซิร์ฟเวอร์ให้ลบโดรนออกจากทุกอุปกรณ์
        socket.emit('deselectDrone', selectedDroneId);

        // ลบข้อมูลโดรนในอุปกรณ์ปัจจุบัน
        removeDroneMarker(selectedDroneId);

        selectedDroneId = null;
        document.getElementById('droneSelect').value = '';
        document.getElementById('selectedDroneDisplay').textContent = '';
        alert('Location updates stopped and drone ID selection cleared');
    }
});

// ฟังก์ชันที่ใช้ลบหมุดของโดรนจากแผนที่และ UI
function removeDroneMarker(drone_id) {
    Object.keys(markers).forEach(id => {
        if (markers[id]._popup.getContent().includes(`Drone ID: ${drone_id}`)) {
            map.removeLayer(markers[id]);
            delete markers[id];
        }
    });

    const droneInfo = document.getElementById(`drone-${drone_id}`);
    if (droneInfo) {
        droneInfo.remove();
    }
}

// รับเหตุการณ์จากเซิร์ฟเวอร์เพื่อให้ทุกอุปกรณ์ลบหมุดของโดรนนี้
socket.on('deselectDrone', (drone_id) => {
    removeDroneMarker(drone_id);
});

socket.on('updateDrones', (selectedDrones) => {
    fetch('/api/drones')
        .then(response => response.json())
        .then(data => {
            const droneSelect = document.getElementById('droneSelect');
            const currentSelection = droneSelect.value; // Preserve the current selection
            droneSelect.innerHTML = '<option value="">Select Drone ID</option>';
            data.forEach(drone => {
                if (!selectedDrones.includes(drone.drone_id)) {
                    const option = document.createElement('option');
                    option.value = drone.drone_id;
                    option.textContent = drone.drone_id;
                    droneSelect.appendChild(option);
                }
            });
            // Restore the current selection
            if (currentSelection) {
                const selectedOption = droneSelect.querySelector(`option[value="${currentSelection}"]`);
                if (selectedOption) {
                    selectedOption.selected = true;
                }
            }
        })
        .catch(error => console.error('Error fetching drone IDs:', error));
});

document.getElementById('altitudeFilter').addEventListener('change', applyAltitudeFilter);

function applyAltitudeFilter() {
    const filter = document.getElementById('altitudeFilter').value;
    Object.keys(markers).forEach(id => {
        const marker = markers[id];
        const popupContent = marker.getPopup().getContent();
        const match = popupContent.match(/Altitude: (-?\d+(\.\d+)?)/);
        if (match) {
            const altitude = parseFloat(match[1]);
            let showMarker = false;

            if (filter === 'all') {
                showMarker = true;
            } else if (filter === 'low' && altitude <= 0) {
                showMarker = true;
            } else if (filter === 'medium' && altitude > 0 && altitude <= 5) {
                showMarker = true;
            } else if (filter === 'high' && altitude > 5) {
                showMarker = true;
            }

            if (showMarker) {
                marker.addTo(map);
            } else {
                map.removeLayer(marker);
            }
        }
    });
}

document.getElementById('logFilter').addEventListener('change', updateLogDisplay);

function updateLogDisplay() {
    const filter = document.getElementById('logFilter').value;
    const logDisplay = document.getElementById('logDisplay');
    logDisplay.innerHTML = '';

    if (filter === '') {
        return;
    }

    const logs = filter === 'all' ? logData : logData.filter(log => log.drone_id === filter);
    logs.forEach(log => {
        const logEntry = document.createElement('div');
        logEntry.textContent = `Drone ID: ${log.drone_id} || ${log.timestamp} || Lat: ${log.latitude}, Lng: ${log.longitude}, Alt: ${log.altitude}, Speed: ${log.speed}`;
        if (log.isInRestrictedArea) {
            logEntry.textContent += ' (อยู่ในพื้นที่ห้ามเข้า)';
        }
        logDisplay.appendChild(logEntry);
    });
}

function updateLogFilterOptions() {
    const logFilter = document.getElementById('logFilter');
    const currentSelection = logFilter.value; // Preserve the current selection
    logFilter.innerHTML = '<option value="">ไม่แสดง</option><option value="all">แสดงทั้งหมด</option>';
    const droneIds = [...new Set(logData.map(log => log.drone_id))];
    droneIds.forEach(drone_id => {
        const option = document.createElement('option');
        option.value = drone_id;
        option.textContent = drone_id;
        logFilter.appendChild(option);
    });
    logFilter.value = currentSelection; // Restore the current selection
}

function toggleDetails(drone_id) {
    const details = document.getElementById(`details-${drone_id}`);
    if (details.style.display === 'none' || details.style.display === '') {
        details.style.display = 'block';
    } else {
        details.style.display = 'none';
    }
}
