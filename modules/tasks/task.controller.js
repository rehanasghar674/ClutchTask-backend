import { Task } from "./task.model.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import {
  addActivity,
  getTaskActivities,
  deleteTaskActivities,
} from "../activities/activity.controller.js";
import { User } from "../users/user.model.js";
dotenv.config();

export const createTask = async (req, res) => {
  try {
    const { title, description, assignedTo, status, dueDate, priority } =
      req.body;

    if (!title) {
      return res.json({
        status: false,
        message: "all fields are required",
      });
    }

    if (dueDate) {
      const selectedDate = new Date(dueDate);
      selectedDate.setHours(0, 0, 0, 0);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (selectedDate < today) {
        return res.json({
          status: false,
          message: "due date can't be in the past",
        });
      }
    }

    const taskData = await Task.create({
      title: title,
      description: description,
      status: status || "to-do",
      dueDate: dueDate || undefined,
      priority: priority || "low",
      createdBy: req.user.id,
      assignedTo:
        req?.user?.role === "admin"
          ? assignedTo || null || req.user.id
          : req.user.id,
    });

    let message = `Title "${title}" created`;
    if (status) message += ` with status: "${status}"`;
    if (priority) message += ` & with priority: ${priority}`;
    if (dueDate) message += ` & due on "${dueDate}"`;

    const taskActivity = await addActivity(
      taskData._id,
      message,
      req.user.id,
      "creation",
    );

    if (taskData) {
      return res.json({
        status: true,
        message: "task added successfully",
        taskData,
        taskActivity,
      });
    } else {
      return res.json({
        status: false,
        message: "failed to add task",
      });
    }
  } catch (error) {
    console.log(error.message);
    return res.json({
      status: false,
      message: `internal server error: ${error.message}`,
    });
  }
};

export const allTasks = async (req, res) => {
  try {
    const {
      search,
      status,
      sortBy,
      sortOrder,
      page = 1,
      limit = 6,
    } = req.query;

    let filter = {};

    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
      ];
    }

    if (status) {
      filter.status = status;
    }

    let sort = {};
    if (sortBy) {
      sort[sortBy] = sortOrder === "desc" ? -1 : 1;
    } else {
      sort.createdAt = -1;
    }

    const currentPage = parseInt(page) || 1;
    const currentLimit = parseInt(limit) || 6;
    const skip = (currentPage - 1) * currentLimit;

    if (req.user.role === "admin") {
      const tasks = await Task.find(filter)
        .sort(sort)
        .limit(currentLimit)
        .skip(skip)
        .populate("createdBy", "name email")
        .populate("assignedTo", "name email");
      const totalTasks = await Task.countDocuments(filter);
      const allTasks = await Task.find();
      if (tasks) {
        return res.json({
          status: true,
          message: "all tasks data",
          tasks,
          totalTasks,
          currentPage,
          totalPages: Math.ceil(totalTasks / limit),
          allTasks,
        });
      } else {
        return res.json({
          status: false,
          message: "tasks not found",
          tasks,
        });
      }
    } else {
      return res.json({
        status: false,
        message: "access denied, only admin role required",
      });
    }
  } catch (error) {
    console.log(error.message);
    return res.json({
      status: false,
      message: `internal server error: ${error.message}`,
    });
  }
};

