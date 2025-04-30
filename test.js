const mongoose = require('mongoose');
require('dotenv').config();

// Define Notification and ResearcherSkill models as you did in importData.js
const Notification = require('./models/Notification');
const ResearcherSkill = require('./models/ResearcherSkill');

async function viewData() {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    // Fetch all notifications
    const notifications = await Notification.find();
    console.log("Notifications:", notifications);

    // Fetch all researcher skills
    const researcherSkills = await ResearcherSkill.find();
    console.log("Researcher Skills:", researcherSkills);

  } catch (err) {
    console.error("Error fetching data:", err.message);
  } finally {
    await mongoose.disconnect();
  }
}

viewData();
