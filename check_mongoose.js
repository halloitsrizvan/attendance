const mongoose = require('mongoose');

const Schema = mongoose.Schema;
const studentsSchema = new Schema({
    ["SHORT NAME"]: { type: String, required: true },
    ADNO: { type: Number, required: true },
    CLASS: { type: Number, required: true },
});

const Student = mongoose.model('TestStudent', studentsSchema);

async function check() {
  const doc = new Student({
    "SHORT NAME": "TEST STUDENT",
    ADNO: 123,
    CLASS: 1
  });
  
  console.log('Direct Access:', doc["SHORT NAME"]);
  const json = doc.toJSON();
  console.log('JSON Access:', json["SHORT NAME"]);
  console.log('Full JSON:', JSON.stringify(json));
  process.exit(0);
}

check();
