import mongoose from "mongoose";

const taskSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      default: "",
    },
    status: {
      type: String,
      enum: ["to-do", "in-progress", "done"],
      default: "to-do",
    },
    dueDate: {
      type: Date,
      default : () => new Date()
    },
    priority : {
      type : String,
      enum: ["low", "medium", "high"],
      default: "low",
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      immutable: true,
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  { timestamps: true },
);

taskSchema.index({ status: 1, createdBy: 1, assignedTo: 1 });

taskSchema.index({ createdAt: -1 });

taskSchema.index({ title: "text", description: "text" });

export const Task = mongoose.model("Task", taskSchema);
