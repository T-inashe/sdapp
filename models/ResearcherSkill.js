const mongoose = require('mongoose');

const researcherSkillSchema = new mongoose.Schema({
  email: { type: String, required: true },
  research_areas: [String],
  technical_skills: [String],
  publications: { type: Number, default: 0 },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
});

module.exports = mongoose.models.ResearcherSkill || mongoose.model('ResearcherSkill', researcherSkillSchema);
