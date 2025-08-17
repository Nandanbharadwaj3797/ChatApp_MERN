# 🚀 Advanced Real-Time Chat Application

A feature-rich, enterprise-level chat application built with the MERN stack (MongoDB, Express.js, React, Node.js) and Socket.IO for real-time communication.

## ✨ Features

### 🔐 **Authentication & Security**
- ✅ JWT-based authentication with secure token storage
- ✅ Password hashing using bcrypt
- ✅ Protected routes with middleware
- ✅ Session management
- ✅ Secure cookie handling

### 💬 **Core Chat Features**
- ✅ Real-time messaging with Socket.IO
- ✅ Text, image, file, audio, video messages
- ✅ Location sharing with geolocation
- ✅ Contact sharing
- ✅ Message reactions (emojis)
- ✅ Reply to messages
- ✅ Forward messages to other users
- ✅ Edit and delete messages
- ✅ Message search functionality
- ✅ Typing indicators
- ✅ Read receipts
- ✅ Message notifications
- ✅ Message encryption support

### 👥 **Advanced User Management**
- ✅ User blocking/unblocking
- ✅ User muting/unmuting
- ✅ User pinning/unpinning
- ✅ User archiving/unarchiving
- ✅ User starring/unstarring
- ✅ User hiding/unhiding
- ✅ Chat muting/unmuting
- ✅ Chat blocking/unblocking
- ✅ User reporting system
- ✅ Admin functions (verify, ban users)

### 📱 **Real-Time Features**
- ✅ Online/offline status indicators
- ✅ Real-time user status updates
- ✅ Live typing indicators
- ✅ Instant message delivery
- ✅ Real-time notifications
- ✅ User activity tracking
- ✅ Connection status monitoring

### 🎨 **UI/UX Features**
- ✅ Modern, responsive design
- ✅ Dark theme with glassmorphism
- ✅ Mobile-friendly interface
- ✅ Toast notifications
- ✅ Loading states
- ✅ Error handling
- ✅ Smooth animations
- ✅ Hover effects and transitions

### 🗄️ **Database Features**
- ✅ MongoDB with Mongoose ODM
- ✅ Advanced User schema with relationship fields
- ✅ Enhanced Message schema with media support
- ✅ Proper indexing for performance
- ✅ Data validation and sanitization
- ✅ Efficient querying

### 🔌 **Technical Features**
- ✅ React 18 with hooks
- ✅ Context API for state management
- ✅ Custom hooks and utilities
- ✅ Performance optimizations
- ✅ Error boundaries
- ✅ Modern ES6+ syntax
- ✅ Modular architecture

## 🛠️ Tech Stack

### Frontend
- **React 18** - Modern React with hooks
- **Vite** - Fast build tool
- **Tailwind CSS** - Utility-first CSS framework
- **Socket.IO Client** - Real-time communication
- **React Router** - Client-side routing
- **React Hot Toast** - Toast notifications

### Backend
- **Node.js** - JavaScript runtime
- **Express.js** - Web framework
- **Socket.IO** - Real-time communication
- **MongoDB** - NoSQL database
- **Mongoose** - MongoDB ODM
- **JWT** - Authentication tokens
- **bcrypt** - Password hashing
- **Cloudinary** - Media file storage

### Development Tools
- **ESLint** - Code linting
- **Prettier** - Code formatting
- **Nodemon** - Development server

## 📋 Prerequisites

Before running this application, make sure you have:

- **Node.js** (v16 or higher)
- **MongoDB** (local or cloud instance)
- **npm** or **yarn** package manager
- **Cloudinary account** (for media uploads)

## 🚀 Installation & Setup

### 1. Clone the Repository
```bash
git clone <repository-url>
cd Chat-App
```

### 2. Install Dependencies

#### Backend
```bash
cd server
npm install
```

#### Frontend
```bash
cd client
npm install
```

### 3. Environment Configuration

#### Backend (.env)
Create a `.env` file in the `server` directory:

```env
# Server Configuration
PORT=5000
NODE_ENV=development

# Database Configuration
MONGODB_URI=mongodb://localhost:27017/chat-app
# or for MongoDB Atlas: mongodb+srv://username:password@cluster.mongodb.net/chat-app

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-here
JWT_EXPIRE=30d

# Cloudinary Configuration
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

# CORS Configuration
CORS_ORIGIN=http://localhost:5173
```

#### Frontend (.env)
Create a `.env` file in the `client` directory:

```env
VITE_BACKEND_URL=http://localhost:5000
```

### 4. Database Setup

#### Local MongoDB
```bash
# Start MongoDB service
mongod

# Or using Docker
docker run -d -p 27017:27017 --name mongodb mongo:latest
```

#### MongoDB Atlas
1. Create a MongoDB Atlas account
2. Create a new cluster
3. Get your connection string
4. Update the `MONGODB_URI` in your `.env` file

### 5. Cloudinary Setup
1. Create a Cloudinary account
2. Get your cloud name, API key, and API secret
3. Update the Cloudinary configuration in your `.env` file

## 🚀 Running the Application

### 1. Start the Backend Server
```bash
cd server
npm start
# or for development with auto-restart
npm run dev
```

The server will start on `http://localhost:5000`

### 2. Start the Frontend Development Server
```bash
cd client
npm run dev
```

