const mongoose = require('mongoose');

async function check() {
  await mongoose.connect('mongodb+srv://rizu:rizu123@cluster0.p7ga7.mongodb.net/attendance?retryWrites=true&w=majority&appName=Cluster0');
  const db = mongoose.connection.db;
  const students = await db.collection('students').find({}).limit(1).toArray();
  console.log('Direct DB Check:', JSON.stringify(students[0], null, 2));
  process.exit(0);
}

check();
