// types/milestone.ts
export type MilestoneStatus = "Not Started" | "In Progress" | "Completed";

export interface Milestone {
  id: string;
  title: string;
  description?: string;
  expectedCompletion: Date | string;
  status: MilestoneStatus;
  assignedTo?: string; // User ID or name
  projectId: string;
}

export interface StatusData {
  completed: number;
  inProgress: number;
  notStarted: number;
}