export const updateTaskByAdmin = async (req, res) => {
  try {
    const { taskId } = req.params;
    const { title, description, status, assignedTo, dueDate, priority } =
      req.body;
    if (!title) {
      return res.json({
        status: false,
        message: "title are required",
      });
    }

    const task = await Task.findById(taskId).populate("assignedTo", "name");
    if (!task) {
      return res.json({
        status: false,
        message: "task not found",
      });
    }

    const selectedDate = new Date(dueDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (dueDate && selectedDate < today) {
      return res.json({
        status: false,
        message: "due date can't be in the past",
      });
    }

    if (req.user.role === "admin") {
      const updatedTask = await Task.findByIdAndUpdate(
        taskId,
        {
          title: title,
          description: description,
          status: status || "to-do",
          priority: priority || "low",
          assignedTo: assignedTo || null,
          dueDate: selectedDate,
        },
        { returnDocument: "after" },
      );

      await updatedTask.populate("assignedTo", "name");

      const changes = [];

      // Simple trackChange function
      const trackChange = async (field, type, oldValue, newValue) => {
        let message = "";

        // Agar koi change nahi hai to return
        if (String(oldValue) === String(newValue)) return;

        // AssignedTo ke liye alag handling
        if (field === "assignedTo") {
          let oldName = oldValue?.name || "unassigned";
          let newName = newValue?.name || "unassigned";

          message = `assignedTo changed from ${oldName} to ${newName}`;
          oldValue = oldName;
          newValue = newName;
        }
        // Baki fields ke liye
        else {
          message = `${field} changed from ${oldValue || "not set"} to ${newValue || "not set"}`;
        }

        const activity = await addActivity(
          taskId,
          message,
          req.user.id,
          type,
          oldValue,
          newValue,
        );

        changes.push(activity);
      };

      (trackChange("title", "title_change", task.title, updatedTask.title),
        trackChange(
          "description",
          "description_change",
          task.description,
          updatedTask.description,
        ));
      (trackChange("status", "status_change", task.status, updatedTask.status),
        trackChange(
          "priority",
          "priority_change",
          task.priority,
          updatedTask.priority,
        ));
      trackChange(
        "assignedTo",
        "assignedTo",
        task.assignedTo,
        updatedTask.assignedTo,
      );
      trackChange(
        "dueDate",
        "dueDate_change",
        task.dueDate,
        updatedTask.dueDate,
      );

      await Promise.all(changes);

      if (updatedTask) {
        return res.json({
          status: true,
          message: "task updated successfully",
          updatedTask,
          changes,
        });
      } else {
        return res.json({
          status: false,
          message: "failed to update task",
        });
      }
    } else {
      return res.json({
        status: false,
        message: "access denied, only admin role required",
      });
    }
  } catch (error) {
    console.log(error.message);
    return res.json({
      status: false,
      message: `internal server error: ${error.message}`,
    });
  }
};

export const updateTaskByUser = async (req, res) => {
  try {
    const { taskId } = req.params;
    const { title, description, status, dueDate, priority } = req.body;

    // 1. Task find karo
    const task = await Task.findById(taskId);
    if (!task) {
      return res.json({
        status: false,
        message: "Task not found",
      });
    }

    // 2. Permissions check karo
    const isOwner = task.createdBy.toString() === req.user.id;
    const isAssigned = task.assignedTo?.toString() === req.user.id;

    if (!isOwner && !isAssigned) {
      return res.json({
        status: false,
        message: "You don't have permission to update this task",
      });
    }

    // 3. Due date validation (only if dueDate is provided)
    if (dueDate) {
      const selectedDate = new Date(dueDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (selectedDate < today) {
        return res.json({
          status: false,
          message: "Due date can't be in the past",
        });
      }
    }

    let updateData = {};

    // 4. OWNER: Sab kuch update kar sakta hai
    if (isOwner) {
      if (title !== undefined) updateData.title = title;
      if (description !== undefined) updateData.description = description;
      if (status !== undefined) updateData.status = status;
      if (priority !== undefined) updateData.priority = priority;
      if (dueDate !== undefined) updateData.dueDate = dueDate;
    }
    
    // 5. ASSIGNED USER: Sirf status update kar sakta hai (sequence mein)
    else if (isAssigned && status) {
      // Check if status is same
      if (status === task.status) {
        return res.json({
          status: false,
          message: `Task is already ${task.status}`,
        });
      }
      
      // Check valid transitions
      let isValid = false;
      
      if (task.status === "to-do" && status === "in-progress") {
        isValid = true;
      } else if (task.status === "in-progress" && status === "done") {
        isValid = true;
      }
      
      if (!isValid) {
        let allowed = task.status === "to-do" ? "in-progress" : "done";
        return res.json({
          status: false,
          message: `Cannot change from ${task.status} to ${status}. Allowed: ${allowed}`,
        });
      }
      
      updateData.status = status;
    }

    // 6. Check if anything to update
    if (Object.keys(updateData).length === 0) {
      return res.json({
        status: false,
        message: "No changes to update",
      });
    }

    // 7. Update task
    const updatedTask = await Task.findByIdAndUpdate(
      taskId, 
      updateData, 
      { new: true }  // { returnDocument: "after" } ki jagah { new: true } simple hai
    ).populate("assignedTo", "name");

    // 8. Track changes (optional - simple version)
    const changes = [];
    
    if (isOwner) {
      if (title && title !== task.title) {
        changes.push({ field: "title", old: task.title, new: title });
      }
      if (description && description !== task.description) {
        changes.push({ field: "description", old: task.description, new: description });
      }
      if (status && status !== task.status) {
        changes.push({ field: "status", old: task.status, new: status });
      }
      if (priority && priority !== task.priority) {
        changes.push({ field: "priority", old: task.priority, new: priority });
      }
      if (dueDate && dueDate !== task.dueDate) {
        changes.push({ field: "dueDate", old: task.dueDate, new: dueDate });
      }
    } else if (isAssigned && status && status !== task.status) {
      changes.push({ field: "status", old: task.status, new: status });
    }

    // Optional: Save activities if you have addActivity function
    // for (const change of changes) {
    //   await addActivity(taskId, `${change.field} changed`, req.user.id, `${change.field}_change`, change.old, change.new);
    // }

    return res.json({
      status: true,
      message: "Task updated successfully",
      task: updatedTask,
      changes: changes,
    });

  } catch (error) {
    console.log(error.message);
    return res.json({
      status: false,
      message: `Server error: ${error.message}`,
    });
  }
};

export const getTaskByAdmin = async (req, res) => {
  try {
    const { taskId } = req.params;
    if (req.user.role === "admin") {
      const task = await Task.findById(taskId)
        .populate("createdBy", "name email")
        .populate("assignedTo", "name email");

      const taskActivities = await getTaskActivities(taskId);

      if (task) {
        return res.json({
          status: true,
          message: "single task data",
          task,
          taskActivities,
        });
      } else {
        return res.json({
          status: false,
          message: "task not found",
        });
      }
    } else {
      return res.json({
        status: false,
        message: "access denied, only admin role required",
      });
    }
  } catch (error) {
    console.log(error.message);
    return res.json({
      status: false,
      message: `internal server error: ${error.message}`,
    });
  }
};

export const getTasksByUser = async (req, res) => {
  try {
    const {
      search,
      status,
      sortBy,
      sortOrder,
      page = 1,
      limit = 6,
    } = req.query;

    let filter = { assignedTo: req.user.id };

    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
      ];
    }

    if (status) {
      filter.status = status;
    }

    let sort = {};
    if (sortBy) {
      sort[sortBy] = sortOrder === "desc" ? -1 : 1;
    } else {
      sort.createdAt = -1;
    }

    const currentPage = parseInt(page) || 1;
    const currentLimit = parseInt(limit) || 6;
    const skip = (currentPage - 1) * currentLimit;

    if (req.user.role === "user") {
      const tasks = await Task.find(filter)
        .sort(sort)
        .limit(currentLimit)
        .skip(skip)
        .populate("createdBy", "name email")
        .populate("assignedTo", "name email");

      const totalTasks = await Task.countDocuments(filter);
      const userAllTasks = await Task.find({ assignedTo: req.user.id });

      if (tasks) {
        return res.json({
          status: true,
          message: "single task data",
          tasks,
          totalTasks,
          currentPage,
          totalPages: Math.ceil(totalTasks / limit),
          userAllTasks,
        });
      } else {
        return res.json({
          status: false,
          message: "task not found",
        });
      }
    } else {
      return res.json({
        status: false,
        message: "access denied, only user role required",
      });
    }
  } catch (error) {
    console.log(error.message);
    return res.json({
      status: false,
      message: `internal server error: ${error.message}`,
    });
  }
};

