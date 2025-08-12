import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  email:{
    type: String,
    required: true,
    unique: true,
    validate: {
            validator: function (emailValue) {
                return /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(emailValue);
            },
            message: 'Invalid email format'
        }
  },
  fullName:{
    type: String,
    required: true
  },
    password:{
    type: String,
    required: true,
    minlength: 6
  },
    profilePicture: {
    type: String,
    default:""
},
    bio: {
    type: String
}},{timestamps: true})

const User = mongoose.model("User", userSchema);
export default User;
