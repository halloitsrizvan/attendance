# BrightPath | Advanced Attendance & Leave Management

![BrightPath Banner](public/logo.png)

BrightPath is a premium, full-stack institutional management solution designed to streamline student attendance, complex leave workflows, and administrative reporting. Built with a focus on precision and professional aesthetics, it serves as a central hub for teachers, administrators, and students.

## 🚀 Key Features

### 📅 Precision Attendance
- **Context-Aware Recording**: Mark attendance for specific periods (1-10) with automatic time-range mapping.
- **Session Support**: Dedicated workflows for "Morning" and "Night/Dars" (7:00 PM - 8:30 PM) sessions.
- **Real-Time Leave Integration**: Students on authorized leave (Medical or CEP) are automatically flagged and protected from accidental marking during their leave window.

### 🏥 Advanced Leave Management
- **Medical Leave Suite**: Multi-tier tracking for "Medical Home" and "Medical Room" stays.
- **Class Excused Pass (CEP)**: Precise short-term absence management with period-range or session-based (Dars) pass generation.
- **One-Click Returns**: Seamlessly mark students as returned from the attendance dashboard, instantly updating their status across the institution.

### 📊 Administrative Intelligence
- **Full Institutional Backup**: Export all institutional data—Attendance, Disciplinary (Minus), Leaves, CEPs, and User directories—into a single, professionally organized multi-sheet Excel workbook.
- **Academic Year Management**: Lifecycle management for institutional sessions, enabling clean data separation between years.
- **Dynamic Action Popups**: Context-aware student status alerts that allow admins to extend leaves, mark returns, or transition between medical states in just two clicks.

### 🛡️ Security & Performance
- **Role-Based Access Control (RBAC)**: Fine-grained permissions for Teachers, HODs, HOS, and Super-Admins.
- **Middleware Protection**: Automated session verification and unauthorized route shielding.
- **Mobile Optimized**: A fully responsive interface designed for rapid use on smartphones and tablets.

## 🛠️ Technology Stack

- **Framework**: [Next.js 14](https://nextjs.org/) (App Router)
- **Language**: JavaScript (ES6+)
- **Styling**: Vanilla CSS with modern Design Tokens & Lucide Icons
- **Database**: [MongoDB](https://www.mongodb.com/) via Mongoose ODM
- **Exports**: [SheetJS (XLSX)](https://sheetjs.com/) & [jsPDF](https://parall.ax/products/jspdf)
- **Deployment**: Optimized for Vercel/Node.js environments

## 📦 Installation & Setup

1. **Clone the repository**:
   ```bash
   git clone https://github.com/halloitsrizvan/attendance.git
   cd attendance
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure Environment**:
   Create a `.env` file in the root directory:
   ```env
   MONGODB_URI=your_mongodb_connection_string
   JWT_SECRET=your_secure_secret
   API_PORT=http://localhost:3000/api
   ```

4. **Launch Development Server**:
   ```bash
   npm run dev
   ```
   The application will be available at `http://localhost:3000`.

## 📁 Project Structure

- `/app`: Next.js App Router (Pages & API Routes)
- `/components`: High-fidelity React components (Atomic selection)
- `/models`: Mongoose Schemas for Students, Teachers, Attendance, and Leaves
- `/public`: Branded assets and icons
- `/lib`: Database connection and shared utility functions

## 📄 License

This project is licensed under the ISC License.

---
*Built with precision for BrightPath Institutions.*