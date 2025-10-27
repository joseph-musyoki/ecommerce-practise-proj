import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema({
    name:{
        type:String,
        required:true,
    },
    email:{
        type:String,
        required:true,
        lowercase:true,
        trim:true
    },
    password:{
        type:String,
        required:true,
        minlength:[6,"password must be six characters and above"]
    },
    cart:[
        {
            quantity:{
                type:Number,
                default:1,
            },
            product:{
                type:mongoose.Schema.Types.ObjectId,
                ref:"Product"
            }
        }
    ],
    role:{
        type:String,
        enum:["customer","admin"],
        default:"customer"
    }
},{timestamps:true});

userSchema.pre("save", async function (next){
    if(!this.isModified("password"))
        return next()
    try {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password,salt);

    } catch (error) {
       next(error) 
    }
    next()
})
userSchema.methods.comparePassword = async function (password) {
    return bcrypt.compare(password, this.password);
};
export const User = mongoose.model("User",userSchema);
