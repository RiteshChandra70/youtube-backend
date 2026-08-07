const mongoose = require('mongoose')

const userSchema = new mongoose.Schema({
    channelName:{
        type:String,
        required:true
    },
    email:{
        type:String,
        required:true,
        unique:true
    },
    password:{
        type:String,
        required:true
    },
    profilePicUrl:{
        type:String,
        default:""
    },
    profilePicId:{
        type:String,
        default:""
    },
    coverPicUrl:{
        type:String,
        default:""
    },
    coverPicId:{
        type:String,
        default:"" 
    },
    description:{
        type:String,
        required:true
    },
    subscribers:[
        {
        type:mongoose.Schema.Types.ObjectId,
        ref:"User"
        }
    ],
    subscribedTo:[
        {
        type:mongoose.Schema.Types.ObjectId,
        ref:"User"
        }
    ]
},{
    timestamps:true
})

module.exports = mongoose.model('User',userSchema)