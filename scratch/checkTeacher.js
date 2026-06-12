import mongoose from 'mongoose';

const MONGO_URI = "mongodb://clgrizvan_db_user:267267@ac-temfdvv-shard-00-00.xcquffo.mongodb.net:27017,ac-temfdvv-shard-00-01.xcquffo.mongodb.net:27017,ac-temfdvv-shard-00-02.xcquffo.mongodb.net:27017/attendance?ssl=true&replicaSet=atlas-13u7it-shard-0&authSource=admin&retryWrites=true&w=majority";

async function run() {
  await mongoose.connect(MONGO_URI);
  console.log("Connected to DB");
  const Teacher = mongoose.models.Teacher || mongoose.model('Teacher', new mongoose.Schema({
    name: String,
    email: String,
    role: mongoose.Schema.Types.Mixed
  }, { collection: 'teachers' }));

  const teachers = await Teacher.find({ name: /TEST/i });
  console.log("Found teachers:", JSON.stringify(teachers, null, 2));
  await mongoose.disconnect();
}

run().catch(console.error);