export const getTaskByUser = async (req, res) => {
  try {
    const { taskId } = req.params;
    if (req.user.role === "user") {
      const task = await Task.findOne({ _id: taskId, assignedTo: req.user.id })
        .populate("createdBy", "name email")
        .populate("assignedTo", "name email");

      const taskActivities = await getTaskActivities(taskId);

      if (task) {
        return res.json({
          status: true,
          message: "single task data",
          task,
          taskActivities,
        });
      } else {
        return res.json({
          status: false,
          message: "task not found",
        });
      }
    } else {
      return res.json({
        status: false,
        message: "access denied, only user role required",
      });
    }
  } catch (error) {
    console.log(error.message);
    return res.json({
      status: false,
      message: `internal server error: ${error.message}`,
    });
  }
}

export const deleteTaskByAdmin = async (req, res) => {
  try {
    if (req.user.role === "admin") {
      const { taskId } = req.params;

      const task = await Task.findOne({ _id: taskId });

      if (!task) {
        return res.json({
          status: false,
          message: "no task found",
        });
      }

      await deleteTaskActivities(taskId);
      const deleteTask = await task.deleteOne({ _id: taskId });

      if (deleteTask) {
        return res.json({
          status: true,
          message: "single task deleted",
        });
      } else {
        return res.json({
          status: false,
          message: "no task deleted",
        });
      }
    }
  } catch (error) {
    return res.json({
      status: false,
      message: `internal server error: ${error.message}`,
    });
  }
};

export const deleteTaskByUser = async (req, res) => {
  try {
    if (req.user.role === "user") {
      const { taskId } = req.params;

      const task = await Task.findOne({ _id: taskId, createdBy: req.user.id });

      if (!task) {
        return res.json({
          status: false,
          message: "no task found",
        });
      }

      await deleteTaskActivities(taskId);
      const deleteTask = await task.deleteOne({ _id: taskId });
      if (deleteTask) {
        return res.json({
          status: true,
          message: "single task deleted",
        });
      } else {
        return res.json({
          status: false,
          message: "no task deleted",
        });
      }
    }
  } catch (error) {
    return res.json({
      status: false,
      message: `internal server error: ${error.message}`,
    });
  }
};
