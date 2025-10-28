import express from "express";
import cors from 'cors'
import dotenv from 'dotenv'
import ideaRouter from './routes/ideaRoutes.js'
import { errorHandler } from "./middleware/errorHandler.js";
import connectDb from "./config/db.js";

dotenv.config();

const app = express()
const PORT = process.env.PORT || 5000

connectDb();
app.use(cors());
app.use(express.json())
app.use(express.urlencoded({extended:true}))
app.use('/api/ideas', ideaRouter)
app.use((req, res, next) => {
    const error =  new Error(`Not Found - ${req.originalUrl}`)
    res.status='404'
    next(error)
})
app.use(errorHandler)


app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`)
})