The application will open at `http://localhost:5173`

### 3. Access the Application
Open your browser and navigate to `http://localhost:5173`

## 📱 Usage Guide

### 1. **User Registration & Login**
- Navigate to the login page
- Click "Sign up" to create a new account
- Fill in your details (name, email, password, bio)
- Upload a profile picture (optional)
- Click "Create Account"

### 2. **Starting a Chat**
- After login, you'll see the main chat interface
- Select a user from the left sidebar
- Start typing your message
- Press Enter or click the send button

### 3. **Advanced Message Features**
- **Reply**: Hover over a message and click "Reply"
- **Forward**: Hover over a message and click "Forward"
- **Edit**: Hover over your message and click "Edit"
- **Delete**: Hover over your message and click "Delete"
- **React**: Use emoji reactions on messages

### 4. **Media Sharing**
- **Images**: Click the gallery icon to send images
- **Files**: Click the paperclip icon to send files
- **Videos**: Click the video icon to send videos
- **Location**: Click the location icon to share your location
- **Contact**: Click the user icon to share contact information

### 5. **User Management**
- **Block/Unblock**: Right sidebar → User Management → Block
- **Mute/Unmute**: Right sidebar → User Management → Mute
- **Pin/Unpin**: Right sidebar → User Management → Pin
- **Report**: Right sidebar → Report Actions → Report User

### 6. **Search & Navigation**
- Use the search bar to find specific messages
- Navigate between different users in the sidebar
- Use the profile page to update your information

## 🔧 API Endpoints

### Authentication
- `POST /api/auth/signup` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/check` - Check authentication status
- `PUT /api/auth/update-profile` - Update user profile

### User Management
- `PUT /api/auth/block/:targetUserId` - Block/unblock user
- `PUT /api/auth/mute/:targetUserId` - Mute/unmute user
- `PUT /api/auth/pin/:targetUserId` - Pin/unpin user
- `POST /api/auth/report/:targetUserId` - Report user

### Messages
- `GET /api/messages/users` - Get all users for sidebar
- `GET /api/messages/:id` - Get messages with a user
- `POST /api/messages/send/:id` - Send a message
- `PUT /api/messages/edit/:id` - Edit a message
- `DELETE /api/messages/delete/:id` - Delete a message
- `POST /api/messages/react/:id` - React to a message

## 🎯 Key Features Explained

### 1. **Real-Time Communication**
The application uses Socket.IO for real-time features:
- Instant message delivery
- Live typing indicators
- Online/offline status updates
- Real-time notifications

### 2. **Message Types**
Support for various message types:
- **Text**: Standard text messages
- **Image**: Image files with preview
- **File**: Document sharing with file info
- **Audio**: Voice messages
- **Video**: Video files with thumbnails
- **Location**: GPS coordinates with address
- **Contact**: Contact information sharing

### 3. **User Relationships**
Advanced user management system:
- **Blocking**: Prevent communication with blocked users
- **Muting**: Silence notifications from muted users
- **Pinning**: Keep important users at the top
- **Archiving**: Hide users without deleting conversations
- **Starring**: Mark favorite users
- **Hiding**: Conceal users from the main list

### 4. **Security Features**
Enterprise-level security:
- JWT token authentication
- Password hashing with bcrypt
- Protected API endpoints
- Input validation and sanitization
- Secure file uploads

### 5. **Performance Optimizations**
Built for scalability:
- Efficient database queries
- Proper indexing
- Optimized Socket.IO connections
- Lazy loading for images
- Debounced typing indicators

## 🐛 Troubleshooting

### Common Issues

#### 1. **Socket Connection Failed**
- Check if the backend server is running
- Verify the backend URL in frontend `.env`
- Check CORS configuration
- Ensure firewall isn't blocking connections

#### 2. **Database Connection Error**
- Verify MongoDB is running
- Check the connection string in `.env`
- Ensure network connectivity
- Check MongoDB authentication

#### 3. **File Upload Issues**
- Verify Cloudinary credentials
- Check file size limits
- Ensure proper file formats
- Check network connectivity

#### 4. **Authentication Problems**
- Clear browser storage
- Check JWT secret configuration
- Verify token expiration settings
- Check cookie settings

### Debug Mode
Enable debug logging by setting `NODE_ENV=development` in your backend `.env` file.

## 🚀 Deployment

### Backend Deployment
1. Set `NODE_ENV=production` in your `.env`
2. Use a process manager like PM2
3. Set up environment variables on your hosting platform
4. Configure your domain and SSL certificates

### Frontend Deployment
1. Build the production version: `npm run build`
2. Deploy the `dist` folder to your hosting service
3. Configure environment variables
4. Set up proper routing for SPA

### Database Deployment
- Use MongoDB Atlas for cloud hosting
- Set up proper network access rules
- Configure backup and monitoring
- Set up proper indexes for production

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- React team for the amazing framework
- Socket.IO for real-time capabilities
- MongoDB for the database
- Tailwind CSS for the styling framework
- All contributors and supporters

## 📞 Support

If you encounter any issues or have questions:

1. Check the troubleshooting section
2. Search existing issues
3. Create a new issue with detailed information
4. Contact the development team

---

**Happy Chatting! 🎉**
