import { User } from "./user.model.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
dotenv.config();

export const createSingleAdmin = async (req, res) => {
  try {
    const hashedPassword = await bcrypt.hash(process.env.ADMIN_PASSWORD, 10);

    const isAdmin = await User.findOne({ role: "admin" }).select("-password");
    if (!isAdmin) {
      const admin = User.create({
        name: "admin",
        email: process.env.ADMIN_EMAIL,
        password: hashedPassword,
        role: "admin",
      });
    } else {
      console.log("admin already exists");
    }
  } catch (error) {
    console.log(error.message);
    return res.json({
      status: false,
      message: `internal server error: ${error.message}`,
    });
  }
};

export const userRegister = async (req, res) => {
  try {
    const { name, email, password } = req.body || {};

    if (!name || !email || !password) {
      return res.json({
        status: false,
        message: "all fields are required",
      });
    }

    const isEmail = await User.findOne({
      email: email,
    });

    if (isEmail) {
      return res.json({
        status: false,
        message: "email is already exists",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = User.create({
      name: name,
      email: email,
      password: hashedPassword,
      role: "user",
    });

    user.password = undefined

    if (user) {
      return res.json({
        status: true,
        message: "user registered successfully",
        user
      });
    } else {
      return res.json({
        status: false,
        message: "failed to register user",
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

export const userLogin = async (req, res) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) {
      return res.json({
        status: false,
        message: "email & password are required fields",
      });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.json({
        status: false,
        message: "email not found",
      });
    }

    const isPassword = await bcrypt.compare(password, user.password);
    if (!isPassword) {
      return res.json({
        status: false,
        message: "password is incorrect",
      });
    }

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET_KEY,
      {
        expiresIn: "7d",
      },
    );

     user.password = undefined

    if(token) {
      return res.json({
      status: true,
      message : 'user login successfully',
      user,
      token,
    });
    } else {
        return res.json({
      status: false,
      message : 'failed to login user',
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

export const getUsers = async (req, res) => {
  try {
    if (req.user.role === "admin") {
      const users = await User.find().select("-password");
      if (users) {
        return res.json({
          status: true,
          users,
        });
      } else {
        return res.json({
          status: true,
          message: "users not found",
        });
      }
    } else {
      return res.json({
        status: true,
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

export const getUserByAdmin = async (req, res) => {
  try {
    const { userId } = req.params;

    if (req.user.role === "admin") {
      const user = await User.findById(userId).select("-password");
      if (user) {
        return res.json({
          status: true,
          user,
        });
      } else {
        return res.json({
          status: true,
          message: "user not found",
        });
      }
    } 
  } catch (error) {
    console.log(error.message);
    return res.json({
      status: false,
      message: `internal server error: ${error.message}`,
    });
  }
};

export const getUser = async (req, res) => {
  try {
      const user = await User.findOne({_id : req.user.id}).select("-password");
      if (user) {
        return res.json({
          status: true,
          user,
        });
      } else {
        return res.json({
          status: false,
          message: "user not found",
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

export const updateUserProfile = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.json({
        status: false,
        message: "all fields are required",
      });
    }

    const isEmail = await User.findOne({ email: email, _id : {$ne : req.user.id} }).select("-password");
    if (isEmail) {
      return res.json({
        status: false,
        message: "email is already exists",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    if (req.user.role === "user") {
      const updateUserProfile = await User.findByIdAndUpdate(
        req.user.id,
        {
          ...req.body,
          password: hashedPassword,
        },
        { new: true },
      ).select("-password");

      if (updateUserProfile) {
        return res.json({
          status: true,
          message: "user profile updated successfully",
          updateUserProfile,
        });
      } else {
        return res.json({
          status: true,
          message: "failed to update user profile",
        });
      }
    }
  } catch (error) {
    console.log(error.message);
    return res.json({
      status: false,
      message: `internal server error: ${error.message}`,
    });
  }
};
