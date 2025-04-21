import mongoose from "mongoose";

const userModel = mongoose.Schema({
    fullname:{
        type: String,
        require: true
    },
    username: {
        type: String,
        require: true
    },
    email: {
        type: String,
        require: true
    },
    password:{
        type: String,
        require: true
    },
    gender: {
        type:String,
        require: true,
        enum: ['male','female']
    },
    profilepic:{
        type:String,
        default:""
    }
}, {timestamps:true})
const User = mongoose.model("User", userModel);
export default User;