import express from "express";
import {
  allTasks,
  createTask,
  deleteTaskByAdmin,
  deleteTaskByUser,
  getTaskByAdmin,
  getTaskByUser,
  getTasksByUser,
  updateTaskByAdmin,
  updateTaskByUser,
  // deleteAllTasksByAdmin,
} from "./task.controller.js";
import { auth, isAdmin, isUser } from "../../middleware/auth.js";

export const taskRouter = express.Router();

taskRouter.post("/task/create", auth, createTask);

taskRouter.get("/admin/tasks", auth, isAdmin, allTasks);

taskRouter.put("/admin/task/update/:taskId", auth, isAdmin, updateTaskByAdmin);

taskRouter.put("/user/task/update/:taskId", auth, isUser, updateTaskByUser);

taskRouter.get("/admin/task/get/:taskId", auth, isAdmin, getTaskByAdmin);

taskRouter.get("/user/tasks/get", auth, isUser, getTasksByUser);

taskRouter.get("/user/task/get/:taskId", auth, isUser, getTaskByUser);

taskRouter.delete(
  "/admin/task/delete/:taskId",
  auth,
  isAdmin,
  deleteTaskByAdmin,
);

taskRouter.delete("/user/task/delete/:taskId", auth, isUser, deleteTaskByUser)
