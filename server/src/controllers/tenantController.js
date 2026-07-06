const Tenant = require("../models/Tenant");

const createTenant = async (req, res) => {
  try {
    const { name, description } = req.body;

    if (!name) {
      return res.status(400).json({ message: "Tenant name is required" });
    }

    const tenant = await Tenant.create({
      name,
      description,
    });

    return res.status(201).json({
      message: "Tenant created successfully",
      tenant,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ message: "Tenant name already exists" });
    }

    return res.status(500).json({
      message: "Failed to create tenant",
      error: error.message,
    });
  }
};

const getAllTenants = async (req, res) => {
  try {
    const tenants = await Tenant.find().sort({ createdAt: -1 });

    return res.status(200).json({ tenants });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to fetch tenants",
      error: error.message,
    });
  }
};

const updateTenant = async (req, res) => {
  try {
    const { name, description } = req.body;

    if (!name && description === undefined) {
      return res.status(400).json({ message: "No update fields provided" });
    }

    const tenant = await Tenant.findByIdAndUpdate(
      req.params.id,
      { name, description },
      { new: true, runValidators: true }
    );

    if (!tenant) {
      return res.status(404).json({ message: "Tenant not found" });
    }

    return res.status(200).json({
      message: "Tenant updated successfully",
      tenant,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ message: "Tenant name already exists" });
    }

    return res.status(500).json({
      message: "Failed to update tenant",
      error: error.message,
    });
  }
};

const deleteTenant = async (req, res) => {
  try {
    const tenant = await Tenant.findByIdAndDelete(req.params.id);

    if (!tenant) {
      return res.status(404).json({ message: "Tenant not found" });
    }

    return res.status(200).json({
      message: "Tenant deleted successfully",
      tenant,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to delete tenant",
      error: error.message,
    });
  }
};

module.exports = {
  createTenant,
  getAllTenants,
  updateTenant,
  deleteTenant,
};
