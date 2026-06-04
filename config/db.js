import mongoose from "mongoose";
import dotenv from 'dotenv' 
dotenv.config() 

export const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    if (conn) {
      console.log(`mongodb connected at ${conn.connection.host}`);
    }
  } catch (error) {
    console.log(error.message);
  }
};
