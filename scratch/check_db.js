const mongoose = require('mongoose');
const MONGO_URI = "mongodb://clgrizvan_db_user:267267@ac-temfdvv-shard-00-00.xcquffo.mongodb.net:27017,ac-temfdvv-shard-00-01.xcquffo.mongodb.net:27017,ac-temfdvv-shard-00-02.xcquffo.mongodb.net:27017/attendance?ssl=true&replicaSet=atlas-13u7it-shard-0&authSource=admin&retryWrites=true&w=majority";

async function main() {
  await mongoose.connect(MONGO_URI);
  console.log('Connected to DB');

  const student = await mongoose.connection.db.collection('students').findOne({ ADNO: 455 });
  console.log('Student:', student);

  if (student) {
    const attendance = await mongoose.connection.db.collection('attendances')
      .find({
        studentId: student._id,
        attendanceDate: {
          $gte: new Date('2026-05-01T00:00:00.000Z'),
          $lte: new Date('2026-05-01T23:59:59.999Z')
        }
      }).toArray();
    console.log('Attendance records found:', attendance.length);
    attendance.forEach(rec => {
      console.log('---Record---');
      console.log('ID:', rec._id);
      console.log('attendanceTime:', rec.attendanceTime);
      console.log('attendanceDate:', rec.attendanceDate, 'Type:', typeof rec.attendanceDate);
      console.log('Day of week (UTC):', new Date(rec.attendanceDate).getUTCDay());
      console.log('Day of week (Local):', new Date(rec.attendanceDate).getDay());
      console.log('Hours (Local):', new Date(rec.attendanceDate).getHours());
      console.log('Minutes (Local):', new Date(rec.attendanceDate).getMinutes());
      console.log('status:', rec.status);
      console.log('onLeave:', rec.onLeave);
    });
  }

  await mongoose.disconnect();
}

main().catch(console.error);
