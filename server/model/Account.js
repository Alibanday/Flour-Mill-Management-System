import mongoose from "mongoose";

const accountSchema = new mongoose.Schema({
  accountId: {
    type: String,
    unique: true,
    required: true
  },
  accountType: {
    type: String,
    enum: ["Payable", "Receivable", "Cash", "Bank", "Others"],
    required: true
  },
  accountName: {
    type: String,
    required: true
  },
  phoneNumber: {
    type: String
  },
  whatsappNumber: {
    type: String
  },
  creditLimit: {
    type: Number
  },
  address: {
    type: String
  }
}, { timestamps: true });

const Account = mongoose.model("Account", accountSchema);
export default Account;
