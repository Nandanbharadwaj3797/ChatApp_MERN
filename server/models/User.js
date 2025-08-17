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
},
  // Advanced user management fields
  isAdmin: {
    type: Boolean,
    default: false
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  isBanned: {
    type: Boolean,
    default: false
  },
  banReason: String,
  bannedAt: Date,
  bannedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  },
  // User relationship fields
  blockedUsers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  }],
  mutedUsers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  }],
  pinnedUsers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  }],
  archivedUsers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  }],
  starredUsers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  }],
  hiddenUsers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  }],
  // Chat management fields
  mutedChats: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  }],
  blockedChats: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  }],
  pinnedChats: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  }],
  archivedChats: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  }],
  starredChats: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  }],
  hiddenChats: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  }],
  // Voice management fields
  mutedVoiceUsers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  }],
  blockedVoiceUsers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  }],
  // Report fields
  reports: [{
    reportedUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    },
    reason: String,
    description: String,
    reportedAt: {
      type: Date,
      default: Date.now
    }
  }],
  chatReports: [{
    reportedUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    },
    reason: String,
    description: String,
    reportedAt: {
      type: Date,
      default: Date.now
    }
  }],
  // Chat verification fields
  isChatVerified: {
    type: Boolean,
    default: false
  },
  isChatBanned: {
    type: Boolean,
    default: false
  },
  chatBanReason: String,
  chatBannedAt: Date,
  chatBannedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  }
},{timestamps: true})

const User = mongoose.model("User", userSchema);
export default User;
