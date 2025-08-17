import mongoose from "mongoose";

const messageSchema = new mongoose.Schema({
    senderId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    receiverId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    text: {
        type: String,
        required: function() {
            return !this.image && !this.file && !this.audio && !this.video; // Text is required only if no media is provided
        }
    },
    image: {
        type: String,
        default: null
    },
    file: {
        url: String,
        name: String,
        size: Number,
        type: String
    },
    audio: {
        url: String,
        duration: Number
    },
    video: {
        url: String,
        duration: Number,
        thumbnail: String
    },
    messageType: {
        type: String,
        enum: ['text', 'image', 'file', 'audio', 'video', 'location', 'contact'],
        default: 'text'
    },
    seen: {
        type: Boolean,
        default: false
    },
    seenAt: Date,
    delivered: {
        type: Boolean,
        default: false
    },
    deliveredAt: Date,
    // Advanced message features
    isEdited: {
        type: Boolean,
        default: false
    },
    editedAt: Date,
    isDeleted: {
        type: Boolean,
        default: false
    },
    deletedAt: Date,
    // Message reactions
    reactions: [{
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User"
        },
        emoji: String,
        reactedAt: {
            type: Date,
            default: Date.now
        }
    }],
    // Reply functionality
    replyTo: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Message"
    },
    // Forward functionality
    isForwarded: {
        type: Boolean,
        default: false
    },
    originalSender: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    },
    // Location data
    location: {
        latitude: Number,
        longitude: Number,
        address: String
    },
    // Contact data
    contact: {
        name: String,
        phone: String,
        email: String
    },
    // Message priority
    priority: {
        type: String,
        enum: ['low', 'normal', 'high', 'urgent'],
        default: 'normal'
    },
    // Message encryption
    isEncrypted: {
        type: Boolean,
        default: false
    },
    encryptionKey: String
}, {timestamps: true});

// Add validation to ensure at least one content type is provided
messageSchema.pre('save', function(next) {
    if (!this.text && !this.image && !this.file && !this.audio && !this.video && !this.location && !this.contact) {
        return next(new Error('Message must contain at least one content type'));
    }
    next();
});

// Index for better query performance
messageSchema.index({ senderId: 1, receiverId: 1, createdAt: -1 });
messageSchema.index({ receiverId: 1, seen: 1 });

const Message = mongoose.model("Message", messageSchema);
export default Message;