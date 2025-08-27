# 🏭 FlourMill Management System - Backend API

A robust Node.js/Express.js backend API for the FlourMill Management System with MongoDB database, JWT authentication, and role-based access control.

## 🚀 Features

- **🔐 JWT Authentication** - Secure user authentication and authorization
- **👥 User Management** - Complete CRUD operations for users with role-based access
- **🏢 Warehouse Management** - Manage warehouse information and assignments
- **🛡️ Role-Based Access Control** - Admin, Manager, Employee, Cashier roles
- **📤 File Upload** - Profile picture uploads with validation
- **✅ Input Validation** - Comprehensive validation using express-validator
- **🔒 Security** - Helmet, CORS, and other security middleware
- **📊 Pagination** - Efficient data retrieval with pagination
- **🔍 Search & Filtering** - Advanced search and filter capabilities

## 📋 Prerequisites

- **Node.js** (v14 or higher)
- **MongoDB** (v4.4 or higher)
- **npm** or **yarn**

## 🛠️ Installation

### 1. Clone and Navigate
```bash
cd backend
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Environment Setup
Create a `.env` file in the backend root directory:

```env
# Server Configuration
PORT=5000
NODE_ENV=development

# Database Configuration
MONGODB_URI=mongodb://localhost:27017/flourmill

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRE=7d

# File Upload Configuration
MAX_FILE_SIZE=5242880
UPLOAD_PATH=./uploads/profiles

# CORS Configuration
CORS_ORIGIN=http://localhost:5173

# Security Configuration
BCRYPT_ROUNDS=12
```

### 4. Start MongoDB
Make sure MongoDB is running on your system:
```bash
# Start MongoDB service
mongod

# Or if using MongoDB Atlas, update MONGODB_URI in .env
```

### 5. Run the Server
```bash
# Development mode (with auto-restart)
npm run dev

# Production mode
npm start
```

## 🌐 API Endpoints

### Authentication Routes
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user profile
- `POST /api/auth/logout` - User logout
- `POST /api/auth/change-password` - Change password

### User Management Routes
- `GET /api/users` - Get all users (Admin/Manager)
- `GET /api/users/:id` - Get single user
- `POST /api/users` - Create new user (Admin only)
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user (Admin only)
- `PATCH /api/users/:id/status` - Toggle user status

### Warehouse Management Routes
- `GET /api/warehouses` - Get all warehouses (Admin/Manager)
- `GET /api/warehouses/:id` - Get single warehouse
- `POST /api/warehouses` - Create new warehouse (Admin only)
- `PUT /api/warehouses/:id` - Update warehouse (Admin only)
- `DELETE /api/warehouses/:id` - Delete warehouse (Admin only)
- `PATCH /api/warehouses/:id/status` - Update warehouse status
- `GET /api/warehouses/summary/list` - Get warehouse summary list

## 🔐 Role-Based Access Control

### Admin Role
- Full access to all features
- Can create, edit, delete users and warehouses
- Can assign users to warehouses
- Can manage system settings

### Manager Role
- Can view and manage assigned warehouses
- Can view user information
- Can toggle user status
- Limited administrative functions

### Employee Role
- Basic system access
- Can view own profile
- Can update personal information
- No administrative functions

### Cashier Role
- Sales and financial access
- Can view own profile
- Can update personal information
- No administrative functions

## 📁 Project Structure

```
backend/
├── package.json          # Dependencies and scripts
├── server.js            # Main server file
├── .env                 # Environment variables
├── config/              # Configuration files
├── models/              # Mongoose models
│   ├── User.js         # User model
│   └── Warehouse.js    # Warehouse model
├── routes/              # API routes
│   ├── auth.js         # Authentication routes
│   ├── users.js        # User management routes
│   └── warehouses.js   # Warehouse management routes
├── middleware/          # Custom middleware
│   ├── auth.js         # Authentication middleware
│   └── upload.js       # File upload middleware
└── uploads/             # File uploads directory
    └── profiles/        # Profile picture uploads
