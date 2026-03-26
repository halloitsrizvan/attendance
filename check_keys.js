const mongoose = require('mongoose');

async function check() {
  await mongoose.connect('mongodb+srv://rizu:rizu123@cluster0.p7ga7.mongodb.net/attendance?retryWrites=true&w=majority&appName=Cluster0');
  const db = mongoose.connection.db;
  const students = await db.collection('students').find({}).limit(1).toArray();
  if (students.length > 0) {
    console.log('Keys of first student:', Object.keys(students[0]));
    console.log('Values:', JSON.stringify(students[0], null, 2));
  } else {
    console.log('No students found');
  }
  process.exit(0);
}

check();
