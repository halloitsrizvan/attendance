import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function check() {
  const uri = process.env.MONGO_URI;
  if (!uri) {
    console.error("MONGO_URI NOT FOUND");
    process.exit(1);
  }
  const client = new MongoClient(uri);
  try {
    await client.connect();
    const db = client.db();
    const student = await db.collection('students').findOne();
    if (!student) {
      console.log("NO STUDENTS");
    } else {
      console.log("KEYS:", Object.keys(student));
      console.log("SAMPLE:", student);
    }
  } catch (e) {
    console.error(e);
  } finally {
    await client.close();
    process.exit();
  }
}

check();
