// importData.js
console.log("🚀 Script execution started");

// 1. Immediately load and initialize mongoose
const mongoose = require('mongoose');
require('dotenv').config();

// 2. Verify environment variables before proceeding
console.log("[1] Checking environment configuration...");
if (!process.env.MONGO_URI) {
  console.error("❌ FATAL ERROR: MONGO_URI is missing from .env file");
  console.log("💡 Please ensure your .env file contains: MONGO_URI=your_mongodb_connection_string");
  process.exit(1);
}
console.log("✅ Environment variables verified");

// 3. Setup database connection events
console.log("[2] Setting up database connection handlers...");
mongoose.connection.on('error', err => {
  console.error('Mongoose connection error:', err.message);
});

mongoose.connection.on('connected', () => {
  console.log('✅ Mongoose connected to DB');
});

// 4. Load models with error handling
console.log("[3] Loading database models...");
let Notification, ResearcherSkill;
try {
  Notification = require('./models/Notification');
  ResearcherSkill = require('./models/ResearcherSkill');
  console.log("✅ Models loaded successfully");
} catch (err) {
  console.error("❌ Failed to load models:", err.message);
  console.log("💡 Please ensure these files exist in ./models/ directory");
  process.exit(1);
}

// 5. Data to import
const sampleData = {
  notifications: [
    {
      user_email: "test@example.com",
      message: "You were invited to join \"AI in Healthcare Research\"",
      type: "invitation",
      related_id: null,
      read: false,
      created_at: new Date("2025-04-29T20:29:08Z")
    }
  ],
  researcherSkills: [
    {
      email: "researcher@university.edu",
      research_areas: ["Environmental Science", "Climate Change"],
      technical_skills: ["GIS", "Python", "Statistical Modeling"],
      publications: 5,
      created_at: new Date("2025-04-29T20:29:08Z"),
      updated_at: new Date("2025-04-29T20:29:08Z")
    }
  ]
};

// 6. Main import function
async function importData() {
  try {
    console.log("\n[4] Starting data import process...");

    const notificationCount = await Notification.countDocuments();
    const skillCount = await ResearcherSkill.countDocuments();
    console.log(`📊 Existing data: ${notificationCount} notifications, ${skillCount} researcher skills`);

    console.log("⏳ Inserting sample data...");
    const notificationResult = await Notification.insertMany(sampleData.notifications);
    const skillResult = await ResearcherSkill.insertMany(sampleData.researcherSkills);

    console.log(`✅ Successfully inserted: ${notificationResult.length} notifications, ${skillResult.length} skills`);
  } catch (err) {
    console.error("❌ Import failed:", err.message);
    if (err.errors) {
      console.error("Validation errors:", JSON.stringify(err.errors, null, 2));
    }
  } finally {
    await mongoose.disconnect();
    console.log("🔌 Disconnected from database");
  }
}

// 7. Execute the import process
(async () => {
  try {
    console.log("\n[5] Connecting to MongoDB...");
    await mongoose.connect(process.env.MONGO_URI, {
      // The next two options are deprecated but retained for backward compatibility in older setups
      useNewUrlParser: true,
      useUnifiedTopology: true,
      connectTimeoutMS: 10000,
      serverSelectionTimeoutMS: 10000
    });

    await importData();
  } catch (err) {
    console.error("❌ Fatal error in main process:", err.message);
    if (err.name === 'MongooseServerSelectionError') {
      console.error("💡 Check your:\n1. MongoDB connection string\n2. Internet connection\n3. IP whitelisting in MongoDB Atlas");
    }
  } finally {
    console.log("\n🏁 Script execution complete");
    process.exit(0);
  }
})();

// 8. Handle process termination
process.on('SIGINT', async () => {
  console.log("\n🛑 Received termination signal");
  await mongoose.disconnect();
  process.exit(0);
});
