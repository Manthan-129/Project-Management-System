# Project Management System

A comprehensive, full-stack project management solution built with **React** (frontend) and **Node.js/Express** (backend). This system enables teams to collaborate efficiently on projects, manage tasks, handle team invitations, and track pull requests all in one place.

---

## 📋 Table of Contents

- [Project Overview](#project-overview)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Features](#features)
- [Installation & Setup](#installation--setup)
- [Configuration](#configuration)
- [API Endpoints](#api-endpoints)
- [Database Models](#database-models)
- [Key Components](#key-components)
- [How to Use](#how-to-use)

---

## 🎯 Project Overview

This Project Management System is a modern, scalable application designed to help teams and individuals organize their work more efficiently. It provides features like user authentication with two-factor authentication (2FA), team management, task tracking, pull request management, real-time notifications, and comprehensive user settings.

The application follows a **client-server architecture** with:
- **Frontend**: React-based single-page application (SPA) with responsive UI
- **Backend**: Express.js REST API with MongoDB database
- **Additional Services**: Cloudinary for image uploads, Nodemailer for emails, JWT for authentication

---

## 🛠️ Tech Stack

### Frontend (User Folder)
- **React 19.2.4** - Modern JavaScript library for building user interfaces
- **Vite 7.3.1** - Lightning-fast build tool and dev server
- **React Router DOM 7.13.1** - Client-side routing for single-page application
- **Tailwind CSS 4.2.1** - Utility-first CSS framework for styling
- **Framer Motion 12.38.0** - Animation library for smooth UI transitions
- **Axios 1.13.6** - HTTP client for API requests
- **React Hook Form 7.71.2** - Efficient form validation and management
- **React Toastify 11.0.5** - Toast notifications for user feedback
- **Lucide React 0.577.0** - Beautiful icon library

### Backend (Server Folder)
- **Express 5.2.1** - Lightweight web application framework
- **Node.js** - JavaScript runtime environment
- **MongoDB (Mongoose 9.3.0)** - NoSQL database for data storage
- **Bcrypt 6.0.0** - Password hashing and encryption
- **JWT (jsonwebtoken 9.0.3)** - Secure token-based authentication
- **Nodemailer 8.0.2** - Email sending capability
- **Cloudinary 2.9.0** - Cloud-based image management
- **Multer 2.1.1** - File upload middleware
- **CORS 2.8.6** - Cross-origin request handling
- **Morgan 1.10.1** - HTTP request logging
- **Validator 13.15.26** - Input validation library
- **Express Rate Limit 8.3.1** - API rate limiting for security
- **Dotenv 17.3.1** - Environment variable management

---

## 📁 Project Structure

```
Project-Management-System/
├── server/                          # Backend application
│   ├── configs/                     # Configuration files
│   │   ├── db.js                    # MongoDB connection setup
│   │   ├── cloudinary.js            # Cloudinary configuration for image uploads
│   │   └── nodemailer.js            # Email service configuration
│   ├── controllers/                 # Business logic handlers
│   │   ├── AuthControllers.js       # Authentication & user registration logic
│   │   ├── DashboardControllers/    # Dashboard-related operations
│   │   └── SettingsControllers/     # User settings operations
│   ├── middlewares/                 # Request processing middleware
│   │   ├── authMiddlewares.js       # JWT verification and authentication
│   │   └── multer.js                # File upload handling
│   ├── models/                      # MongoDB schemas (Data models)
│   │   ├── User.js                  # User profile and authentication data
│   │   ├── Team.js                  # Team/group information
│   │   ├── Task.js                  # Task/project item details
│   │   ├── Notification.js          # User notifications
│   │   ├── OTP.js                   # One-time password for email verification
│   │   ├── Invite.js                # User invitations
│   │   ├── TeamInvitation.js        # Team-specific invitations
│   │   └── PullRequest.js           # Pull request tracking
│   ├── routes/                      # API route definitions
│   │   ├── AuthRoutes.js            # Authentication endpoints
│   │   ├── SettingsRoutes.js        # User settings endpoints
│   │   └── DashboardRoutes/         # Dashboard-related routes
│   ├── utils/                       # Utility functions
│   │   ├── emailTemplates.js        # HTML email templates for various purposes
│   │   └── notificationService.js   # Notification handling logic
│   ├── package.json                 # Backend dependencies
│   ├── package-lock.json            # Lock file for dependency versions
│   ├── server.js                    # Main Express application entry point
│   └── practice.js                  # Practice/test file
│
├── user/                            # Frontend application (React)
│   ├── src/                         # Source code
│   │   ├── api/                     # API client modules for backend communication
│   │   ├── assets/                  # Static assets (images, fonts, etc.)
│   │   ├── components/              # Reusable React components
│   │   │   ├── DashboardComponents/ # Dashboard-specific UI components
│   │   │   ├── SettingComponents/   # Settings page components
│   │   │   └── Other components     # Shared/utility components
│   │   ├── context/                 # React Context API for global state management
│   │   ├── pages/                   # Full page components (routes)
│   │   │   ├── AuthPages/           # Login, signup, password reset pages
│   │   │   ├── DashboardPage.jsx    # Main dashboard layout
│   │   │   ├── SettingPage.jsx      # Settings layout
│   │   │   └── LandingPage.jsx      # Home page
│   │   ├── App.jsx                  # Main React component with routing
│   │   ├── main.jsx                 # React DOM render entry point
│   │   ├── App.css                  # Global application styles
│   │   └── index.css                # Root CSS with Tailwind imports
│   ├── public/                      # Static assets
│   │   └── vite.svg                 # Vite logo
│   ├── package.json                 # Frontend dependencies
│   ├── package-lock.json            # Lock file for dependency versions
│   ├── vite.config.js               # Vite build configuration
│   ├── postcss.config.js            # PostCSS configuration (Tailwind)
│   ├── eslint.config.js             # ESLint rules for code quality
│   ├── index.html                   # HTML entry point
│   └── .gitignore                   # Git ignore rules
│
├── .gitignore                       # Root level git ignore
└── README.md                        # This file
```

---

## ✨ Features

### 🔐 Authentication & Security
- **User Registration** with OTP email verification
- **Secure Login** with username or email
- **Two-Factor Authentication (2FA)** for enhanced security
- **Password Reset** with OTP verification
- **JWT-based Authentication** for secure API access
- **Password Hashing** using bcrypt for data protection
- **Protected Routes** - Only authenticated users can access certain pages

### 👥 User Management
- **User Profiles** with customizable information (first name, last name, profile picture)
- **Profile Editing** capabilities
- **User Search** to find and connect with other users
- **Account Activation/Deactivation**
- **Account Settings** including privacy, security, and integration options

### 👨‍💼 Team Management
- **Create Teams** - Start collaborative projects
- **Join Teams** - Accept team invitations
- **Team Invitations** - Send and manage team requests
- **Team Member Management** - Add/remove members
- **Team-specific Settings** - Configure team preferences
- **Teams List** - View all your active teams

### 📋 Task Management
- **Create Tasks** - Define new work items with descriptions
- **Task Assignment** - Assign tasks to team members
- **Task Status Tracking** - Monitor task progress (To-Do, In Progress, Completed)
- **Task Workspace Board** - Kanban-style task visualization
- **Task Updates** - Modify task details anytime

### 🔄 Pull Request Tracking
- **Create Pull Requests** - Propose code changes
- **Pull Request Management** - Track review status
- **Collaborative Review** - Comment and provide feedback
- **PR Status Updates** - Monitor approval process
- **Link PRs to Teams** - Organize PRs by team

### 🔔 Notifications
- **Real-time Notifications** - Get instant updates on important events
- **Notification Types**:
  - Team invitations
  - Task assignments
  - PR comments and approvals
  - Team member activities
- **Notification Preferences** - Customize what notifications you receive
- **Notification Management** - View and manage notification history

### ⚙️ Settings & Customization
- **Profile Settings** - Manage personal information
- **Account Settings** - Handle account credentials and preferences
- **Privacy Settings** - Control visibility and data sharing
- **Appearance Settings** - Customize theme and display options
- **Notification Settings** - Configure notification preferences
- **Security Settings** - Manage 2FA, sessions, and devices
- **Integration Settings** - Connect external services

### 📸 Image Management
- **Profile Picture Upload** - Upload via Cloudinary
- **Image Optimization** - Automatic image processing
- **Secure Upload** - Protected file upload with validation

### 📧 Email Communication
- **OTP Emails** - For verification during signup/login
- **2FA Emails** - Login verification codes
- **Password Reset Emails** - Secure password recovery links
- **Notification Emails** - Important event updates
- **HTML Email Templates** - Professional formatted emails

### 🌐 Dashboard
- **Dashboard Overview** - Quick summary of all activities
- **Friends List** - Manage connections with other users
- **Teams Overview** - See all your teams
- **Tasks Board** - Visual task management
- **Pull Requests View** - Track all your PRs
- **User Profiles** - View other users' profiles
- **Invitations Center** - Manage all pending invitations

---

## 📦 Installation & Setup

### Prerequisites
- **Node.js** (v14 or higher)
- **npm** (v6 or higher)
- **MongoDB** (local or cloud instance)
- **Cloudinary Account** (for image uploads)
- **Email Account** (for Nodemailer setup)
- **Git**

### Clone the Repository
```bash
git clone https://github.com/Manthan-129/Project-Management-System.git
cd Project-Management-System
```

### Backend Setup

1. **Navigate to server folder:**
   ```bash
   cd server
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Create a `.env` file** in the server folder with the following variables:
   ```env
   # Database
   MONGO_URL=mongodb://localhost:27017/project-management
   
   # JWT
   JWT_SECRET_KEY=your_secret_key_here
   
   # OTP Configuration
   OTP_PURPOSE_REGISTRATION=registration
   OTP_PURPOSE_LOGIN_2FA=login_2fa
   OTP_PURPOSE_FORGET_PASSWORD=forget_password
   
   # Email Configuration (Nodemailer)
   SENDER_EMAIL=your_email@gmail.com
   SENDER_PASSWORD=your_app_password
   
   # Cloudinary
   CLOUDINARY_NAME=your_cloudinary_name
   CLOUDINARY_API_KEY=your_api_key
   CLOUDINARY_API_SECRET=your_api_secret
   
   # Port
   PORT=5000
   ```

4. **Start the backend server:**
   ```bash
   npm run dev    # For development with nodemon
   # or
   npm start      # For production
   ```

   The server should run at `http://localhost:5000`

### Frontend Setup

1. **Navigate to user folder:**
   ```bash
   cd ../user
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Create a `.env` file** in the user folder:
   ```env
   VITE_API_URL=http://localhost:5000/api
   ```

4. **Start the development server:**
   ```bash
   npm run dev
   ```

   The frontend should run at `http://localhost:5173` (Vite default)

5. **Build for production:**
   ```bash
   npm run build
   ```

---

## ⚙️ Configuration

### MongoDB Connection
The application uses MongoDB for data persistence. Configure your MongoDB connection string in the `.env` file under `MONGO_URL`. You can use:
- **Local MongoDB**: `mongodb://localhost:27017/project-management`
- **MongoDB Atlas** (Cloud): `mongodb+srv://username:password@cluster.mongodb.net/project-management`

### JWT Configuration
- Set a strong `JWT_SECRET_KEY` in your `.env` file
- Tokens expire in **7 days** for regular authentication
- 2FA tokens expire in **10 minutes**

### Email Service (Nodemailer)
- Configure your email provider (Gmail, Outlook, etc.)
- For Gmail, use App Passwords instead of regular password
- Set `SENDER_EMAIL` and `SENDER_PASSWORD` in `.env`

### Cloudinary Setup
- Create a Cloudinary account at https://cloudinary.com
- Get your API credentials from the dashboard
- Add them to `.env`: `CLOUDINARY_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`

---

## 🔗 API Endpoints

### Authentication Endpoints (`/api/auth`)
- `POST /sendOTP` - Send registration OTP
- `POST /verifyOTP` - Verify registration OTP and create user
- `POST /login` - User login
- `POST /verify-2fa` - Verify two-factor authentication
- `GET /user-info` - Get current user information
- `POST /forget-password-otp` - Request password reset OTP
- `POST /verify-forget-password` - Reset password with OTP

### Settings Endpoints (`/api/settings`)
- Various endpoints for user settings, profile management, and preferences

### Team Endpoints (`/api/teams`)
- Create, read, update, delete operations for teams
- Team member management
- Team invitation handling

### Task Endpoints (`/api/tasks`)
- Create, read, update, delete tasks
- Task status management
- Task assignment operations

### Pull Request Endpoints (`/api/pull-requests`)
- Create and manage pull requests
- PR status tracking and comments

### Invite Endpoints (`/api/invites`)
- Manage user and team invitations
- Invitation acceptance/rejection

### Notification Endpoints (`/api/notifications`)
- Retrieve user notifications
- Mark notifications as read
- Delete notifications

---

## 🗄️ Database Models

### User Model
```javascript
{
  firstName: String,
  lastName: String,
  email: String (unique),
  username: String (unique),
  password: String (hashed),
  profilePicture: String (URL),
  twoFactorEnabled: Boolean,
  isActive: Boolean,
  createdAt: Date,
  deactivatedAt: Date
}
```

### Team Model
```javascript
{
  name: String,
  description: String,
  owner: ObjectId (references User),
  members: [ObjectId] (references Users),
  createdAt: Date
}
```

### Task Model
```javascript
{
  title: String,
  description: String,
  status: String (To-Do, In Progress, Completed),
  assignedTo: ObjectId (references User),
  team: ObjectId (references Team),
  dueDate: Date,
  createdAt: Date
}
```

### Notification Model
```javascript
{
  userId: ObjectId (references User),
  type: String,
  message: String,
  read: Boolean,
  createdAt: Date
}
```

### OTP Model
```javascript
{
  email: String,
  otp: String (hashed),
  purpose: String,
  expiresAt: Date,
  createdAt: Date
}
```

### PullRequest Model
```javascript
{
  title: String,
  description: String,
  status: String,
  author: ObjectId (references User),
  team: ObjectId (references Team),
  createdAt: Date
}
```

---

## 🎨 Key Components

### Frontend Components

#### Authentication Pages
- **LoginPage.jsx** - User login interface with email/username and password
- **SignupPage.jsx** - New user registration with OTP verification
- **ForgetPassword.jsx** - Password recovery workflow

#### Dashboard Components
- **DashboardOverview.jsx** - Main dashboard summary and quick stats
- **Friends.jsx** - User connections and friend management
- **Teams.jsx** - Team list and team creation
- **TeamDetails.jsx** - Team-specific information and member management
- **TaskWorkspaceBoard.jsx** - Kanban-style task board visualization
- **PullRequests.jsx** - Pull request list and management
- **Invitations.jsx** - Pending invitations center
- **UserProfile.jsx** - Public user profile viewing

#### Settings Components
- **ProfilePage.jsx** - User profile editing
- **AccountPage.jsx** - Account information and credentials
- **PrivacyPage.jsx** - Privacy settings and data sharing
- **AppearancePage.jsx** - Theme and display preferences
- **NotificationPage.jsx** - Notification preferences configuration
- **SecurityPage.jsx** - 2FA, password, and session management
- **IntegrationPage.jsx** - Third-party service integration

#### Shared Components
- **App.jsx** - Main router and route definitions
- Navigation components
- Form components with validation
- Modal and dialog components

### Backend Controllers

#### AuthControllers.js
Handles all authentication operations:
- **sendRegistrationOTP()** - Generate and send registration OTP
- **verifyRegistrationOTP()** - Verify OTP and create new user account
- **loginUser()** - Process user login with 2FA support
- **verifyLoginTwoFactor()** - Verify 2FA code
- **userInfo()** - Retrieve current user details
- **forgetPasswordOTPRequest()** - Initiate password recovery
- **verifyForgetPasswordOTPAndUpdate()** - Verify OTP and reset password

#### Middleware

**authMiddlewares.js** - JWT verification and user authentication checks
**multer.js** - Handles file upload processing

### Utility Functions

**emailTemplates.js** - HTML email templates for:
- Registration OTP emails
- 2FA verification emails
- Password reset emails

**notificationService.js** - Handles notification creation and management

---

## 🚀 How to Use

### 1. **User Registration**
- Go to the signup page
- Enter email and username
- Receive OTP on email
- Verify OTP and set password
- Account is created and you're logged in

### 2. **Login with 2FA**
- Enter credentials on login page
- If 2FA is enabled, receive OTP via email
- Verify the OTP
- Access to dashboard granted

### 3. **Create a Team**
- Go to Dashboard → Teams
- Click "Create Team"
- Enter team details
- Invite team members via email
- Start collaborating

### 4. **Manage Tasks**
- Go to Dashboard → Tasks Board
- Create new task with title and description
- Assign to team members
- Drag tasks between status columns (To-Do, In Progress, Done)
- Track progress in real-time

### 5. **Invite Users**
- Go to Dashboard → Invitations or Settings
- Send invitation to email address
- User receives email with acceptance link
- Once accepted, they appear in your connections/team

### 6. **Update Settings**
- Go to Settings page
- Choose specific setting category (Profile, Security, Notifications, etc.)
- Make changes and save
- Changes take effect immediately

---

## 📝 Notes

- **Password Security**: Passwords are hashed with bcrypt using 10 salt rounds
- **OTP Validity**: OTP codes are valid for 5 minutes
- **Token Expiry**: JWT tokens expire in 7 days
- **Rate Limiting**: API endpoints have rate limiting to prevent abuse
- **CORS**: Cross-origin requests are allowed from configured origins
- **Environment Variables**: Always keep `.env` files secure and never commit them to version control

---

## 🤝 Contributing

Feel free to submit issues, fork the repository, and create pull requests for any improvements!

---

## 📄 License

This project is licensed under the ISC License.

---

## 📧 Support

For questions, issues, or suggestions, please create an issue in the repository or contact the project maintainers.

---

**Happy Project Managing! 🎉**
