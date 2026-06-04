import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { connectDB } from "./config/db.js";
import { userRouter } from "./modules/users/user.routes.js";
import { taskRouter } from "./modules/tasks/task.routes.js";
import { createSingleAdmin } from "./modules/users/user.controller.js";
dotenv.config();

const app = express();

app.use(cors({
  origin: 'https://clutch-task-frontend.vercel.app',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use((req, res, next) => {
   console.log(`${req.method} - ${req.path}`) 
   next() 
})

app.get("/", (req, res) => {
  res.json({
    status: true,
    message: "server is running",
  });
});

app.use('/api', userRouter) 
app.use('/api', taskRouter)  

app.use((error, req, res, next) => {
  console.error(error.stack)
  res.json({
    status: false,
    message: error.message || 'internal server error',
  });
}); 

const PORT = parseInt(process.env.PORT) || 5000;

connectDB().then(() => { 
  createSingleAdmin()
}) 
