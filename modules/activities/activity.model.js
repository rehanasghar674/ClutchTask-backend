import mongoose from "mongoose";

const activitySchema = new mongoose.Schema(
  {
    taskId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Task",
      required: true,
    },
    type : {
       type : String,
       enum : ['creation', 'title_change', 'description_change', 'status_change', 'priority_change', 'assignedTo', 'dueDate_change'],
       required: true,
    },
    message: {
      type: String,
      required: true,
    },
    oldValue : {
        type: mongoose.Schema.Types.Mixed,
    },
    newValue : {
        type: mongoose.Schema.Types.Mixed,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      immutable: true,
    },
  },
  { timestamps: true },
)

activitySchema.index({ createdAt: -1 });

export const Activity = mongoose.model("Activity", activitySchema);
