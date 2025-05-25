![Tests](https://github.com/T-inashe/sdapp/actions/workflows/run-tests.yml/badge.svg?branch=latestapp)
# 🧪 University Research Collaboration Platform

## 📚 Introduction

Researchers in universities often face difficulties in finding suitable collaborators, managing shared resources, and tracking project progress. This platform addresses those challenges by offering a centralized, web-based environment where academics can:

- Connect and collaborate on research projects
- Share ideas and resources
- Manage funding and milestones
- Generate insightful reports

---

## 🎯 Project Objectives

The platform is developed using:

- **Agile methodology**
- **Continuous Integration/Continuous Deployment (CI/CD)**
- **Test-Driven Development (TDD)**

The objective is to build a **publicly accessible**, **feature-rich**, and **secure** research collaboration system tailored to university needs.

---

## 🌐 Features Overview

### 🔐 User Verification

- Integration with a **third-party identity provider**
- Role-based access:
  - **Researcher**: Create/manage projects, track funding
  - **Reviewer**: View and evaluate research work
  - **Admin**: Manage users and the platform

### 🧱 Project Management

- Create detailed project listings
- Define goals and requirements
- Invite collaborators to participate

### 💬 Collaboration Tools

- Built-in messaging system
- Document sharing
- Milestone tracking

### 💸 Funding Tracking

- Track grant allocations and expenses
- Monitor funding requirements

### 📊 Reporting & Dashboards

- Dashboards with the following views:
  - Project completion status
  - Funding used vs. available
  - Custom reports
- Export reports and dashboards as **PDF**

---

## 🛠️ Local Setup Guide

### ✅ Prerequisites

Ensure you have the following installed:

- Node.js (LTS version)
- npm or yarn
- Git

---

### 📁 1. Clone the Repository

```bash
git clone https://github.com/T-inashe/sdapp.git

# Backend
cd BackEnd
npm install

# Frontend
cd ../FrontEnd/research-nexus
npm install

Create a .env file in FrontEnd with the links:
BACKEND_URL=https://localhost:8081
FRONTEND_URL=https://localhost:5173

Run both the backend and frontend in separate terminals:
# Backend
cd BackEnd
npm run dev

# Frontend
cd FrontEnd
npm run dev

This project is licensed under the MIT License.


