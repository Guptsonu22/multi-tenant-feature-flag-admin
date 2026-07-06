const mongoose = require("mongoose");

const featureFlagSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    key: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },

    description: {
      type: String,
      default: "",
    },

    enabled: {
      type: Boolean,
      default: false,
    },

    tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Tenant",
      required: true,
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

featureFlagSchema.index({ tenantId: 1, key: 1 }, { unique: true });

module.exports = mongoose.model("FeatureFlag", featureFlagSchema);
