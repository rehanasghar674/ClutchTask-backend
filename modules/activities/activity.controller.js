import { Activity } from "./activity.model.js";

export const addActivity = async (
  taskId,
  message,
  userId,
  type,
  oldValue = null,
  newValue = null,
) => {
  try {
    await Activity.create({
      taskId: taskId,
      message: message,
      userId: userId,
      type: type,
      oldValue : oldValue,
      newValue : newValue,
    });
  } catch (error) {
    console.log(error.message);
  }
};

export const getTaskActivities = async (taskId) => {
  try {
    return await Activity.find({ taskId: taskId})
      .sort({ createdAt: -1 })
      .populate("taskId")
      .populate("userId", 'name email')
  } catch (error) {
    console.log(error.message);
  }
}

export const getTaskActivitiesByUser = async (taskId, userId) => {
  try {
    return await Activity.find({ taskId: taskId, userId: userId})
      .sort({ createdAt: -1 })
      .populate("taskId")
      .populate("userId", 'name email')
  } catch (error) {
    console.log(error.message);
  }
}

export const deleteTaskActivities = async (taskId) => {
  try {
    return await Activity.deleteMany({ taskId: taskId });
  } catch (error) {
    console.log(error.message);
  }
};
