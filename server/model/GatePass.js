import mongoose from "mongoose";

const gatePassSchema = new mongoose.Schema(
  {
    gatePassNumber: {
      type: String,
      required: false, // Will be generated in pre-save hook
      unique: true,
      trim: true,
    },
    type: {
      type: String,
      required: true,
      enum: ["Person", "Vehicle", "Material", "Equipment", "Visitor"],
      default: "Person",
    },
    purpose: {
      type: String,
      required: true,
      trim: true,
    },
    issuedTo: {
      name: {
        type: String,
        required: true,
        trim: true,
      },
      contact: {
        type: String,
        required: true,
        trim: true,
      },
      idNumber: {
        type: String,
        trim: true,
      },
      company: {
        type: String,
        trim: true,
      },
    },
    items: [{
      description: {
        type: String,
        required: true,
        trim: true,
      },
      quantity: {
        type: Number,
        required: true,
        min: 1,
      },
      unit: {
        type: String,
        required: true,
        trim: true,
      },
      value: {
        type: Number,
        min: 0,
      },
    }],
    vehicle: {
      number: {
        type: String,
        trim: true,
      },
      type: {
        type: String,
        trim: true,
      },
      driver: {
        type: String,
        trim: true,
      },
    },
    validFrom: {
      type: Date,
      required: true,
      default: Date.now,
    },
    validUntil: {
      type: Date,
      required: true,
    },
    issuedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    warehouse: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Warehouse",
      required: true,
    },
    status: {
      type: String,
      enum: ["Pending", "Approved", "Active", "Completed", "Expired", "Cancelled"],
      default: "Pending",
    },
    stockDispatch: {
      confirmed: {
        type: Boolean,
        default: false,
      },
      confirmedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
      confirmedAt: {
        type: Date,
      },
      notes: {
        type: String,
        trim: true,
      },
    },
    printOptions: {
      gatePass: {
        type: Boolean,
        default: true,
      },
      invoice: {
        type: Boolean,
        default: false,
      },
      both: {
        type: Boolean,
        default: false,
      },
    },
    whatsappShared: {
      type: Boolean,
        default: false,
    },
    whatsappSharedAt: {
      type: Date,
    },
    whatsappSharedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    notes: {
      type: String,
      trim: true,
    },
    attachments: [{
      filename: String,
      path: String,
      uploadedAt: {
        type: Date,
        default: Date.now,
      },
    }],
  },
  {
    timestamps: true,
  }
);

// Generate gate pass number
gatePassSchema.pre("save", async function (next) {
  if (this.isNew) {
    try {
      // Try to get count from database
      const count = await this.constructor.countDocuments();
      const year = new Date().getFullYear();
      this.gatePassNumber = `GP${year}${String(count + 1).padStart(4, "0")}`;
    } catch (error) {
      // If database is not connected, generate a timestamp-based number
      console.log("Database not connected, generating timestamp-based gate pass number");
      const timestamp = Date.now();
      this.gatePassNumber = `GP${timestamp}`;
    }
  }
  next();
});

// Check if gate pass is expired
gatePassSchema.methods.isExpired = function () {
  return new Date() > this.validUntil;
};

// Check if gate pass is active
gatePassSchema.methods.isActive = function () {
  const now = new Date();
  return this.status === "Active" && now >= this.validFrom && now <= this.validUntil;
};

// Get remaining validity time
gatePassSchema.methods.getRemainingTime = function () {
  const now = new Date();
  if (now > this.validUntil) return 0;
  return this.validUntil - now;
};

// Calculate total value of items
gatePassSchema.methods.getTotalValue = function () {
  return this.items.reduce((total, item) => total + (item.value || 0), 0);
};

// Get formatted address
gatePassSchema.methods.getFormattedAddress = function () {
  return `${this.warehouse?.name || "N/A"}`;
};

const GatePass = mongoose.model("GatePass", gatePassSchema);

export default GatePass;
