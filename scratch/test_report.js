const axios = require('axios');
const API_PORT = 'http://localhost:3000/api';

async function test() {
    try {
        const today = new Date().toISOString().split('T')[0];
        const res = await axios.get(`${API_PORT}/report/minus-advanced`, {
            params: { fromDate: '2026-05-01', toDate: '2026-05-31' }
        });
        console.log("Status:", res.status);
        console.log("Results count:", res.data?.results?.length);
        if (res.data?.results?.length > 0) {
            const sample = res.data.results[0];
            console.log("Sample Student:", sample.nameOfStd);
            console.log("totalMedicalLeave:", sample.totalMedicalLeave);
            console.log("totalDocumentedMedicalLeave:", sample.totalDocumentedMedicalLeave);
            console.log("totalOgeaLeave:", sample.totalOgeaLeave);
            console.log("totalDocumentedOgeaLeave:", sample.totalDocumentedOgeaLeave);
            console.log("totalDocumentedLeave:", sample.totalDocumentedLeave);
            console.log("groupedAttendance key keys:", Object.keys(sample.groupedAttendance || {}));
        }
    } catch (err) {
        console.log("Error:", err.message);
        if (err.response) {
            console.log("Response data:", err.response.data);
        }
    }
}

test();
