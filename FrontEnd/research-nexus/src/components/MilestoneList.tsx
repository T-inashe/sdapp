// components/MilestoneList.tsx
import React from "react";
import { Milestone } from "../types/milestone";

interface MilestoneListProps {
  milestones: Milestone[];
}

const MilestoneList: React.FC<MilestoneListProps> = ({ milestones }) => {
  return (
    <ul>
      {milestones.map((milestone) => (
        <li key={milestone.id}>
          <h3>{milestone.title}</h3>
          <p>Status: {milestone.status}</p>
          <p>Due: {new Date(milestone.expectedCompletion).toLocaleDateString()}</p>
        </li>
      ))}
    </ul>
  );
};

export default MilestoneList;