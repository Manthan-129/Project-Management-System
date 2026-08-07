require('dotenv').config();
const mongoose = require('mongoose');

const connectDB= async ()=>{
    try{
        const mongoUri = process.env.MONGO_URL || process.env.MONGO_URI;
        if (!mongoUri) {
            throw new Error('MongoDB connection string (MONGO_URL or MONGO_URI) is missing in environment variables.');
        }
        await mongoose.connect(mongoUri, {
            maxPoolSize: 10,
            socketTimeoutMS: 45000,
            connectTimeoutMS: 10000,
        });
        mongoose.connection.on('error', (err) => {
            console.error('MongoDB connection error:', err);
        });
        mongoose.connection.on('disconnected', () => {
            console.warn('MongoDB disconnected. Attempting reconnect...');
        });
        console.log("MongoDB connected successfully!!");
    }catch(error){
        console.log("Error connecting to MongoDB: ", error);
        process.exit(1);
    }
}

module.exports= {connectDB};