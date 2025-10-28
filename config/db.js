import mongoose from "mongoose";
import dotenv from 'dotenv'
dotenv.config();


const connectDb = async () => {
    try {
        const connection = await mongoose.connect(process.env.MONGO_URI)
        console.log(`mongoDB connected: ${connection.connection.host}`)
    } catch (error) {
        console.error(`Error: ${error.message}`)
        process.exit(1)
    }
}


export default connectDb