import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import dbConnect from './lib/mongodb.js';
import Student from './models/studentsModel.js';

async function check() {
  try {
    if (!process.env.MONGO_URI) {
        console.error("MONGO_URI NOT LOADED");
        process.exit(1);
    }
    await dbConnect();
    const student = await Student.findOne();
    if (!student) {
        console.log("NO STUDENTS FOUND");
    } else {
        console.log("FIELDS:", Object.keys(student._doc));
        console.log("SAMPLE:", student._doc);
    }
  } catch (e) {
    console.error(e);
  } finally {
    process.exit();
  }
}

check();
