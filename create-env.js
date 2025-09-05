// Script to create .env file for MongoDB connection
import fs from 'fs';
import path from 'path';

const envContent = `# MongoDB Configuration
MONGO_URL=mongodb+srv://taibkhan323:taib%40111@cluster0.ytaqnkh.mongodb.net/flour-mill-management?retryWrites=true&w=majority&appName=Cluster0

# Server Configuration
PORT=7000
NODE_ENV=development

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production-${Date.now()}
JWT_EXPIRE=7d

# Frontend URL
FRONTEND_URL=http://localhost:5173

# Cloudinary Configuration (for file uploads)
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
`;

const envPath = path.join('server', '.env');

try {
  fs.writeFileSync(envPath, envContent);
  console.log('✅ .env file created successfully!');
  console.log('📁 Location: server/.env');
  console.log('🔐 MongoDB connection configured with your credentials');
  console.log('🚀 You can now start the server with: npm run dev');
} catch (error) {
  console.error('❌ Error creating .env file:', error.message);
}
