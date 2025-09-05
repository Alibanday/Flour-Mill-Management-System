# MongoDB Database Setup Guide

## 🗄️ **Your Database Configuration**

- **Database Name**: `flour-mill-management`
- **Username**: `taibkhan323`
- **Password**: `taib@111`
- **Cluster**: MongoDB Atlas

## 🚀 **Quick Setup Steps**

### **Step 1: Create Environment File**
Create a `.env` file in the `server` directory with the following content:

```env
# MongoDB Configuration
MONGO_URL=mongodb+srv://taibkhan323:taib@111@cluster0.mongodb.net/flour-mill-management?retryWrites=true&w=majority

# Server Configuration
PORT=7000
NODE_ENV=development

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRE=7d

# Frontend URL
FRONTEND_URL=http://localhost:5173

# Cloudinary Configuration (for file uploads)
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
```

### **Step 2: Test Database Connection**
Run the database test script:

```bash
cd server
node setup-database.js
```

### **Step 3: Start the Server**
```bash
cd server
npm install
npm run dev
```

## 🔧 **Connection String Breakdown**

```
mongodb+srv://taibkhan323:taib@111@cluster0.mongodb.net/flour-mill-management?retryWrites=true&w=majority
```

- `mongodb+srv://` - MongoDB Atlas connection protocol
- `taibkhan323` - Your username
- `taib@111` - Your password
- `cluster0.mongodb.net` - Your cluster URL
- `flour-mill-management` - Database name
- `retryWrites=true&w=majority` - Connection options

## 📊 **Database Features**

### **Automatic Connection Management**
- ✅ Retry logic for failed connections
- ✅ Connection pooling
- ✅ Graceful shutdown handling
- ✅ Connection status monitoring

### **Security Features**
- ✅ Environment variable protection
- ✅ Connection string encryption
- ✅ Network access controls

## 🛠️ **Troubleshooting**

### **Common Issues & Solutions**

#### **1. Authentication Failed**
```
Error: Authentication failed
```
**Solution**: 
- Verify username and password
- Check if the user has proper permissions
- Ensure the user exists in MongoDB Atlas

#### **2. Network Access Denied**
```
Error: Network access denied
```
**Solution**:
- Add your IP address to MongoDB Atlas Network Access
- Or add `0.0.0.0/0` for development (not recommended for production)

#### **3. Cluster Not Found**
```
Error: Cluster not found
```
**Solution**:
- Verify the cluster URL
- Check if the cluster is running
- Ensure the cluster name is correct

#### **4. Connection Timeout**
```
Error: Connection timeout
```
**Solution**:
- Check your internet connection
- Verify firewall settings
- Try increasing timeout values

## 🔍 **Testing Your Connection**

### **Method 1: Using the Setup Script**
```bash
cd server
node setup-database.js
```

### **Method 2: Using the Health Check API**
```bash
# Start the server first
npm run dev

# Then test the health endpoint
curl http://localhost:7000/api/health
```

### **Method 3: Using Browser Console**
```javascript
// In browser console
window.apiTest.testApiConnection();
```

## 📋 **Database Collections**

The system will automatically create these collections:

- `users` - User accounts and profiles
- `warehouses` - Warehouse information
- `inventory` - Inventory items
- `stock` - Stock levels and movements
- `production` - Production records
- `sales` - Sales transactions
- `purchases` - Purchase records
- `suppliers` - Supplier information
- `gatepasses` - Gate pass records
- `notifications` - System notifications
- `accounts` - Financial accounts
- `transactions` - Financial transactions

## 🚨 **Security Notes**

1. **Never commit `.env` files** to version control
2. **Change JWT_SECRET** in production
3. **Use strong passwords** for database users
4. **Enable network access controls** in MongoDB Atlas
5. **Regular backup** your database

## 📞 **Support**

If you encounter any issues:

1. Check the console logs for error messages
2. Verify your MongoDB Atlas cluster is running
3. Test the connection using the setup script
4. Check your network access settings in MongoDB Atlas

---

**Status**: ✅ Database configuration ready
**Next Step**: Start the server and test the connection

