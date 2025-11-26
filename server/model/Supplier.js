import mongoose from "mongoose";

const supplierSchema = new mongoose.Schema(
  {
    supplierCode: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    contactPerson: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: false,
      unique: true,
      sparse: true, // Allow multiple null/undefined values
      trim: true,
      lowercase: true,
    },
    phone: {
      type: String,
      required: true,
      trim: true,
    },
    address: {
      street: {
        type: String,
        required: true,
        trim: true,
      },
      city: {
        type: String,
        required: true,
        trim: true,
      },
      state: {
        type: String,
        required: true,
        trim: true,
      },
      postalCode: {
        type: String,
        required: true,
        trim: true,
      },
      country: {
        type: String,
        default: "Pakistan",
        trim: true,
      },
    },
    supplierType: {
      type: String,
      required: true,
      enum: ["Government", "Private"],
      default: "Private",
    },
    businessType: {
      type: String,
      required: true,
      enum: ["Raw Materials", "Packaging", "Equipment", "Services", "Other"],
      default: "Raw Materials",
    },
    taxNumber: {
      type: String,
      trim: true,
    },
    creditLimit: {
      type: Number,
      default: 0,
      min: 0,
    },
    outstandingBalance: {
      type: Number,
      default: 0,
      min: 0,
    },
    paymentTerms: {
      type: String,
      enum: ["Immediate", "7 Days", "15 Days", "30 Days", "45 Days", "60 Days"],
      default: "30 Days",
    },
    status: {
      type: String,
      enum: ["Active", "Inactive", "Suspended"],
      default: "Active",
    },
    rating: {
      type: Number,
      min: 1,
      max: 5,
      default: 3,
    },
    notes: {
      type: String,
      trim: true,
    },
    warehouse: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Warehouse",
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true,
  }
);

// Index for better query performance
supplierSchema.index({ supplierCode: 1, warehouse: 1 });
supplierSchema.index({ name: 1, warehouse: 1 });
supplierSchema.index({ outstandingBalance: 1, warehouse: 1 });

// Virtual for full address
supplierSchema.virtual("fullAddress").get(function () {
  return `${this.address.street}, ${this.address.city}, ${this.address.state} ${this.address.postalCode}, ${this.address.country}`;
});

// Method to update outstanding balance
supplierSchema.methods.updateOutstandingBalance = function (amount, type) {
  if (type === "increase") {
    this.outstandingBalance += amount;
  } else if (type === "decrease") {
    this.outstandingBalance = Math.max(0, this.outstandingBalance - amount);
  }
  return this.save();
};

// Method to check if credit limit exceeded
supplierSchema.methods.isCreditLimitExceeded = function () {
  return this.outstandingBalance > this.creditLimit;
};

const Supplier = mongoose.model("Supplier", supplierSchema);

export default Supplier;

