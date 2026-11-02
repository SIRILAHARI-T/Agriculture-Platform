import React, { useState, useEffect } from "react";
import { Droplets, Plus, Calendar, CheckCircle2, Clock, CloudRain, AlertCircle } from "lucide-react";
import API from "../services/api";
import Modal from "../components/common/Modal";
import AlertBadge from "../components/common/AlertBadge";
import LoadingSpinner from "../components/common/LoadingSpinner";


const METHODS = ["Drip", "Sprinkler", "Furrow", "Flood", "Center Pivot"];


const IrrigationPage = () => {
  const [overview, setOverview] = useState(null);
  const [schedules, setSchedules] = useState([]);
  const [crops, setCrops] = useState([]);
  const [farms, setFarms] = useState([]);
  const [loading, setLoading] = useState(true);


  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    crop: "",
    farm: "",
    waterRequirementMm: "20",
    waterRequirementLiters: "100000",
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
      const [overviewRes, schedRes, cropsRes, farmsRes] = await Promise.all([
        API.get("/irrigation/overview"),
        API.get("/irrigation/schedules"),
        API.get("/crops"),
        API.get("/farms"),
      ]);
      if (overviewRes.data.success) setOverview(overviewRes.data);
      if (schedRes.data.success) setSchedules(schedRes.data.schedules);
      if (cropsRes.data.success) setCrops(cropsRes.data.crops);
      if (farmsRes.data.success) setFarms(farmsRes.data.farms);
    } catch (err) {
      console.error("Failed to load irrigation data:", err);
    } finally {
      setLoading(false);
    }
  };


  const openModal = () => {
    const firstCrop = crops.length > 0 ? crops[0] : null;
    const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split("T")[0];


    setFormData({
      crop: firstCrop ? firstCrop._id : "",
      farm: firstCrop ? (firstCrop.farm?._id || firstCrop.farm) : "",
      waterRequirementMm: "22",
      waterRequirementLiters: "85000",
      irrigationMethod: "Drip",
      scheduledDate: tomorrow,
      notes: "Optimal early morning run",
    });
    setIsModalOpen(true);
  };


  const handleCropChange = (cropId) => {
    const matched = crops.find((c) => c._id === cropId);
    setFormData((prev) => ({
      ...prev,
      crop: cropId,
      farm: matched ? (matched.farm?._id || matched.farm) : prev.farm,
    }));
  };


  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);


    const payload = {
      ...formData,
      waterRequirementMm: parseFloat(formData.waterRequirementMm),
      waterRequirementLiters: parseFloat(formData.waterRequirementLiters),
    };


    try {
      await API.post("/irrigation/schedules", payload);
      setIsModalOpen(false);
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to create watering schedule.");
    } finally {
      setSubmitting(false);
    }
  };


  const handleStatusUpdate = async (scheduleId, newStatus) => {
    try {
      await API.patch(`/irrigation/schedules/${scheduleId}/status`, { status: newStatus });
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


      {/* Top Metrics Row */}
      <div className="grid-3">
        <div className="card" style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <div className="stat-icon-wrapper stat-icon-blue">
            <Droplets size={26} />
          </div>
          <div>
            <div className="stat-info-label">Daily Water Needed</div>
            <div className="stat-info-value">
              {Math.round((overview?.totalDailyLiters || 0) / 1000)}k Liters
            </div>
            <div className="stat-info-sub">For all active crops</div>
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
            <div className="stat-info-value">{schedules.filter((s) => s.status === "Pending").length}</div>
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
              {cropReqs.map((req, idx) => (
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
                    <strong>{req.cropFactorKc}</strong>
                  </td>
                  <td>{req.soilType}</td>
                  <td>
                    <strong style={{ color: "var(--primary)", fontSize: "0.95rem" }}>
                      {req.netWaterRequirementMm} mm
                    </strong>
                  </td>
                  <td>{req.totalWaterLiters.toLocaleString()} L</td>
                  <td>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      <AlertBadge text={req.recommendationStatus} />
                      <span style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>
                        {req.reason}
                      </span>
                    </div>
                  </td>
                </tr>
              ))}
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
              <span className="card-subtitle">See upcoming watering plans and completed watering</span>
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
                      <strong>{new Date(sched.scheduledDate).toLocaleDateString()}</strong>
                    </td>
                    <td>
                      <strong>{sched.crop?.name}</strong>
                      <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                        {sched.farm?.name}
                      </div>
                    </td>
                    <td>
                      <span className="badge badge-info">{sched.irrigationMethod}</span>
                    </td>
                    <td>
                      <strong>{sched.waterRequirementMm} mm</strong>
                      <div style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>
                        ~{sched.waterRequirementLiters?.toLocaleString()} L
                      </div>
                    </td>
                    <td>
                      <AlertBadge text={sched.status} />
                    </td>
                    <td>
                      <div style={{ display: "flex", gap: "6px" }}>
                        {sched.status === "Pending" && (
                          <button
                            className="btn btn-outline-primary btn-sm"
                            onClick={() => handleStatusUpdate(sched._id, "Completed")}
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
                          >
                            Delay
                          </button>
                        )}
                        <button
                          className="btn btn-danger btn-sm"
                          onClick={() => handleDeleteSchedule(sched._id)}
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
          <p style={{ color: "var(--text-muted)", fontSize: "0.88rem", padding: "16px 0" }}>
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
                onChange={(e) => setFormData({ ...formData, irrigationMethod: e.target.value })}
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
                onChange={(e) => setFormData({ ...formData, scheduledDate: e.target.value })}
                required
              />
            </div>
          </div>


          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
            <div className="form-group">
              <label className="form-label">Water Depth (mm) *</label>
              <input
                type="number"
                step="1"
                min="1"
                className="form-input"
                value={formData.waterRequirementMm}
                onChange={(e) => setFormData({ ...formData, waterRequirementMm: e.target.value })}
                required
              />
            </div>


            <div className="form-group">
              <label className="form-label">Estimated Water (Liters)</label>
              <input
                type="number"
                className="form-input"
                value={formData.waterRequirementLiters}
                onChange={(e) => setFormData({ ...formData, waterRequirementLiters: e.target.value })}
              />
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

