const mongoose = require('mongoose');

const uri = "mongodb+srv://clgrizvan_db_user:267267@attentence.xcquffo.mongodb.net/attendance";

async function run() {
    try {
        await mongoose.connect(uri);
        console.log("Connected to MongoDB");
        
        const collection = mongoose.connection.collection('offdays');
        
        console.log("Checking indexes...");
        const indexes = await collection.indexes();
        console.log("Current indexes:", JSON.stringify(indexes, null, 2));
        
        if (indexes.find(idx => idx.name === 'date_1')) {
            console.log("Dropping index date_1...");
            await collection.dropIndex('date_1');
            console.log("Index dropped successfully");
        } else {
            console.log("Index date_1 not found");
        }
        
    } catch (err) {
        console.error("Error:", err);
    } finally {
        await mongoose.disconnect();
        console.log("Disconnected");
    }
}

run();
