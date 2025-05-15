
const express = require("express");
const router = express.Router();
const milestoneController = require("../Controller/MilestoneC");

router.post("/", milestoneController.createMilestone);
router.put("/:id", milestoneController.updateMilestone);
router.delete("/:id", milestoneController.deleteMilestone);
router.get("/project/:projectId", milestoneController.getMilestonesByProject);

module.exports = router;