const FeatureFlag = require("../models/FeatureFlag");

const getTenantId = (req) => req.user && req.user.tenantId;

const createFlag = async (req, res) => {
  try {
    const { name, key, description, enabled } = req.body;
    const tenantId = getTenantId(req);

    if (!tenantId) {
      return res.status(400).json({ message: "Tenant context is required" });
    }

    if (!name || !key) {
      return res.status(400).json({ message: "Flag name and key are required" });
    }

    const flag = await FeatureFlag.create({
      name,
      key,
      description,
      enabled,
      tenantId,
      createdBy: req.user.userId,
    });

    return res.status(201).json({
      message: "Feature flag created successfully",
      flag,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res
        .status(409)
        .json({ message: "Feature flag key already exists for this tenant" });
    }

    return res.status(500).json({
      message: "Failed to create feature flag",
      error: error.message,
    });
  }
};

const getFlags = async (req, res) => {
  try {
    const tenantId = getTenantId(req);

    if (!tenantId) {
      return res.status(400).json({ message: "Tenant context is required" });
    }

    const flags = await FeatureFlag.find({ tenantId }).sort({ createdAt: -1 });

    return res.status(200).json({ flags });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to fetch feature flags",
      error: error.message,
    });
  }
};

const updateFlag = async (req, res) => {
  try {
    const { name, key, description, enabled } = req.body;
    const tenantId = getTenantId(req);

    if (!tenantId) {
      return res.status(400).json({ message: "Tenant context is required" });
    }

    if (!name && !key && description === undefined && enabled === undefined) {
      return res.status(400).json({ message: "No update fields provided" });
    }

    const flag = await FeatureFlag.findOneAndUpdate(
      { _id: req.params.id, tenantId },
      { name, key, description, enabled },
      { new: true, runValidators: true }
    );

    if (!flag) {
      return res.status(404).json({ message: "Feature flag not found" });
    }

    return res.status(200).json({
      message: "Feature flag updated successfully",
      flag,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res
        .status(409)
        .json({ message: "Feature flag key already exists for this tenant" });
    }

    return res.status(500).json({
      message: "Failed to update feature flag",
      error: error.message,
    });
  }
};

const deleteFlag = async (req, res) => {
  try {
    const tenantId = getTenantId(req);

    if (!tenantId) {
      return res.status(400).json({ message: "Tenant context is required" });
    }

    const flag = await FeatureFlag.findOneAndDelete({
      _id: req.params.id,
      tenantId,
    });

    if (!flag) {
      return res.status(404).json({ message: "Feature flag not found" });
    }

    return res.status(200).json({
      message: "Feature flag deleted successfully",
      flag,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to delete feature flag",
      error: error.message,
    });
  }
};

const toggleFlag = async (req, res) => {
  try {
    const tenantId = getTenantId(req);

    if (!tenantId) {
      return res.status(400).json({ message: "Tenant context is required" });
    }

    const flag = await FeatureFlag.findOne({
      _id: req.params.id,
      tenantId,
    });

    if (!flag) {
      return res.status(404).json({ message: "Feature flag not found" });
    }

    flag.enabled = !flag.enabled;
    await flag.save();

    return res.status(200).json({
      message: "Feature flag toggled successfully",
      flag,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to toggle feature flag",
      error: error.message,
    });
  }
};

module.exports = {
  createFlag,
  getFlags,
  updateFlag,
  deleteFlag,
  toggleFlag,
};
