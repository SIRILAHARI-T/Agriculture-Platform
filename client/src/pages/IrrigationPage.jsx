import React, { useState, useEffect } from "react";
import {
  Droplets,
  Plus,
  Calendar,
  CheckCircle2,
  Clock,
  CloudRain,
  AlertCircle,
  X,
} from "lucide-react";
import API from "../services/api";
import Modal from "../components/common/Modal";
import AlertBadge from "../components/common/AlertBadge";
import LoadingSpinner from "../components/common/LoadingSpinner";

const METHODS = ["Drip", "Sprinkler", "Furrow", "Flood", "Center Pivot"];
const LITERS_PER_MM_PER_ACRE = 4046.86;

const IrrigationPage = () => {
  const [overview, setOverview] = useState(null);
  const [schedules, setSchedules] = useState([]);
  const [crops, setCrops] = useState([]);
  const [farms, setFarms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formError, setFormError] = useState("");
  const [formData, setFormData] = useState({
    crop: "",
    farm: "",
    waterRequirementMm: "15",
    waterRequirementLiters: "0",
    irrigationMethod: "Drip",
    scheduledDate: "",
    notes: "",
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError("");

      const [overviewRes, schedRes, cropsRes, farmsRes] = await Promise.all([
        API.get("/irrigation/overview"),
        API.get("/irrigation/schedules"),
        API.get("/crops"),
        API.get("/farms"),
      ]);

      if (overviewRes.data?.success) setOverview(overviewRes.data);
      if (schedRes.data?.success) setSchedules(schedRes.data.schedules);
      if (cropsRes.data?.success) setCrops(cropsRes.data.crops);
      if (farmsRes.data?.success) setFarms(farmsRes.data.farms);
    } catch (err) {
      console.error("Failed to load irrigation data:", err);
      setError(
        err.response?.data?.message ||
          "Failed to load smart irrigation data. Please check your connection."
      );
    } finally {
      setLoading(false);
    }
  };

  const openModal = () => {
    const firstCrop = crops.length > 0 ? crops[0] : null;
    const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000)
      .toISOString()
      .split("T")[0];

    const cropReq = overview?.cropRequirements?.find(
      (r) => r.cropId === firstCrop?._id
    );
    const recommendedMm =
      cropReq && cropReq.netWaterRequirementMm > 0
        ? Math.round(cropReq.netWaterRequirementMm)
        : 15;
    const acres = Number(firstCrop?.allocatedArea) || 1;
    const initialLiters = Math.round(recommendedMm * LITERS_PER_MM_PER_ACRE * acres);

    setFormError("");
    setFormData({
      crop: firstCrop ? firstCrop._id : "",
      farm: firstCrop ? (firstCrop.farm?._id || firstCrop.farm) : "",
      waterRequirementMm: String(recommendedMm),
      waterRequirementLiters: String(initialLiters),
      irrigationMethod: "Drip",
      scheduledDate: tomorrow,
      notes: "Optimal early morning run",
    });
    setIsModalOpen(true);
  };

  const handleCropChange = (cropId) => {
    const matched = crops.find((c) => c._id === cropId);
    const acres = Number(matched?.allocatedArea) || 1;
    const depth = parseFloat(formData.waterRequirementMm) || 0;
    const computedLiters =
      depth > 0 ? Math.round(depth * LITERS_PER_MM_PER_ACRE * acres) : 0;

    setFormData((prev) => ({
      ...prev,
      crop: cropId,
      farm: matched ? (matched.farm?._id || matched.farm) : prev.farm,
      waterRequirementLiters: String(computedLiters),
    }));
  };

  const handleDepthChange = (depthValue) => {
    const depth = parseFloat(depthValue);
    const matchedCrop = crops.find((c) => c._id === formData.crop);
    const acres = Number(matchedCrop?.allocatedArea) || 1;
    const computedLiters =
      Number.isFinite(depth) && depth > 0
        ? Math.round(depth * LITERS_PER_MM_PER_ACRE * acres)
        : 0;

    setFormData((prev) => ({
      ...prev,
      waterRequirementMm: depthValue,
      waterRequirementLiters: String(computedLiters),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError("");

    if (!formData.crop) {
      setFormError("Please select a crop.");
      return;
    }

    const depth = parseFloat(formData.waterRequirementMm);
    if (!Number.isFinite(depth) || depth <= 0) {
      setFormError("Please enter a valid positive water depth in millimeters.");
      return;
    }

    if (!formData.scheduledDate) {
      setFormError("Please select a valid scheduled watering date.");
      return;
    }

    setSubmitting(true);
    const matchedCrop = crops.find((c) => c._id === formData.crop);
    const acres = Number(matchedCrop?.allocatedArea) || 1;
    const computedLiters = Math.round(depth * LITERS_PER_MM_PER_ACRE * acres);

    const payload = {
      ...formData,
      waterRequirementMm: depth,
      waterRequirementLiters:
        parseFloat(formData.waterRequirementLiters) > 0
          ? parseFloat(formData.waterRequirementLiters)
          : computedLiters,
    };

    try {
      await API.post("/irrigation/schedules", payload);
      setIsModalOpen(false);
      fetchData();
    } catch (err) {
      setFormError(
        err.response?.data?.message || "Failed to create watering schedule."
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleStatusUpdate = async (scheduleId, newStatus) => {
    try {
      await API.patch(`/irrigation/schedules/${scheduleId}/status`, {
        status: newStatus,
      });
      fetchData();
    } catch (err) {
      alert("Failed to update watering status.");
    }
  };

  const handleDeleteSchedule = async (scheduleId) => {
    if (!window.confirm("Remove this watering schedule?")) return;
    try {
      await API.delete(`/irrigation/schedules/${scheduleId}`);
      fetchData();
    } catch (err) {
      alert("Failed to remove watering schedule.");
    }
  };

  if (loading && !overview) {
    return <LoadingSpinner message="Calculating your crop water needs..." />;
  }

  const cropReqs = overview?.cropRequirements || [];
  const selectedCrop = crops.find((c) => c._id === formData.crop);
  const selectedCropArea = selectedCrop?.allocatedArea || 5;

  return (
    <div>
      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "16px",
          marginBottom: "20px",
        }}
      >
        <div>
          <h2 style={{ fontSize: "1.2rem", fontWeight: 700 }}>Smart Irrigation</h2>
          <p style={{ fontSize: "0.82rem", color: "var(--text-muted)" }}>
            Get the right amount of water for your crops based on crop needs and expected rainfall
          </p>
        </div>

        <button className="btn btn-primary" onClick={openModal}>
          <Plus size={18} /> Schedule Watering
        </button>
      </div>

      {/* Error Alert */}
      {error && (
        <div
          style={{
            padding: "12px 16px",
            background: "#fef2f2",
            border: "1px solid #fecaca",
            borderRadius: "var(--radius-md)",
            color: "#dc2626",
            fontSize: "0.86rem",
            marginBottom: "20px",
            display: "flex",
            alignItems: "center",
            gap: "10px",
          }}
        >
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      {/* Top Metrics Row */}
      <div className="grid-3">
        <div className="card" style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <div className="stat-icon-wrapper stat-icon-blue">
            <Droplets size={26} />
          </div>
          <div>
            <div className="stat-info-label">Daily Water Needed</div>
            <div className="stat-info-value">
              {overview?.totalDailyLiters >= 1000
                ? `${Math.round((overview?.totalDailyLiters || 0) / 1000)}k Liters`
                : `${(overview?.totalDailyLiters || 0).toLocaleString()} Liters`}
            </div>
            <div className="stat-info-sub">
              {overview?.totalDailyLiters > 0
                ? `${overview.totalDailyLiters.toLocaleString()} L for active plots`
                : "No active irrigation requirement today"}
            </div>
          </div>
        </div>

        <div className="card" style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <div className="stat-icon-wrapper stat-icon-green">
            <CloudRain size={26} />
          </div>
          <div>
            <div className="stat-info-label">Expected Rainfall</div>
            <div className="stat-info-value">
              {cropReqs.length > 0 ? cropReqs[0].forecastRainMm : 0} mm
            </div>
            <div className="stat-info-sub">Expected in the next 24 hours</div>
          </div>
        </div>

        <div className="card" style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <div className="stat-icon-wrapper stat-icon-amber">
            <Clock size={26} />
          </div>
          <div>
            <div className="stat-info-label">Upcoming Watering</div>
            <div className="stat-info-value">
              {schedules.filter((s) => s.status === "Pending").length}
            </div>
            <div className="stat-info-sub">Watering plans waiting to be completed</div>
          </div>
        </div>
      </div>

      {/* Real-time Crop Water Requirement Table */}
      <div className="card" style={{ marginBottom: "24px" }}>
        <div className="card-header">
          <div className="card-header-left">
            <Droplets size={20} color="#0284c7" />
            <div>
              <h3>Crop Water Needs</h3>
              <span className="card-subtitle">
                Water needed for each crop based on its growth stage, soil, and weather
              </span>
            </div>
          </div>
        </div>

        <div className="table-responsive">
          <table className="custom-table">
            <thead>
              <tr>
                <th>Crop & Farm</th>
                <th>Growth Stage</th>
                <th>Crop Water Factor</th>
                <th>Soil Type</th>
                <th>Water Needed</th>
                <th>Amount (Liters)</th>
                <th>Weather-Based Advice</th>
              </tr>
            </thead>
            <tbody>
              {cropReqs.length > 0 ? (
                cropReqs.map((req, idx) => (
                  <tr key={idx}>
                    <td>
                      <strong>{req.cropName}</strong>
                      <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                        {req.farmName} ({req.allocatedAcres} ac)
                      </div>
                    </td>
                    <td>
                      <AlertBadge text={req.growthStage} />
                    </td>
                    <td>
                      <strong>Kc = {req.cropFactorKc}</strong>
                    </td>
                    <td>{req.soilType}</td>
                    <td>
                      <strong style={{ color: "var(--primary)", fontSize: "0.95rem" }}>
                        {req.netWaterRequirementMm} mm
                      </strong>
                    </td>
                    <td>
                      <strong>{req.totalWaterLiters.toLocaleString()} L</strong>
                    </td>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                        <AlertBadge text={req.recommendationStatus} />
                        <span style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>
                          {req.reason}
                        </span>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} style={{ textAlign: "center", padding: "30px", color: "var(--text-muted)" }}>
                    No active crops found. Add crops to see real-time water needs.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Irrigation Schedules List */}
      <div className="card">
        <div className="card-header">
          <div className="card-header-left">
            <Calendar size={20} color="var(--primary)" />
            <div>
              <h3>Watering Schedule ({schedules.length})</h3>
              <span className="card-subtitle">
                See upcoming watering plans and completed watering
              </span>
            </div>
          </div>
        </div>

        {schedules.length > 0 ? (
          <div className="table-responsive">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Watering Date</th>
                  <th>Crop & Farm</th>
                  <th>Watering Method</th>
                  <th>Water Amount</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {schedules.map((sched) => (
                  <tr key={sched._id}>
                    <td>
                      <strong>
                        {new Date(sched.scheduledDate).toLocaleDateString(undefined, {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })}
                      </strong>
                    </td>
                    <td>
                      <strong>{sched.crop?.name || "Crop"}</strong>
                      <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                        {sched.farm?.name || "Farm"}
                      </div>
                    </td>
                    <td>
                      <span className="badge badge-info">{sched.irrigationMethod}</span>
                    </td>
                    <td>
                      <strong>{sched.waterRequirementMm} mm</strong>
                      <div style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>
                        ~{(sched.waterRequirementLiters || 0).toLocaleString()} L
                      </div>
                    </td>
                    <td>
                      <AlertBadge
                        text={sched.status}
                        type={
                          sched.status === "Completed"
                            ? "up"
                            : sched.status === "Pending"
                            ? "down"
                            : "stable"
                        }
                      />
                    </td>
                    <td>
                      <div style={{ display: "flex", gap: "6px" }}>
                        {sched.status === "Pending" && (
                          <button
                            className="btn btn-outline-primary btn-sm"
                            onClick={() => handleStatusUpdate(sched._id, "Completed")}
                            title="Mark as completed"
                          >
                            <CheckCircle2 size={13} /> Complete
                          </button>
                        )}
                        {sched.status === "Pending" && (
                          <button
                            className="btn btn-secondary btn-sm"
                            onClick={() =>
                              handleStatusUpdate(sched._id, "Postponed due to Rain")
                            }
                            title="Delay due to rain"
                          >
                            Delay
                          </button>
                        )}
                        <button
                          className="btn btn-danger btn-sm"
                          onClick={() => handleDeleteSchedule(sched._id)}
                          title="Cancel schedule"
                        >
                          Cancel
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p
            style={{
              color: "var(--text-muted)",
              fontSize: "0.88rem",
              padding: "16px 0",
              textAlign: "center",
            }}
          >
            No watering plans found. Click "Schedule Watering" to plan your next watering.
          </p>
        )}
      </div>

      {/* Schedule Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Create Watering Schedule"
      >
        <form onSubmit={handleSubmit}>
          {formError && (
            <div
              style={{
                padding: "10px 14px",
                background: "#fef2f2",
                border: "1px solid #fecaca",
                borderRadius: "8px",
                color: "#dc2626",
                fontSize: "0.85rem",
                marginBottom: "16px",
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              <AlertCircle size={16} />
              <span>{formError}</span>
            </div>
          )}

          <div className="form-group">
            <label className="form-label">Crop *</label>
            <select
              className="form-select"
              value={formData.crop}
              onChange={(e) => handleCropChange(e.target.value)}
              required
            >
              <option value="" disabled>
                Select Crop
              </option>
              {crops.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.name} ({c.growthStage} - {c.allocatedArea} ac)
                </option>
              ))}
            </select>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
            <div className="form-group">
              <label className="form-label">Watering Method</label>
              <select
                className="form-select"
                value={formData.irrigationMethod}
                onChange={(e) =>
                  setFormData({ ...formData, irrigationMethod: e.target.value })
                }
              >
                {METHODS.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Watering Date *</label>
              <input
                type="date"
                className="form-input"
                value={formData.scheduledDate}
                onChange={(e) =>
                  setFormData({ ...formData, scheduledDate: e.target.value })
                }
                required
              />
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
            <div className="form-group">
              <label className="form-label">Water Depth (mm) *</label>
              <input
                type="number"
                step="0.5"
                min="0.5"
                className="form-input"
                value={formData.waterRequirementMm}
                onChange={(e) => handleDepthChange(e.target.value)}
                required
              />
              <span
                style={{
                  fontSize: "0.72rem",
                  color: "var(--text-muted)",
                  marginTop: "3px",
                  display: "block",
                }}
              >
                Area: {selectedCropArea} acres
              </span>
            </div>

            <div className="form-group">
              <label className="form-label">Estimated Water (Liters)</label>
              <input
                type="number"
                className="form-input"
                value={formData.waterRequirementLiters}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    waterRequirementLiters: e.target.value,
                  })
                }
              />
              <span
                style={{
                  fontSize: "0.72rem",
                  color: "var(--text-muted)",
                  marginTop: "3px",
                  display: "block",
                }}
              >
                ≈ {formData.waterRequirementMm || 0} mm × 4,046.86 L × {selectedCropArea} ac
              </span>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Watering Instructions</label>
            <textarea
              className="form-textarea"
              placeholder="e.g. Run drip valves in Block A for 2 hours, check the water flow..."
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            />
          </div>

          <div className="modal-footer" style={{ margin: "0 -24px -24px -24px" }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setIsModalOpen(false)}
            >
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? "Scheduling..." : "Confirm Schedule"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default IrrigationPage;
