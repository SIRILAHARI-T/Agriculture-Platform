import React, { useState, useEffect } from "react";
import { Plus, Edit2, Trash2, Sprout, Calendar, CheckCircle2, ChevronRight } from "lucide-react";
import API from "../services/api";
import Modal from "../components/common/Modal";
import AlertBadge from "../components/common/AlertBadge";
import LoadingSpinner from "../components/common/LoadingSpinner";

const CROP_STAGES = [
  "Germination",
  "Vegetative",
  "Flowering",
  "Fruiting / Grain Filling",
  "Ripening / Maturation",
  "Harvested",
];

const CATEGORIES = ["Cereal", "Pulse", "Vegetable", "Fruit", "Cash Crop", "Oilseed", "Other"];

const CropsPage = () => {
  const [crops, setCrops] = useState([]);
  const [farms, setFarms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterFarm, setFilterFarm] = useState("all");

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentCropId, setCurrentCropId] = useState(null);
  const [formData, setFormData] = useState({
    farm: "",
    name: "",
    variety: "",
    category: "Cereal",
    plantingDate: "",
    expectedHarvestDate: "",
    allocatedArea: "5",
    growthStage: "Vegetative",
    currentHealthStatus: "Healthy",
    expectedYield: "100",
    notes: "",
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [cropsRes, farmsRes] = await Promise.all([
        API.get("/crops"),
        API.get("/farms"),
      ]);
      if (cropsRes.data.success) setCrops(cropsRes.data.crops);
      if (farmsRes.data.success) setFarms(farmsRes.data.farms);
    } catch (err) {
      console.error("Failed to load crop data:", err);
    } finally {
      setLoading(false);
    }
  };

  const openCreateModal = () => {
    setIsEditing(false);
    setCurrentCropId(null);
    const today = new Date().toISOString().split("T")[0];
    const harvest = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

    setFormData({
      farm: farms.length > 0 ? farms[0]._id : "",
      name: "",
      variety: "",
      category: "Cereal",
      plantingDate: today,
      expectedHarvestDate: harvest,
      allocatedArea: "5",
      growthStage: "Vegetative",
      currentHealthStatus: "Healthy",
      expectedYield: "100",
      notes: "",
    });
    setIsModalOpen(true);
  };

  const openEditModal = (crop) => {
    setIsEditing(true);
    setCurrentCropId(crop._id);
    setFormData({
      farm: crop.farm?._id || crop.farm || "",
      name: crop.name,
      variety: crop.variety || "",
      category: crop.category || "Cereal",
      plantingDate: crop.plantingDate ? new Date(crop.plantingDate).toISOString().split("T")[0] : "",
      expectedHarvestDate: crop.expectedHarvestDate
        ? new Date(crop.expectedHarvestDate).toISOString().split("T")[0]
        : "",
      allocatedArea: crop.allocatedArea?.toString() || "5",
      growthStage: crop.growthStage || "Vegetative",
      currentHealthStatus: crop.currentHealthStatus || "Healthy",
      expectedYield: crop.yieldEstimate?.expected?.toString() || "100",
      notes: crop.notes || "",
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    const payload = {
      farm: formData.farm,
      name: formData.name,
      variety: formData.variety,
      category: formData.category,
      plantingDate: formData.plantingDate,
      expectedHarvestDate: formData.expectedHarvestDate,
      allocatedArea: parseFloat(formData.allocatedArea),
      growthStage: formData.growthStage,
      currentHealthStatus: formData.currentHealthStatus,
      yieldEstimate: {
        expected: parseFloat(formData.expectedYield) || 0,
        unit: "Kg",
      },
      notes: formData.notes,
    };

    try {
      if (isEditing) {
        await API.put(`/crops/${currentCropId}`, payload);
      } else {
        await API.post("/crops", payload);
      }
      setIsModalOpen(false);
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to save crop.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Delete crop record for "${name}"?`)) return;
    try {
      await API.delete(`/crops/${id}`);
      fetchData();
    } catch (err) {
      alert("Failed to delete crop.");
    }
  };

  // Quick advance growth stage
  const handleAdvanceStage = async (crop) => {
    const currentIndex = CROP_STAGES.indexOf(crop.growthStage);
    if (currentIndex < CROP_STAGES.length - 1) {
      const nextStage = CROP_STAGES[currentIndex + 1];
      try {
        await API.put(`/crops/${crop._id}`, { growthStage: nextStage });
        fetchData();
      } catch (err) {
        alert("Failed to advance stage.");
      }
    }
  };

  const filteredCrops =
    filterFarm === "all" ? crops : crops.filter((c) => (c.farm?._id || c.farm) === filterFarm);

  if (loading) return <LoadingSpinner message="Loading crop portfolio & lifecycle data..." />;

  return (
    <div>
      {/* Action and Filter Header */}
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
          <h2 style={{ fontSize: "1.2rem", fontWeight: 700 }}>Cultivated Crops ({crops.length})</h2>
          <p style={{ fontSize: "0.82rem", color: "var(--text-muted)" }}>
            Phenological tracking, harvest projections, and health indicators
          </p>
        </div>

        <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
          {farms.length > 0 && (
            <select
              className="form-select"
              style={{ width: "200px" }}
              value={filterFarm}
              onChange={(e) => setFilterFarm(e.target.value)}
            >
              <option value="all">All Farms</option>
              {farms.map((f) => (
                <option key={f._id} value={f._id}>
                  {f.name}
                </option>
              ))}
            </select>
          )}

          <button className="btn btn-primary" onClick={openCreateModal}>
            <Plus size={18} /> Add Crop
          </button>
        </div>
      </div>

      {/* Crop Cards List */}
      <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        {filteredCrops.map((crop) => {
          const stageIndex = CROP_STAGES.indexOf(crop.growthStage);
          const progressPercent = Math.round(((stageIndex + 1) / CROP_STAGES.length) * 100);

          // Calculate days until harvest
          let daysToHarvest = null;
          if (crop.expectedHarvestDate) {
            const diffMs = new Date(crop.expectedHarvestDate) - new Date();
            daysToHarvest = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
          }

          return (
            <div key={crop._id} className="card">
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  flexWrap: "wrap",
                  gap: "12px",
                  marginBottom: "14px",
                }}
              >
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <h3 style={{ fontSize: "1.15rem", color: "var(--text-primary)" }}>{crop.name}</h3>
                    {crop.variety && (
                      <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
                        ({crop.variety})
                      </span>
                    )}
                    <AlertBadge text={crop.category} />
                    <AlertBadge text={crop.currentHealthStatus} />
                  </div>
                  <p style={{ fontSize: "0.82rem", color: "var(--text-muted)", marginTop: "4px" }}>
                    Farm: <strong>{crop.farm?.name || "Assigned Field"}</strong> • Area:{" "}
                    <strong>{crop.allocatedArea} Acres</strong>
                  </p>
                </div>

                <div style={{ display: "flex", gap: "8px" }}>
                  {stageIndex < CROP_STAGES.length - 1 && (
                    <button
                      className="btn btn-outline-primary btn-sm"
                      onClick={() => handleAdvanceStage(crop)}
                      title="Advance to next phenological growth stage"
                    >
                      Advance Stage <ChevronRight size={14} />
                    </button>
                  )}
                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={() => openEditModal(crop)}
                  >
                    <Edit2 size={14} />
                  </button>
                  <button
                    className="btn btn-danger btn-sm"
                    onClick={() => handleDelete(crop._id, crop.name)}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>

              {/* Lifecycle Stage Progress Bar */}
              <div style={{ marginBottom: "16px" }}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    fontSize: "0.82rem",
                    marginBottom: "4px",
                  }}
                >
                  <span>
                    Current Stage: <strong style={{ color: "var(--primary)" }}>{crop.growthStage}</strong>
                  </span>
                  <span>{progressPercent}% Complete</span>
                </div>
                <div className="stage-progress-track">
                  <div
                    className="stage-progress-fill"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    fontSize: "0.72rem",
                    color: "var(--text-light)",
                    marginTop: "6px",
                  }}
                >
                  {CROP_STAGES.map((s, idx) => (
                    <span
                      key={s}
                      style={{
                        fontWeight: s === crop.growthStage ? 700 : 400,
                        color: idx <= stageIndex ? "var(--primary)" : "var(--text-light)",
                      }}
                    >
                      {s.split(" ")[0]}
                    </span>
                  ))}
                </div>
              </div>

              {/* Dates and Projected Yield */}
              <div
                style={{
                  display: "flex",
                  gap: "24px",
                  fontSize: "0.84rem",
                  background: "var(--bg-subtle)",
                  padding: "10px 14px",
                  borderRadius: "var(--radius-md)",
                  flexWrap: "wrap",
                }}
              >
                <div>
                  <span style={{ color: "var(--text-muted)" }}>Sowing Date: </span>
                  <strong>{new Date(crop.plantingDate).toLocaleDateString()}</strong>
                </div>
                <div>
                  <span style={{ color: "var(--text-muted)" }}>Expected Harvest: </span>
                  <strong>{new Date(crop.expectedHarvestDate).toLocaleDateString()}</strong>
                  {daysToHarvest !== null && (
                    <span
                      style={{
                        marginLeft: "6px",
                        fontWeight: 600,
                        color: daysToHarvest > 0 ? "#0284c7" : "#16a34a",
                      }}
                    >
                      ({daysToHarvest > 0 ? `${daysToHarvest} days left` : "Ready for harvest"})
                    </span>
                  )}
                </div>
                {crop.yieldEstimate?.expected > 0 && (
                  <div>
                    <span style={{ color: "var(--text-muted)" }}>Est. Yield: </span>
                    <strong>
                      {crop.yieldEstimate.expected} {crop.yieldEstimate.unit}
                    </strong>
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {filteredCrops.length === 0 && (
          <div className="card" style={{ textAlign: "center", padding: "40px" }}>
            <Sprout size={36} color="var(--primary)" style={{ margin: "0 auto 12px auto" }} />
            <p style={{ fontWeight: 600, color: "var(--text-secondary)" }}>
              No crops found for the selected filter.
            </p>
            <button
              className="btn btn-primary btn-sm"
              onClick={openCreateModal}
              style={{ marginTop: "12px" }}
            >
              Add First Crop
            </button>
          </div>
        )}
      </div>

      {/* Add / Edit Crop Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={isEditing ? "Edit Crop Record" : "Add Crop to Farm"}
      >
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Assign to Farm *</label>
            <select
              className="form-select"
              value={formData.farm}
              onChange={(e) => setFormData({ ...formData, farm: e.target.value })}
              required
            >
              <option value="" disabled>
                Select Farm
              </option>
              {farms.map((f) => (
                <option key={f._id} value={f._id}>
                  {f.name} ({f.totalArea} ac, {f.soilType} Soil)
                </option>
              ))}
            </select>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
            <div className="form-group">
              <label className="form-label">Crop Name *</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. Wheat (Sharbati), Basmati Rice"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Variety / Hybrid</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. HD-2967, Pusa 1121"
                value={formData.variety}
                onChange={(e) => setFormData({ ...formData, variety: e.target.value })}
              />
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
            <div className="form-group">
              <label className="form-label">Crop Category</label>
              <select
                className="form-select"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Allocated Acreage *</label>
              <input
                type="number"
                step="0.1"
                min="0.1"
                className="form-input"
                value={formData.allocatedArea}
                onChange={(e) => setFormData({ ...formData, allocatedArea: e.target.value })}
                required
              />
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
            <div className="form-group">
              <label className="form-label">Sowing / Planting Date *</label>
              <input
                type="date"
                className="form-input"
                value={formData.plantingDate}
                onChange={(e) => setFormData({ ...formData, plantingDate: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Expected Harvest Date *</label>
              <input
                type="date"
                className="form-input"
                value={formData.expectedHarvestDate}
                onChange={(e) => setFormData({ ...formData, expectedHarvestDate: e.target.value })}
                required
              />
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
            <div className="form-group">
              <label className="form-label">Phenological Growth Stage</label>
              <select
                className="form-select"
                value={formData.growthStage}
                onChange={(e) => setFormData({ ...formData, growthStage: e.target.value })}
              >
                {CROP_STAGES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Health Assessment</label>
              <select
                className="form-select"
                value={formData.currentHealthStatus}
                onChange={(e) => setFormData({ ...formData, currentHealthStatus: e.target.value })}
              >
                <option value="Healthy">Healthy</option>
                <option value="Mild Stress">Mild Stress</option>
                <option value="Moderate Risk">Moderate Risk</option>
                <option value="Critical">Critical</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Expected Yield (Kg)</label>
            <input
              type="number"
              step="1"
              min="0"
              className="form-input"
              placeholder="e.g. 150"
              value={formData.expectedYield}
              onChange={(e) => setFormData({ ...formData, expectedYield: e.target.value })}
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
              {submitting ? "Saving..." : isEditing ? "Update Crop" : "Save Crop"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default CropsPage;

