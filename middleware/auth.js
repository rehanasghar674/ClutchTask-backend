import jwt from "jsonwebtoken";
import dotenv from "dotenv";
dotenv.config();

export const auth = (req, res, next) => {
  try {
    const authHeader =
      req.headers.authorization || req.headers["authorization"];
    if (!authHeader) {
      return res.json({
        status: false,
        message: "no authorization provided",
      });
    }

    const token = authHeader.split(" ")[1];
    if (!token) {
      return res.json({
        status: false,
        message: "no token found",
      });
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);

    req.user = decoded;

    next();
  } catch (error) {
    console.log(error.message);
    return res.json({
      status: false,
      message: `internal server error: ${error.message}`,
    });
  }
};

export const isUser = (req, res, next) => {
  if (req.user.role != "user") {
    return res.json({
      status: true,
      message: "user role not found",
    });
  }

  if (req.user.role == "user") {
    next();
  }
} 

export const isAdmin = (req, res, next) => {
   if(req.user.role != 'admin') {
      return res.json({
      status: true,
      message: 'admin role not found'
    });
   } 

   if(req.user.role == 'admin') {
      next() 
   }
};