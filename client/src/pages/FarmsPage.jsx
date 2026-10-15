import React, { useState, useEffect } from "react";
import { Plus, Edit2, Trash2, MapPin, Layers, Globe } from "lucide-react";
import API from "../services/api";
import FarmMap from "../components/gis/FarmMap";
import Modal from "../components/common/Modal";
import AlertBadge from "../components/common/AlertBadge";
import LoadingSpinner from "../components/common/LoadingSpinner";

const SOIL_OPTIONS = ["Alluvial", "Black", "Red", "Clay", "Loamy", "Sandy", "Silt"];

const FarmsPage = () => {
  const [farms, setFarms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedFarm, setSelectedFarm] = useState(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentFarmId, setCurrentFarmId] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    totalArea: "",
    soilType: "Loamy",
    soilPh: "6.8",
    organicMatter: "2.5",
    latitude: "30.9010",
    longitude: "75.8573",
    district: "Ludhiana",
    state: "Punjab",
    notes: "",
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchFarms();
  }, []);

  const fetchFarms = async () => {
    try {
      setLoading(true);
      const res = await API.get("/farms");
      if (res.data.success) {
        setFarms(res.data.farms);
        if (res.data.farms.length > 0) {
          setSelectedFarm(res.data.farms[0]);
        }
      }
    } catch (err) {
      console.error("Failed to fetch farms:", err);
    } finally {
      setLoading(false);
    }
  };

  const openCreateModal = () => {
    setIsEditing(false);
    setCurrentFarmId(null);
    setFormData({
      name: "",
      totalArea: "10",
      soilType: "Loamy",
      soilPh: "6.8",
      organicMatter: "2.5",
      latitude: "30.9010",
      longitude: "75.8573",
      district: "Ludhiana",
      state: "Punjab",
      notes: "",
    });
    setIsModalOpen(true);
  };

  const openEditModal = (farm) => {
    setIsEditing(true);
    setCurrentFarmId(farm._id);
    setFormData({
      name: farm.name,
      totalArea: farm.totalArea.toString(),
      soilType: farm.soilType || "Loamy",
      soilPh: (farm.soilPh || 6.8).toString(),
      organicMatter: (farm.organicMatter || 2.5).toString(),
      latitude: farm.coordinates?.latitude?.toString() || "30.9010",
      longitude: farm.coordinates?.longitude?.toString() || "75.8573",
      district: farm.location?.district || "",
      state: farm.location?.state || "",
      notes: farm.notes || "",
    });
    setIsModalOpen(true);
  };

  const handleLocationPick = (lat, lng) => {
    setFormData((prev) => ({
      ...prev,
      latitude: lat.toFixed(5),
      longitude: lng.toFixed(5),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    const payload = {
      name: formData.name,
      totalArea: parseFloat(formData.totalArea),
      soilType: formData.soilType,
      soilPh: parseFloat(formData.soilPh),
      organicMatter: parseFloat(formData.organicMatter),
      coordinates: {
        latitude: parseFloat(formData.latitude),
        longitude: parseFloat(formData.longitude),
      },
      location: {
        district: formData.district,
        state: formData.state,
      },
      notes: formData.notes,
    };

    try {
      if (isEditing) {
        await API.put(`/farms/${currentFarmId}`, payload);
      } else {
        await API.post("/farms", payload);
      }
      setIsModalOpen(false);
      fetchFarms();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to save farm.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete farm "${name}" and its associated crops?`)) {
      return;
    }

    try {
      await API.delete(`/farms/${id}`);
      fetchFarms();
    } catch (err) {
      alert("Failed to delete farm.");
    }
  };

  if (loading) return <LoadingSpinner message="Loading GIS farm mapping..." />;

  return (
    <div>
      {/* Top action header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "20px",
        }}
      >
        <div>
          <h2 style={{ fontSize: "1.2rem", fontWeight: 700 }}>Registered Farmlands ({farms.length})</h2>
          <p style={{ fontSize: "0.82rem", color: "var(--text-muted)" }}>
            Manage GIS coordinates, soil characteristics, and physical acreage
          </p>
        </div>
        <button className="btn btn-primary" onClick={openCreateModal}>
          <Plus size={18} /> Add New Farm
        </button>
      </div>

      {/* Main Layout: Map on top / left, Cards on bottom / right */}
      <div className="card" style={{ marginBottom: "24px" }}>
        <div className="card-header">
          <div className="card-header-left">
            <Globe size={20} color="var(--primary)" />
            <div>
              <h3>Interactive GIS Field Map</h3>
              <span className="card-subtitle">
                Click any marker to inspect boundary radiuses and soil attributes
              </span>
            </div>
          </div>
          {selectedFarm && (
            <span style={{ fontSize: "0.82rem", color: "var(--text-muted)" }}>
              Selected: <strong>{selectedFarm.name}</strong> ({selectedFarm.totalArea} ac)
            </span>
          )}
        </div>
        <FarmMap farms={farms} selectedFarm={selectedFarm} height="400px" />
      </div>

      {/* Farms Grid List */}
      <div className="grid-3">
        {farms.map((farm) => (
          <div
            key={farm._id}
            className="card"
            style={{
              borderColor: selectedFarm?._id === farm._id ? "var(--primary)" : "var(--border-color)",
              cursor: "pointer",
            }}
            onClick={() => setSelectedFarm(farm)}
          >
            <div className="card-header">
              <div>
                <h3 style={{ fontSize: "1.05rem", color: "var(--text-primary)" }}>{farm.name}</h3>
                <span style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>
                  {farm.location?.district || "Region"}, {farm.location?.state || "India"}
                </span>
              </div>
              <AlertBadge text={farm.soilType} />
            </div>

            <div style={{ fontSize: "0.85rem", color: "var(--text-secondary)", marginBottom: "14px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                <span>Total Acreage:</span>
                <strong>{farm.totalArea} Acres</strong>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                <span>Soil pH / Organic:</span>
                <strong>
                  pH {farm.soilPh} • {farm.organicMatter}% OM
                </strong>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                <span>GPS Coordinates:</span>
                <strong>
                  {farm.coordinates?.latitude?.toFixed(4)}, {farm.coordinates?.longitude?.toFixed(4)}
                </strong>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span>Active Crops:</span>
                <strong style={{ color: "var(--primary)" }}>{farm.cropCount || 0} Crops</strong>
              </div>
            </div>

            {farm.notes && (
              <p
                style={{
                  fontSize: "0.78rem",
                  color: "var(--text-muted)",
                  background: "var(--bg-subtle)",
                  padding: "8px",
                  borderRadius: "6px",
                  marginBottom: "12px",
                }}
              >
                {farm.notes}
              </p>
            )}

            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                gap: "8px",
                borderTop: "1px solid var(--border-color)",
                paddingTop: "12px",
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => openEditModal(farm)}
              >
                <Edit2 size={14} /> Edit
              </button>
              <button
                className="btn btn-danger btn-sm"
                onClick={() => handleDelete(farm._id, farm.name)}
              >
                <Trash2 size={14} /> Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Add / Edit Farm Modal with Map Coordinate Picker */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={isEditing ? "Edit Farm Details" : "Register New Agricultural Land"}
        maxWidth="740px"
      >
        <form onSubmit={handleSubmit}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
            <div className="form-group">
              <label className="form-label">Farm / Field Name *</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. North Ridge Agro Field"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Total Area (Acres) *</label>
              <input
                type="number"
                step="0.1"
                min="0.1"
                className="form-input"
                placeholder="e.g. 12.5"
                value={formData.totalArea}
                onChange={(e) => setFormData({ ...formData, totalArea: e.target.value })}
                required
              />
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "14px" }}>
            <div className="form-group">
              <label className="form-label">Soil Classification</label>
              <select
                className="form-select"
                value={formData.soilType}
                onChange={(e) => setFormData({ ...formData, soilType: e.target.value })}
              >
                {SOIL_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Soil pH (3.0 - 10.0)</label>
              <input
                type="number"
                step="0.1"
                min="3"
                max="10"
                className="form-input"
                value={formData.soilPh}
                onChange={(e) => setFormData({ ...formData, soilPh: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Organic Matter (%)</label>
              <input
                type="number"
                step="0.1"
                min="0"
                max="20"
                className="form-input"
                value={formData.organicMatter}
                onChange={(e) => setFormData({ ...formData, organicMatter: e.target.value })}
              />
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
            <div className="form-group">
              <label className="form-label">District / County</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. Ludhiana"
                value={formData.district}
                onChange={(e) => setFormData({ ...formData, district: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label className="form-label">State / Region</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. Punjab"
                value={formData.state}
                onChange={(e) => setFormData({ ...formData, state: e.target.value })}
              />
            </div>
          </div>

          {/* Interactive Coordinate Picker */}
          <div className="form-group">
            <label className="form-label">
              Farm GIS Coordinates (Click anywhere on map to pin or enter values)
            </label>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "10px" }}>
              <input
                type="number"
                step="any"
                className="form-input"
                placeholder="Latitude"
                value={formData.latitude}
                onChange={(e) => setFormData({ ...formData, latitude: e.target.value })}
                required
              />
              <input
                type="number"
                step="any"
                className="form-input"
                placeholder="Longitude"
                value={formData.longitude}
                onChange={(e) => setFormData({ ...formData, longitude: e.target.value })}
                required
              />
            </div>

            <FarmMap
              isPickerMode={true}
              pickedLocation={{
                latitude: parseFloat(formData.latitude) || 30.901,
                longitude: parseFloat(formData.longitude) || 75.8573,
              }}
              onPickLocation={handleLocationPick}
              height="240px"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Field Notes / Infrastructure</label>
            <textarea
              className="form-textarea"
              placeholder="Irrigation setup, borehole details, road accessibility..."
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
              {submitting ? "Saving..." : isEditing ? "Update Farm" : "Save Farm"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default FarmsPage;