```

## 🗄️ Database Models

### User Model
- Personal information (name, email, phone, CNIC)
- Authentication (password, JWT tokens)
- Role and permissions
- Warehouse assignments
- Profile picture
- Account status

### Warehouse Model
- Basic information (name, code, type)
- Address and contact details
- Capacity and operating hours
- Status and description
- Location coordinates

## 🔒 Security Features

- **JWT Authentication** - Secure token-based authentication
- **Password Hashing** - Bcrypt with configurable rounds
- **Input Validation** - Comprehensive validation and sanitization
- **CORS Protection** - Configurable cross-origin resource sharing
- **Helmet Security** - Security headers and protection
- **File Upload Security** - File type and size validation
- **Role-Based Access** - Granular permission control

## 📤 File Upload

- **Supported Formats** - JPG, PNG, GIF, WebP
- **File Size Limit** - 5MB maximum
- **Storage** - Local file system with organized structure
- **Security** - File type validation and sanitization
- **Cleanup** - Automatic cleanup of orphaned files

## 🧪 Testing the API

### 1. Health Check
```bash
curl http://localhost:5000/api/health
```

### 2. Register a User
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "Admin",
    "lastName": "User",
    "email": "admin@flourmill.com",
    "password": "password123",
    "phone": "+92-300-1234567",
    "cnic": "12345-1234567-1",
    "role": "Admin"
  }'
```

### 3. Login
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@flourmill.com",
    "password": "password123"
  }'
```

### 4. Get Users (with token)
```bash
curl -X GET http://localhost:5000/api/users \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## 🚨 Error Handling

The API includes comprehensive error handling:
- **Validation Errors** - Detailed validation messages
- **Authentication Errors** - Clear authentication failure messages
- **Authorization Errors** - Role-based access control errors
- **Database Errors** - MongoDB connection and query errors
- **File Upload Errors** - Upload validation and processing errors

## 🔧 Configuration Options

### Environment Variables
- **PORT** - Server port (default: 5000)
- **NODE_ENV** - Environment mode (development/production)
- **MONGODB_URI** - MongoDB connection string
- **JWT_SECRET** - JWT signing secret
- **JWT_EXPIRE** - JWT expiration time
- **CORS_ORIGIN** - Allowed CORS origins
- **BCRYPT_ROUNDS** - Password hashing rounds

### Database Configuration
- **Connection Pooling** - Optimized MongoDB connections
- **Indexes** - Performance-optimized database indexes
- **Validation** - Schema-level data validation
- **Relationships** - Proper model relationships and population

## 🚀 Deployment

### Production Considerations
1. **Environment Variables** - Secure production environment variables
2. **Database** - Use MongoDB Atlas or production MongoDB instance
3. **File Storage** - Consider cloud storage for file uploads
4. **SSL/TLS** - Enable HTTPS in production
5. **Rate Limiting** - Implement API rate limiting
6. **Monitoring** - Add application monitoring and logging

### Docker Deployment
```dockerfile
FROM node:16-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 5000
CMD ["npm", "start"]
```

## 📝 API Documentation

### Request/Response Format
All API endpoints follow a consistent format:

**Success Response:**
```json
{
  "success": true,
  "message": "Operation successful",
  "data": { ... }
}
```

**Error Response:**
```json
{
  "success": false,
  "message": "Error description",
  "errors": [ ... ]
}
```

### Pagination
List endpoints support pagination:
```json
{
  "success": true,
  "data": [ ... ],
  "pagination": {
    "current": 1,
    "limit": 10,
    "total": 100,
    "pages": 10
  }
}
```

## 🤝 Contributing

1. Follow the existing code style
2. Add proper error handling
3. Include input validation
4. Update documentation
5. Test thoroughly

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For support and questions:
- Check the API documentation
- Review error logs
- Test with the provided examples
- Ensure all prerequisites are met

---

**Happy Coding! 🎉**
