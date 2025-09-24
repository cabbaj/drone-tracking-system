// filepath: server.js
const express = require('express');
const https = require('https');
const selfsigned = require('selfsigned');
const socketIo = require('socket.io');
const path = require('path');
const { Pool } = require('pg');

const app = express();

// Generate self-signed certificate
const pems = selfsigned.generate(null, { days: 365 });

const server = https.createServer({
    key: pems.private,
    cert: pems.cert
}, app);

const io = socketIo(server);

app.use(express.static(path.join(__dirname, 'public')));

// Create a new pool instance
const pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'gps_tracking',
    password: 'admin',
    port: 5432, // default PostgreSQL port
});

// Test the database connection
pool.connect((err, client, release) => {
    if (err) {
        return console.error('Error acquiring client', err.stack);
    }
    client.query('SELECT NOW()', (err, result) => {
        release();
        if (err) {
            return console.error('Error executing query', err.stack);
        }
        console.log('Connected to the database:', result.rows);
    });
});

let selectedDrones = new Set();  //เก็บสถานะการเลือก drone_id ป้องกันการเลือกซ้ำ
let clientDroneMap = new Map();  //เมื่อไคลเอนต์เลือกโดรน รายการจะถูกเพิ่มลงในแผนที่นี้โดยใช้ ID ซ็อกเก็ตของไคลเอนต์เป็นคีย์และ ID โดรนเป็นค่าเมื่อไคลเอนต์ยกเลิกการเลือกโดรนหรือตัดการเชื่อมต่อ รายการจะถูกลบออกจากแผนที่

app.get('/api/drones', (req, res) => {
    pool.query('SELECT drone_id FROM devices', (err, result) => {
        if (err) {
            return res.status(500).json({ error: err.stack });
        }
        const availableDrones = result.rows.filter(drone => !selectedDrones.has(drone.drone_id));
        res.json(availableDrones);
    });
});

io.on('connection', (socket) => {
    console.log('New client connected');

    socket.on('selectDrone', (drone_id) => {
        selectedDrones.add(drone_id);
        clientDroneMap.set(socket.id, drone_id);
        io.emit('updateDrones', Array.from(selectedDrones));
    });

    socket.on('deselectDrone', (drone_id) => {
        selectedDrones.delete(drone_id);
        clientDroneMap.delete(socket.id);
        io.emit('deselectDrone', drone_id); // ส่งเหตุการณ์ไปยังทุกอุปกรณ์
        io.emit('updateDrones', Array.from(selectedDrones));
    });

    socket.on('locationUpdate', (data) => {
        io.emit('locationUpdate', data);

        // Insert location data into the location_logs table
        const query = 'INSERT INTO location_logs(drone_id, latitude, longitude, altitude, speed) VALUES($1, $2, $3, $4, $5)';
        const values = [data.drone_id, data.latitude, data.longitude, data.altitude, data.speed];

        pool.query(query, values, (err, res) => {
            if (err) {
                console.error('Error inserting data', err.stack);
            } else {
                console.log('Data inserted successfully');
            }
        });
    });

    socket.on('disconnect', () => {
        console.log('Client disconnected');
        const drone_id = clientDroneMap.get(socket.id);
        if (drone_id) {
            selectedDrones.delete(drone_id);
            clientDroneMap.delete(socket.id);
            io.emit('updateDrones', Array.from(selectedDrones));
        }
    });
});

server.listen(3000, () => {
    console.log('Server is running on https://localhost:3000');
});

