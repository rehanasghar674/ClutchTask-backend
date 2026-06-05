import mongoose from "mongoose";
import dotenv from 'dotenv' 
dotenv.config() 


let isConnected = false;

export async function connectDB() {
  if (isConnected) {
    console.log('Using existing connection');
    return;
  }
  
  try {
    const db = await mongoose.connect(process.env.MONGODB_URI);
    isConnected = db.connections[0].readyState === 1;
    console.log('MongoDB connected');
  } catch (error) {
    console.error('MongoDB connection error:', error);
  }
}

// export const connectDB = async () => {
//   try {
//     const conn = await mongoose.connect(process.env.MONGO_URI, {
//       useNewUrlParser: true,
//       useUnifiedTopology: true,
//     });
//     if (conn) {
//       console.log(`mongodb connected at ${conn.connection.host}`);
//     }
//   } catch (error) {
//     console.log(error.message);
//   }
// };
