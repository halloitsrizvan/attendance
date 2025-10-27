require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const core = require('cors')

const classesRoutes = require('./routes/classes');
const techersRoutes = require('./routes/teachers')
const studentsRoutes = require('./routes/students')
const attendanceRoutes = require('./routes/attendance')

const app = express();
const port = process.env.PORT || 4000;

//middleware
app.use(express.json());
app.use(core()) 

app.use((req,res,next)=>{
    console.log(req.method,req.path);
    next(); 
})

//Routes    
app.use('/classes',classesRoutes);
app.use('/teachers',techersRoutes);
app.use('/students',studentsRoutes)
app.use('/set-attendance',attendanceRoutes)
// Attendance Time

//connect to db
mongoose.connect(process.env.MONGO_URI)
    .then(()=>{
        app.listen(port, () => {
            console.log(`Database connected and Server is running on port ${port}`);
        });
    })
    .catch((err)=>{
        console.log(err);
    })

