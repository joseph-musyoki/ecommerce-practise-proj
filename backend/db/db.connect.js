import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();

export const connectDB = async()=>{
    try {
         const conn =await mongoose.connect(process.env.MONGO_URI);
        console.log(`MongoDB connected: ${conn.connection.host}`);
          
    } catch (error) {
       console.log("Database connection failed:", error);
       process.exit(1);
       
    }
}

//xn0954V6LVa9PVd4