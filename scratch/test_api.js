
const axios = require('axios');
const API_PORT = 'http://localhost:3000/api'; // Assuming this from typical Next.js setup

async function test() {
    try {
        const res = await axios.get(`${API_PORT}/set-attendance`, {
            params: { classNumber: 5, date: '2026-04-17' }
        });
        console.log("Records found:", res.data.length);
        if (res.data.length > 0) {
            console.log("First record studentId:", res.data[0].studentId);
            console.log("First record status:", res.data[0].status);
        }
    } catch (err) {
        console.log("Error:", err.message);
    }
}

test();
