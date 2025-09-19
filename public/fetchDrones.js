// filepath: c:\Users\HP\Desktop\drone-gps-tracking\public\fetchDrones.js
// Fetch drone IDs from the server and populate the dropdown
fetch('/api/drones')
    .then(response => response.json())
    .then(data => {
        const droneSelect = document.getElementById('droneSelect');
        const currentSelection = droneSelect.value; // Preserve the current selection
        droneSelect.innerHTML = '<option value="">Select Drone ID</option>';
        data.forEach(drone => {
            const option = document.createElement('option');
            option.value = drone.drone_id;
            option.textContent = drone.drone_id;
            droneSelect.appendChild(option);
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