const axios = require('axios');

async function main() {
  try {
    const res = await axios.get('http://localhost:3000/api/report/minus-advanced', {
      params: {
        fromDate: '2026-05-01',
        toDate: '2026-05-01',
        class: '9'
      }
    });
    const student = res.data.results.find(s => s.ad === 455);
    console.log('API Student results for 455:', JSON.stringify(student, null, 2));
  } catch (err) {
    console.error('Error hitting API:', err.message);
  }
}

main();
