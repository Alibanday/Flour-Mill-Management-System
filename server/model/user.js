// server/models/user.js
import mongoose from "mongoose";

const UserSchema = new mongoose.Schema({
  firstName: { type: String, required: true },
  lastName:  { type: String, required: true },
  email:     { type: String, required: true, unique: true },
  password:  { type: String, required: true },
  role: { 
           
    type: String, 
    enum: ['admin', 'general manager', 'production manager', 'sale manager',`warehouse manager`,'labor'], 
    default: 'labor' 
  },
  status: { 
    type: String, 
    enum: ['active', 'inactive'], 
    default: 'Active' 
  },
  warehouse: { type: mongoose.Schema.Types.ObjectId, ref: "Warehouse",  required: true  },

  // New fields you requested:
  cnic: { type: String },
  education: { type: String },
  address: { type: String },
  mobile: { type: String },
  bankAccount: { type: String },
  guardianName: { type: String },
  guardianContact: { type: String },
  profileImage: { type: String }, // URL from Cloudinary
  salary: { type: Number }


},
{ timestamps: true }
);

const User = mongoose.model("User", UserSchema);

export default User;
