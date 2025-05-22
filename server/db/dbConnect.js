import mongoose from "mongoose";

const dbConnection = async()=>{
    try {
        await mongoose.connect(process.env.MONGOOSE_URL);
        console.log('Database is connected');
    } catch (error) {
        console.log(error);
    }
}

export default dbConnection;