# Darul Irfan Attendance & Leave Management

![Darul Irfan Banner](/public/logo.png)

Darul Irfan is a comprehensive, full-stack institutional management solution designed to streamline student attendance, complex leave workflows, and administrative reporting. It provides role-based portals for teachers, students, and administrators to ensure precision and efficiency in daily operations.

---

## 1. Project Overview

### Purpose and Goals
The core purpose of this system is to transition traditional, paper-based institutional attendance and leave management into a robust digital platform. It aims to eliminate discrepancies, offer real-time insights to administrators, and simplify leave applications.

### Key Roles
- **Students**: Can log in to view their attendance, request leaves (CEP, Medical), view minus points, and check Zehnuth (mentorship) points.
- **Teachers**: Can mark period-wise attendance, approve short leaves, issue minus points, and assign Zehnuth points to mentees.
- **Administrators / HODs / HOS**: Full oversight of reports, leave management (extension, early returns), system configuration, and bulk exports.

### Technology Stack
- **Frontend / Backend**: Next.js 14 (App Router)
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT & bcrypt
- **Exports**: SheetJS (XLSX) and jsPDF
- **Styling**: Vanilla CSS, Lucide Icons

---

## 2. Architecture & Directory Structure

The project utilizes the Next.js 14 App Router, keeping UI and API routes cohesively organized.

### Core Directories

- `/app`: The backbone of the application.
  - `/app/(auth)`: Routes for `login`, `signup`, `students-login`.
  - `/app/api`: Serverless REST endpoints mapping to the database models.
  - `/app/attendance` & `/app/edit-attendance`: Dashboards for teachers to manage daily period-wise attendance.
  - `/app/leave-dashboard` & `/app/leave-applications`: Central hubs for processing student leave requests.
  - `/app/report`, `/app/medical-report`, `/app/minus-report`: Administrative data visualization and export tools.
  - `/app/students-portal`: The dedicated frontend for students.
- `/components`: High-fidelity reusable React components (e.g., Modals, Headers, Data Tables, Forms).
- `/models`: Mongoose Schemas defining the database structure.
- `/lib`: Database connection utilities and shared helper functions.
- `/config`: System-wide configurations and constants.

---

## 3. Database Schema (Models)

The database is built on MongoDB using Mongoose. Below are the primary models driving the application.

### Users
- **Student (`models/studentsModel.js`)**:
  - Contains demographic data (`FULL NAME`, `SHORT NAME`, `ADNO`, `CLASS`, `SL`).
  - Tracks real-time status (`onLeave`, `Status`, `active`).
  - Indexed by `CLASS` and `ADNO` for rapid queries.
- **Teacher (`models/teachersModel.js`)**:
  - Authentication and role management (`email`, `password`, `role`).
  - `role` array enables multi-tier access (e.g., `["teacher", "admin"]`).

### Attendance & Leaves
- **Attendance (`models/attendanceModel.js`)**:
  - Records period-level data (`status`, `period`, `attendanceTime`, `attendanceDate`).
  - Links to `Student`, `Teacher`, `Leave`, `ClassExcusedPass`, and `AcademicYear`.
- **Leave (`models/leaveModel.js`)**:
  - Complex state machine for leaves (`status`: Scheduled, pending, active, late, returned).
  - Handles medical and program leaves with document tracking (`isMedicalSubmitted`, `documentUrl`).
  - Maintains `reasonHistory` and `extensionHistory` arrays for auditing.
- **Short Leave / CEP (`models/shortLeaveModel.js`)**:
  - Manages Class Excused Passes for partial day absences.

### Core Entities & Reporting
- **AcademicYear (`models/academicYearModel.js`)**: Isolates data by session year.
- **ClassReport (`models/classReportModel.js`)**: Pre-aggregated metrics for class performance.
- **Minus (`models/minusModel.js`)**: Disciplinary tracking for minor infractions.
- **Complaint (`models/complaintModel.js`)**: Administrative grievance and incident reporting.

### Mentorship (Zehnuth)
- **MentorMentee (`models/mentorMenteeModel.js`)**: Links teachers to assigned student mentees.
- **Points & Activities (`models/pointsModel.js`, `models/mentorActivityModel.js`)**: Tracks positive reinforcement and extracurricular achievements.

---

## 4. Core Features & Workflows

### Attendance Management
- **Context-Aware Recording**: Teachers mark attendance for specific periods (1-10). The system prevents marking students who are actively on leave.
- **Session Types**: Supports standard "Morning" sessions and "Night/Dars" sessions seamlessly.

### Advanced Leave Management
- **Medical Leave Suite**: Multi-tier tracking for Medical Home, Medical Room, and standard leave types.
- **Class Excused Pass (CEP)**: Granular control over short-term absences based on period ranges.
- **One-Click Returns & Extensions**: Administrators can instantly mark students as returned or extend their leave via context-aware popups without navigating away from the dashboard.

### Administrative Reporting
- **Multi-Sheet Exports**: A robust export engine compiles Attendance, Disciplinary actions, Leaves, CEPs, and User directories into a single organized Excel workbook.
- **Dynamic Leaderboards**: Visualizes class and individual student performance based on attendance ratios and Zehnuth points.

---

## 5. API Overview

The Next.js `/app/api` directory exposes RESTful endpoints secured by middleware.

### Key API Routes
- **`/api/attendance/*`**:
  - POST `/api/attendance/mark`: Marks period-wise attendance.
  - GET `/api/attendance/report`: Fetches aggregated attendance data for reports.
- **`/api/leave/*`**:
  - POST `/api/leave/request`: Submits a new leave request.
  - PATCH `/api/leave/status`: Approves, extends, or marks a leave as returned.
- **`/api/students/*`**:
  - GET `/api/students/class/:id`: Fetches all active students for a specific class.
  - PUT `/api/students/update`: Updates student demographics or status.
- **`/api/teachers/*`**: Authentication and role validation endpoints.
- **`/api/zehnuth/*`**: Management of mentor-mentee assignments and point distribution.
- **`/api/minus/*`**: Issuing and tracking disciplinary points.

> [!NOTE]
> All sensitive API routes verify the presence of a valid JWT token before processing the request.

---

## 6. Setup & Deployment Guide

### Prerequisites
- Node.js (v18+)
- MongoDB Instance (Atlas or Local)

### Environment Configuration
Create a `.env.local` file in the root directory:
```env
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_secure_random_string
API_PORT=http://localhost:3000/api
```

### Local Installation
1. Install dependencies:
   ```bash
   npm install
   ```
2. Start the development server:
   ```bash
   npm run dev
   ```
3. Access the application at `http://localhost:3000`.

### Production Build
1. Build the Next.js application:
   ```bash
   npm run build
   ```
2. Start the production server:
   ```bash
   npm start
   ```

> [!TIP]
> For optimal performance and zero-configuration deployments, this project is highly recommended to be hosted on **Vercel**, which natively supports the Next.js App Router and serverless API functions.
