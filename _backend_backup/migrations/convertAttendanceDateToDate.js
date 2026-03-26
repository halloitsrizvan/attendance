const mongoose = require('mongoose');
require('dotenv').config();

// Import the Attendance model
const Attendance = require('../models/attendanceModel');

async function migrateAttendanceDate() {
  try {
    // Connect to MongoDB
    const mongoUri = process.env.MONGO_URI || 'mongodb+srv://clgrizvan_db_user:267267@attentence.xcquffo.mongodb.net/attendance ';
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB');

    // Find all attendance records
    const attendances = await Attendance.find({});
    console.log(`Found ${attendances.length} attendance records to migrate`);

    let updatedCount = 0;
    let errorCount = 0;

    // Process each record
    for (const attendance of attendances) {
      try {
        // Check if attendanceDate is a string
        if (typeof attendance.attendanceDate === 'string') {
          // Convert YYYY-MM-DD string to Date object
          const dateString = attendance.attendanceDate;
          
          // Validate format (YYYY-MM-DD)
          if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
            // Create Date object (set to start of day in local timezone)
            const dateObj = new Date(dateString + 'T00:00:00');
            
            // Update the document
            await Attendance.updateOne(
              { _id: attendance._id },
              { $set: { attendanceDate: dateObj } }
            );
            
            updatedCount++;
            if (updatedCount % 100 === 0) {
              console.log(`Processed ${updatedCount} records...`);
            }
          } else {
            console.warn(`Invalid date format for record ${attendance._id}: ${dateString}`);
            errorCount++;
          }
        } else if (attendance.attendanceDate instanceof Date) {
          // Already a Date, skip
          console.log(`Record ${attendance._id} already has Date type, skipping`);
        }
      } catch (error) {
        console.error(`Error processing record ${attendance._id}:`, error.message);
        errorCount++;
      }
    }

    console.log('\nMigration completed!');
    console.log(`Total records: ${attendances.length}`);
    console.log(`Updated: ${updatedCount}`);
    console.log(`Errors: ${errorCount}`);
    console.log(`Skipped: ${attendances.length - updatedCount - errorCount}`);

  } catch (error) {
    console.error('Migration error:', error);
    throw error;
  } finally {
    // Close connection
    await mongoose.connection.close();
    console.log('Database connection closed');
  }
}

// Run migration if called directly
if (require.main === module) {
  migrateAttendanceDate()
    .then(() => {
      console.log('Migration script completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Migration script failed:', error);
      process.exit(1);
    });
}

module.exports = migrateAttendanceDate;

