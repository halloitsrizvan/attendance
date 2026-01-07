# Attendance Management System

## Description

A full-stack web application designed for managing attendance, leave requests, and related data in an educational institution. It provides separate portals for teachers and students, enabling efficient tracking and reporting of attendance records.

## Features

- **User Authentication**: Secure login for teachers and students using JWT tokens
- **Attendance Tracking**: Record and manage daily attendance for students
- **Leave Management**: Handle regular leave and short leave requests
- **Class-wise Reports**: Generate reports based on classes
- **Student Portal**: Students can view their attendance and apply for leave
- **Minus Reports**: Track and report attendance deductions
- **Daily Reports**: Generate daily attendance summaries
- **PDF and Excel Export**: Export reports in PDF and Excel formats

## Technologies Used

### Backend
- **Node.js**: Runtime environment
- **Express.js**: Web framework
- **MongoDB**: Database (via Mongoose ODM)
- **JWT**: JSON Web Tokens for authentication
- **bcrypt**: Password hashing
- **CORS**: Cross-origin resource sharing

### Frontend
- **React**: UI library
- **React Router**: Client-side routing
- **Axios**: HTTP client for API calls
- **jsPDF**: PDF generation
- **jsPDF-AutoTable**: Table generation in PDFs
- **xlsx**: Excel file handling
- **Lucide React**: Icon library
- **React Icons**: Additional icons

## Installation

1. **Clone the repository**:
   ```bash
   git clone <repository-url>
   cd attendance
   ```

2. **Install backend dependencies**:
   ```bash
   cd backend
   npm install
   ```

3. **Install frontend dependencies**:
   ```bash
   cd ../frontend
   npm install
   ```

4. **Set up environment variables**:
   - Create a `.env` file in the `backend/` directory with the following variables:
     ```
     MONGO_URI=your_mongodb_connection_string
     JWT_SECRET=your_jwt_secret
     PORT=4000
     ```

5. **Start the backend server**:
   ```bash
   cd backend
   npm start
   ```
   The server will run on `http://localhost:4000` (or the port specified in `.env`).

6. **Start the frontend application**:
   ```bash
   cd ../frontend
   npm start
   ```
   The app will be available at `http://localhost:3000`.

## Usage

- **Teacher Portal**: Log in as a teacher to manage classes, record attendance, view reports, and handle leave requests.
- **Student Portal**: Students can log in to view their attendance records, apply for leave, and check their status.
- **Reports**: Generate and export various reports including daily attendance, class-wise summaries, and minus reports.

## API Endpoints

The backend provides the following main API routes:

- `/classes`: Manage class information
- `/teachers`: Teacher-related operations
- `/students`: Student management
- `/set-attendance`: Attendance recording
- `/leave`: Leave request management
- `/minus`: Minus/deduction tracking
- `/class-excused-pass`: Short leave handling

## Project Structure

```
attendance/
├── backend/
│   ├── config/
│   ├── controllers/
│   ├── migrations/
│   ├── models/
│   ├── routes/
│   ├── utils/
│   ├── package.json
│   └── server.js
└── frontend/
    ├── public/
    ├── src/
    │   ├── components/
    │   ├── pages/
    │   └── ...
    ├── package.json
    └── README.md
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the ISC License.