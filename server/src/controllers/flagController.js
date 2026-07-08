const FeatureFlag = require("../models/FeatureFlag");
const AuditLog = require("../models/AuditLog");
const Tenant = require("../models/Tenant");
const { evaluateFlag } = require("../utils/flagEvaluation");

const getTenantId = (req) => req.user && req.user.tenantId;
const canManageAllTenants = (req) =>
  req.user && ["owner", "admin"].includes(req.user.role);
const getFlagFilter = (req, flagId) => ({
  _id: flagId,
  ...(canManageAllTenants(req) ? {} : { tenantId: getTenantId(req) }),
});

const createFlag = async (req, res) => {
  try {
    const { name, key, description, enabled, tenantId: requestedTenantId } = req.body;
    const tenantId = requestedTenantId || getTenantId(req);

    if (!tenantId) {
      return res.status(400).json({ message: "Tenant context is required" });
    }

    if (!name || !key) {
      return res.status(400).json({ message: "Flag name and key are required" });
    }

    const tenant = await Tenant.findById(tenantId);

    if (!tenant) {
      return res.status(404).json({ message: "Tenant not found" });
    }

    const flag = await FeatureFlag.create({
      name,
      key,
      description,
      enabled,
      tenantId,
      tenantName: tenant.name,
      createdBy: req.user.userId,
    });

    await AuditLog.create({
      tenantId,
      actorId: req.user.userId,
      action: "create",
      before: null,
      after: { name: flag.name, key: flag.key, enabled: flag.enabled },
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

    const flagFilter = canManageAllTenants(req) ? {} : { tenantId };
    const auditFilter = canManageAllTenants(req) ? {} : { tenantId };

    const flags = await FeatureFlag.find(flagFilter)
      .populate("tenantId", "name")
      .populate({
        path: "createdBy",
        select: "_id tenantId",
        populate: { path: "tenantId", select: "name" },
      })
      .sort({ createdAt: -1 })
      .lean();
    const tenants = await Tenant.find({}, "name").lean();
    const tenantsByName = new Map(
      tenants.map((tenant) => [tenant.name.toLowerCase(), tenant])
    );

    await Promise.all(
      flags.map(async (flag) => {
        const creatorTenant = flag.createdBy?.tenantId;
        const snapshotTenant = flag.tenantName
          ? tenantsByName.get(flag.tenantName.toLowerCase())
          : null;
        const resolvedTenant =
          flag.tenantId || snapshotTenant || (!flag.tenantName ? creatorTenant : null);
        const resolvedTenantName =
          flag.tenantId?.name || snapshotTenant?.name || flag.tenantName || creatorTenant?.name;

        if (!resolvedTenant || !resolvedTenantName) {
          return;
        }

        const update = { tenantName: resolvedTenantName };

        if (!flag.tenantId && resolvedTenant?._id) {
          update.tenantId = resolvedTenant._id;
        }

        await FeatureFlag.updateOne({ _id: flag._id }, { $set: update });
        flag.tenantId = resolvedTenant;
        flag.tenantName = resolvedTenantName;
      })
    );
    const auditLogs = await AuditLog.find(auditFilter).sort({ createdAt: -1 }).limit(20);

    return res.status(200).json({ flags, auditLogs });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to fetch feature flags",
      error: error.message,
    });
  }
};

const updateFlag = async (req, res) => {
  try {
    const { name, key, description, enabled, tenantId: requestedTenantId } = req.body;
    const tenantId = getTenantId(req);

    if (!tenantId) {
      return res.status(400).json({ message: "Tenant context is required" });
    }

    if (!name && !key && description === undefined && enabled === undefined && !requestedTenantId) {
      return res.status(400).json({ message: "No update fields provided" });
    }

    const flagFilter = getFlagFilter(req, req.params.id);
    const existing = await FeatureFlag.findOne(flagFilter);

    if (!existing) {
      return res.status(404).json({ message: "Feature flag not found" });
    }

    const targetTenantId = requestedTenantId || existing.tenantId;
    const tenant = await Tenant.findById(targetTenantId);

    if (!tenant) {
      return res.status(404).json({ message: "Tenant not found" });
    }

    const flag = await FeatureFlag.findOneAndUpdate(
      flagFilter,
      {
        name,
        key,
        description,
        enabled,
        tenantId: targetTenantId,
        tenantName: tenant.name,
      },
      { new: true, runValidators: true }
    );

    await AuditLog.create({
      tenantId: targetTenantId,
      actorId: req.user.userId,
      action: "update",
      before: {
        name: existing.name,
        key: existing.key,
        description: existing.description,
        enabled: existing.enabled,
      },
      after: {
        name: flag.name,
        key: flag.key,
        description: flag.description,
        enabled: flag.enabled,
      },
    });

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

    const flagFilter = getFlagFilter(req, req.params.id);
    const flag = await FeatureFlag.findOne(flagFilter);

    if (!flag) {
      return res.status(404).json({ message: "Feature flag not found" });
    }

    await FeatureFlag.findOneAndDelete(flagFilter);

    await AuditLog.create({
      tenantId: flag.tenantId,
      actorId: req.user.userId,
      action: "delete",
      before: {
        name: flag.name,
        key: flag.key,
        description: flag.description,
        enabled: flag.enabled,
      },
      after: null,
    });

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

    const flag = await FeatureFlag.findOne(getFlagFilter(req, req.params.id));

    if (!flag) {
      return res.status(404).json({ message: "Feature flag not found" });
    }

    const before = { enabled: flag.enabled };
    flag.enabled = !flag.enabled;
    await flag.save();

    await AuditLog.create({
      tenantId: flag.tenantId,
      actorId: req.user.userId,
      action: "toggle",
      before,
      after: { enabled: flag.enabled },
    });

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

const evaluateFlagRoute = async (req, res) => {
  try {
    const { key, userId, tenantId } = req.body;

    if (!key) {
      return res.status(400).json({ message: "Flag key is required" });
    }

    const resolvedTenantId = tenantId || req.query.tenantId || req.user?.tenantId;

    if (!resolvedTenantId) {
      return res.status(400).json({ message: "Tenant context is required" });
    }

    const flag = await FeatureFlag.findOne({ key, tenantId: resolvedTenantId });

    if (!flag) {
      return res.status(404).json({ message: "Feature flag not found" });
    }

    const enabled = evaluateFlag(flag, { userId, flagKey: key });

    return res.status(200).json({
      enabled,
      flagKey: key,
      message: enabled ? "Feature Enabled" : "Feature Disabled",
    });
  } catch (error) {
    return res.status(500).json({ message: "Failed to evaluate flag", error: error.message });
  }
};

module.exports = {
  createFlag,
  getFlags,
  updateFlag,
  deleteFlag,
  toggleFlag,
  evaluateFlagRoute,
};
