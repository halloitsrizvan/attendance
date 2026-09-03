  # Darul Irfan — Advanced Institutional Attendance & Management System

![Darul Irfan Banner](public/logo.png)

Darul Irfan is a modern, full-stack institutional management platform designed for educational institutions. It delivers automated attendance tracking, multi-tier leave & pass workflows, student mentorship and achievement tracking (Zehnuth), monthly class program competitions, disciplinary management, and administrative reporting.

---

## 📑 Table of Contents

- [Core Modules & Features](#-core-modules--features)
  - [1. Precision Attendance System](#1-precision-attendance-system)
  - [2. Advanced Leave & CEP Management](#2-advanced-leave--cep-management)
  - [3. Zehnuth Mentorship & Activity Points](#3-zehnuth-mentorship--activity-points)
  - [4. Monthly Class Programs & Best Class Ranking](#4-monthly-class-programs--best-class-ranking)
  - [5. Student Portal](#5-student-portal)
  - [6. Disciplinary & Complaints Tracking](#6-disciplinary--complaints-tracking)
  - [7. Administrative Intelligence & Data Sync](#7-administrative-intelligence--data-sync)
- [Role-Based Access Control (RBAC)](#-role-based-access-control-rbac)
- [Test Account & View-Only Sandbox](#-test-account--view-only-sandbox)
- [Technology Stack](#-technology-stack)
- [Project Directory Structure](#-project-directory-structure)
- [Environment Variables & Setup](#-environment-variables--setup)
- [API Architecture & Endpoints](#-api-architecture--endpoints)
- [License](#-license)

---

## 🚀 Core Modules & Features

### 1. Precision Attendance System
- **Period & Session-Aware Tracking**: Record student attendance for specific periods (1–10) or specialized sessions (*Morning*, *Night/Dars* from 7:00 PM – 8:30 PM).
- **Automated Conflict Shield**: Automatically identifies students with active approved leaves or Class Excused Passes (CEP) to prevent inaccurate absence records.
- **Historic Editing & Class-Wise Views**: Super-admins and authorized faculty can review, audit, and modify attendance for past dates.
- **Reporting Engine**: Real-time daily, monthly, class-wise, and period-specific attendance summaries with instant search and filtering.

### 2. Advanced Leave & CEP Management
- **Multi-Category Leave Requests**: Built-in support for *Medical (Home)*, *Medical (Room)*, *Hospital / Bystander*, *Marriage*, *Urgent / Bereavement*, *OGEA*, *Official*, and *Custom* reasons.
- **Class Excused Pass (CEP)**: Granular short-term leaves mapped to exact class periods or entire study sessions.
- **Automated Recovery Calculation**: Automatically computes whether student leave requires attendance recovery based on the institutional off-day calendar.
- **One-Click State Transitions**: Rapidly mark student returns, extend leave durations, or transition students from room rest to hospital care directly from dashboard popups.
- **CEP Approval Workflow**: Designate specific faculty members (`CEPApproval`) to review and approve temporary passes.

### 3. Zehnuth Mentorship & Activity Points
- **Student Achievement Logging**: Students submit proofs (images, descriptions) across various categories (Works, Co-curricular, Extra-curricular).
- **Duplicate & Spam Prevention**: Image hash matching and submission quotas prevent duplicate or copied submissions.
- **Mentor-Mentee System**: Dedicated mentor dashboard for teachers to monitor their assigned students' performance, approve submissions, and record mentor activities.
- **Live Leaderboards**: Student ranking, mentor activity scores, and batch summaries updated in real time.

### 4. Monthly Class Programs & Best Class Ranking
- **Monthly Class Reports**: Class teachers submit detailed reports of conducted activities categorized into *Tier 1* and *Tier 2* programs.
- **Approval & Review Lifecycle**: Two-phase verification process:
  1. Class Teacher submission & sign-off.
  2. Administrative review with dynamic mark allocation, viva score grading, and Zehnuth normalization.
- **Leaderboard Calculation**: Algorithmic scoring formula that aggregates program marks (scaled to 50%), Zehnuth achievements (25%), and Viva performance (25%).

### 5. Student Portal
- **Dedicated Student Experience**: Mobile-friendly self-service portal for students.
- **Features**:
  - View individual daily & period-wise attendance.
  - Submit leave & CEP requests directly with status tracking.
  - Upload Zehnuth achievement proofs and view earned points.
  - File confidential complaints / discrepancy reports for attendance corrections.
  - Review personal best class rankings and daily viva results.

### 6. Disciplinary & Complaints Tracking
- **Minus Points System**: Log and track disciplinary infractions with date-range reporting and historical analytics.
- **Attendance Complaints**: Students can report attendance discrepancies; administrators can resolve disputes with one-click automated database correction.

### 7. Administrative Intelligence & Data Sync
- **Bulk Excel Import/Sync**: Import and synchronize entire student directories with class numbers, admission numbers, passwords, and statuses in seconds.
- **Full Institutional Data Backup**: Single-click export of attendance logs, leaves, CEP records, disciplinary data, students, and teachers into a structured multi-sheet Excel file (`.xlsx`).
- **Academic Year Isolation**: Active year switching enables seamless transition between academic terms while archiving historical records.
- **Holiday & Off-Day Management**: Dynamic holiday calendar used across attendance and leave recovery calculations.

---

## 👥 Role-Based Access Control (RBAC)

The application implements granular permissions across multiple specialized roles:

| Role | Permissions & Scope |
|---|---|
| `super_admin` | Unrestricted institutional access, system settings, academic years, user management, and global report exports. |
| `Principal` | Full institutional view, leave approvals, complaints overview, and high-level reports. |
| `HOD` / `HOS` | Section-level supervision (Junior classes 1–7 for HOS, Senior classes 8–10 for HOD), leave approvals, and student tracking. |
| `class_teacher` | Manage assigned class attendance, approve monthly class reports, and monitor class leaves. |
| `medical_teacher` | Create and manage medical leaves (Hospital, Hospital Bystander, Medical Room). |
| `zehnuth_admin` | Verify, award, edit, and delete student Zehnuth achievement points. |
| `best_class_admin` | Grade, review, and evaluate monthly class program reports and publish leaderboards. |
| `CEPApproval` | Review, approve, and issue Class Excused Passes. |
| `teacher` | General attendance recording and mentor activity submissions. |

---

## ⚡ Test Account & View-Only Sandbox

To allow demonstration, client preview, and auditing without risking institutional data integrity, a dedicated view-only test mode is built into the core:

- **Test Email**: `test@gmail.com`
- **Auto-Provisioning**: Automatically provisioned with all functional roles upon login.
- **Universal View Access**: View all pages, menus, settings, dashboards, and student data across the entire platform.
- **Dual-Layer Mutation Shield**:
  1. **Client-Side Interceptor**: Automatically blocks mutation actions (`POST`, `PUT`, `PATCH`, `DELETE`) before they execute and triggers a non-intrusive alert toast (*"Action disabled: test@gmail.com is in View-Only mode"*).
  2. **Server-Side Mutation Guard**: All backend mutation API routes enforce a strict 403 Forbidden check on `test@gmail.com` requests.
- **Indicator**: Floating badge displayed at the bottom of the interface indicating active view-only session.

---

## 🛠️ Technology Stack

- **Framework**: [Next.js 14](https://nextjs.org/) (App Router, Server Components & Route Handlers)
- **Frontend / UI**: React 18, Vanilla CSS Design System, [Lucide React Icons](https://lucide.dev/)
- **Database**: [MongoDB](https://www.mongodb.com/) via [Mongoose ODM](https://mongoosejs.com/)
- **Authentication**: JWT (JSON Web Tokens) with separate secure token generation for Teachers and Students, `bcryptjs` password hashing
- **Data Export & Reporting**: [SheetJS (xlsx)](https://sheetjs.com/), [jsPDF](https://parall.ax/products/jspdf), [jspdf-autotable](https://github.com/simonbengtsson/jsPDF-AutoTable)
- **HTTP Client**: [Axios](https://axios-http.com/) with request/response interceptors

---

## 📁 Project Directory Structure

```
attendance/
├── app/                                # Next.js App Router (Pages & API Endpoints)
│   ├── (auth)/                         # Login and signup routes (Teacher & Student)
│   ├── api/                            # REST API Route Handlers
│   │   ├── academic-years/             # Academic year CRUD & active toggle
│   │   ├── class-excused-pass/         # CEP creation, review, and deletion
│   │   ├── class-reports/              # Monthly program submission, approval & review
│   │   ├── classes/                    # Class metadata and listing
│   │   ├── complaints/                 # Attendance dispute filing & resolution
│   │   ├── leave/                      # Leave operations (CRUD, bulk update, returns)
│   │   ├── minus/                      # Disciplinary record tracking
│   │   ├── off-days/                   # Institutional holidays & off-days
│   │   ├── set-attendance/             # Core attendance marking & aggregation
│   │   ├── settings/                   # Key-value system configurations
│   │   ├── students/                   # Student CRUD, bulk import, & auth
│   │   ├── teachers/                   # Teacher CRUD & authentication
│   │   └── zehnuth/                    # Points, mentor activities, & leaderboards
│   ├── attendance/                     # Attendance recording interface
│   ├── attendance-report/              # Periodic attendance reports
│   ├── class-reports/                  # Monthly program submissions & admin grading
│   ├── complaints/                     # Attendance complaints resolution page
│   ├── leave-dashboard/                # Real-time leave overview
│   ├── leave-form/                     # Student leave application form
│   ├── settings/                       # System administration & exports
│   ├── students-portal/                # Student-facing self-service pages
│   ├── teachers-management/            # Faculty directory & credentials management
│   └── zehnuth/                        # Zehnuth achievement review & leaderboards
├── components/                         # Modular React Components
│   ├── Header/                         # Global responsive navigation header
│   ├── allClasses/                     # Class dashboard & period selector
│   ├── attendance/                     # Attendance tables & status pickers
│   ├── auth/                           # Route AuthGuard and permission wrappers
│   ├── common/                         # Banners, alerts, and toasts
│   ├── leave/                          # Leave tables, status cards, and CEP forms
│   └── management/                     # Student & teacher management tables
├── lib/                                # Core utilities & Database connectors
│   ├── getActiveAcademicYear.js        # Active academic year resolver
│   ├── mongodb.js                      # MongoDB connection pool singleton
│   └── recovery.js                     # Leave recovery calculation engine
├── models/                             # Mongoose Database Schemas
│   ├── academicYearModel.js            # Academic year schema
│   ├── attendanceModel.js              # Attendance record schema
│   ├── classReportModel.js             # Monthly class program report schema
│   ├── classes.js                      # Class definitions schema
│   ├── complaintModel.js               # Discrepancy complaint schema
│   ├── leaveModel.js                   # Student leave schema
│   ├── mentorActivityModel.js          # Mentor activity log schema
│   ├── mentorMenteeModel.js            # Mentorship assignment schema
│   ├── minusModel.js                   # Disciplinary infractions schema
│   ├── offDayModel.js                  # Holiday / off-day schema
│   ├── pointsModel.js                  # Zehnuth points & proofs schema
│   ├── settingsModel.js                # System settings schema
│   ├── shortLeaveModel.js              # CEP pass schema
│   ├── studentsModel.js                # Student directory schema
│   └── teachersModel.js                # Teacher directory schema
└── utils/                              # Shared helper libraries
    ├── mutationGuard.js                # Server-side test user mutation shield
    ├── testUserUtils.js                # Client-side test user interceptor
    ├── teacherJwtUtils.js              # Teacher JWT signing and verification
    └── studentJwtUtils.js              # Student JWT signing and verification
```

---

## ⚙️ Environment Variables & Setup

### 1. Prerequisites
- **Node.js**: v18.17.0 or higher
- **npm** or **yarn**
- **MongoDB**: Local instance or MongoDB Atlas cluster

### 2. Environment Configuration
Create a `.env.local` file in the root directory:

```env
# MongoDB Connection String
MONGODB_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/<database>?retryWrites=true&w=majority

# JWT Token Secret
JWT_SECRET=your_jwt_secret_key_here

# Base API URL
API_PORT=http://localhost:3000/api
```

### 3. Installation & Local Development

```bash
# 1. Clone repository
git clone https://github.com/halloitsrizvan/attendance.git
cd attendance

# 2. Install dependencies
npm install

# 3. Start local development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### 4. Production Build

```bash
# Build optimized production bundle
npm run build

# Start production server
npm start
```

---

## 📡 API Architecture & Endpoints

| Resource | Method | Endpoint | Description |
|---|---|---|---|
| **Attendance** | `GET`, `POST`, `PATCH` | `/api/set-attendance` | Query and record period attendance. |
| | `GET`, `PATCH`, `DELETE` | `/api/set-attendance/[id]` | Query, update, or remove attendance record. |
| | `GET` | `/api/set-attendance/report/detailed-daily` | Generate daily detailed attendance reports. |
| | `GET` | `/api/set-attendance/report/monthly` | Generate monthly attendance matrix. |
| **Leaves & CEP** | `GET`, `POST` | `/api/leave` | Query and apply for leaves. |
| | `GET`, `PATCH`, `DELETE` | `/api/leave/[id]` | Manage individual leave entries. |
| | `PATCH` | `/api/leave/bulk-update` | Bulk update leave statuses (e.g. returns). |
| | `GET`, `POST` | `/api/class-excused-pass` | Query and create Class Excused Passes. |
| | `GET`, `PATCH`, `DELETE` | `/api/class-excused-pass/[id]` | Manage CEP passes. |
| **Zehnuth** | `GET`, `POST`, `PUT`, `DELETE`| `/api/zehnuth/points` | Query, submit, verify, or remove points. |
| | `GET`, `POST` | `/api/zehnuth/mentor-activities` | Query and submit mentor activities. |
| | `GET` | `/api/zehnuth/mentor-leaderboard` | View mentor ranking leaderboard. |
| **Class Reports** | `GET`, `POST` | `/api/class-reports` | Query and submit monthly class reports. |
| | `PATCH` | `/api/class-reports/[id]/approve` | Class teacher report approval. |
| | `PATCH` | `/api/class-reports/review` | Admin review, mark allocation, and scoring. |
| **Directory** | `GET`, `POST` | `/api/students` | List and register students. |
| | `POST` | `/api/students/bulk-import` | Sync students from Excel dataset. |
| | `GET`, `POST` | `/api/teachers` | List and register faculty. |
| | `POST` | `/api/teachers/login` | Teacher authentication. |
| **System** | `GET`, `POST` | `/api/academic-years` | Manage academic years and active session. |
| | `GET`, `POST`, `DELETE` | `/api/off-days` | Manage institutional holidays. |
| | `GET`, `POST` | `/api/settings` | Retrieve and update system settings. |

---

## 📄 License

This project is licensed under the [ISC License](LICENSE).

---

*Developed with precision for Darul Irfan.*