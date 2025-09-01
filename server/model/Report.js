import mongoose from "mongoose";

const reportSchema = new mongoose.Schema({
  reportType: {
    type: String,
    required: true,
    enum: ['sales', 'inventory', 'profit-loss', 'expense', 'salary', 'vendor-outstanding']
  },
  title: {
    type: String,
    required: true
  },
  dateRange: {
    startDate: {
      type: Date,
      required: true
    },
    endDate: {
      type: Date,
      required: true
    }
  },
  filters: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  data: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },
  summary: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  generatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  generatedAt: {
    type: Date,
    default: Date.now
  },
  status: {
    type: String,
    enum: ['draft', 'final', 'archived'],
    default: 'final'
  }
}, {
  timestamps: true
});

// Index for efficient querying
reportSchema.index({ reportType: 1, 'dateRange.startDate': 1, 'dateRange.endDate': 1 });
reportSchema.index({ generatedBy: 1, generatedAt: -1 });

const Report = mongoose.model('Report', reportSchema);

export default Report; 