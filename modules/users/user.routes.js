import express from "express";
import {
  getUsers,
  getUser,
  userLogin,
  userRegister,
  updateUserProfile,
  getUserByAdmin,
} from "./user.controller.js";
import { auth, isAdmin, isUser } from "../../middleware/auth.js";

export const userRouter = express.Router();

userRouter.post("/user/register", userRegister);
userRouter.post("/user/login", userLogin);
userRouter.get("/users", auth, isAdmin, getUsers);
userRouter.get("/users/:userId", auth, isAdmin, getUserByAdmin);
userRouter.get("/user", auth, getUser);
userRouter.put("/users/profile/update", auth, isUser, updateUserProfile);
