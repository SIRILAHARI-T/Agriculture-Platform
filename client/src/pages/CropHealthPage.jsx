import React, { useState, useEffect } from "react";
import { Plus, ShieldAlert, CheckCircle2, AlertTriangle, BookOpen, Trash2 } from "lucide-react";
import API from "../services/api";
import Modal from "../components/common/Modal";
import AlertBadge from "../components/common/AlertBadge";
import LoadingSpinner from "../components/common/LoadingSpinner";


const CropHealthPage = () => {
  const [logs, setLogs] = useState([]);
  const [crops, setCrops] = useState([]);
  const [farms, setFarms] = useState([]);
  const [library, setLibrary] = useState([]);
  const [loading, setLoading] = useState(true);


  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    crop: "",
    farm: "",
    status: "Moderate Risk",
    symptoms: "",
    diagnosis: "",
    severity: "Medium",
    suggestedActions: "",
    notes: "",
  });
  const [submitting, setSubmitting] = useState(false);


  useEffect(() => {
    fetchData();
  }, []);


  const fetchData = async () => {
    try {
      setLoading(true);
      const [logsRes, cropsRes, farmsRes, libRes] = await Promise.all([
        API.get("/health"),
        API.get("/crops"),
        API.get("/farms"),
        API.get("/health/diagnostics-library"),
      ]);
      if (logsRes.data.success) setLogs(logsRes.data.logs);
      if (cropsRes.data.success) setCrops(cropsRes.data.crops);
      if (farmsRes.data.success) setFarms(farmsRes.data.farms);
      if (libRes.data.success) setLibrary(libRes.data.library);
    } catch (err) {
      console.error("Failed to load health monitoring data:", err);
    } finally {
      setLoading(false);
    }
  };


  const openModal = () => {
    const firstCrop = crops.length > 0 ? crops[0] : null;
    setFormData({
      crop: firstCrop ? firstCrop._id : "",
      farm: firstCrop ? (firstCrop.farm?._id || firstCrop.farm) : "",
      status: "Moderate Risk",
      symptoms: "",
      diagnosis: "",
      severity: "Medium",
      suggestedActions: "",
      notes: "",
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


  const handleLibrarySelect = (item) => {
    setFormData((prev) => ({
      ...prev,
      diagnosis: item.diagnosis,
      symptoms: item.symptoms.join(", "),
      suggestedActions: item.suggestedActions.join("\n"),
      severity: item.severity,
      status: item.severity === "High" ? "Critical" : "Moderate Risk",
    }));
  };


  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);


    const symArray = formData.symptoms
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);


    const actionArray = formData.suggestedActions
      .split("\n")
      .map((a) => a.trim())
      .filter(Boolean);


    const payload = {
      crop: formData.crop,
      farm: formData.farm,
      status: formData.status,
      symptoms: symArray,
      diagnosis: formData.diagnosis || "Crop Health Inspection",
      severity: formData.severity,
      suggestedActions: actionArray,
      notes: formData.notes,
    };


    try {
      await API.post("/health", payload);
      setIsModalOpen(false);
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to record crop health information.");
    } finally {
      setSubmitting(false);
    }
  };


  const handleToggleResolve = async (logId) => {
    try {
      await API.patch(`/health/${logId}/resolve`);
      fetchData();
    } catch (err) {
      alert("Failed to update problem status.");
    }
  };


  const handleDelete = async (logId) => {
    if (!window.confirm("Delete this crop health record?")) return;
    try {
      await API.delete(`/health/${logId}`);
      fetchData();
    } catch (err) {
      alert("Failed to delete record.");
    }
  };


  if (loading) return <LoadingSpinner message="Checking your crop health information..." />;


  const activeIssues = logs.filter((l) => !l.resolved);
  const resolvedIssues = logs.filter((l) => l.resolved);


  return (
    <div>
      {/* Top Header */}
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
          <h2 style={{ fontSize: "1.2rem", fontWeight: 700 }}>
            Crop Health & Disease Check
          </h2>
          <p style={{ fontSize: "0.82rem", color: "var(--text-muted)" }}>
            Check crop symptoms, pests, and ways to protect your crops
          </p>
        </div>


        <button className="btn btn-primary" onClick={openModal}>
          <Plus size={18} /> Record Problem
        </button>
      </div>


      {/* Metric Summary */}
      <div className="grid-3">
        <div className="card" style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <div className="stat-icon-wrapper stat-icon-amber">
            <ShieldAlert size={26} />
          </div>
          <div>
            <div className="stat-info-label">Current Crop Problems</div>
            <div className="stat-info-value">{activeIssues.length}</div>
            <div className="stat-info-sub">Needs attention</div>
          </div>
        </div>


        <div className="card" style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <div className="stat-icon-wrapper stat-icon-green">
            <CheckCircle2 size={26} />
          </div>
          <div>
            <div className="stat-info-label">Resolved Problems</div>
            <div className="stat-info-value">{resolvedIssues.length}</div>
            <div className="stat-info-sub">Successfully treated</div>
          </div>
        </div>


        <div className="card" style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <div className="stat-icon-wrapper stat-icon-blue">
            <BookOpen size={26} />
          </div>
          <div>
            <div className="stat-info-label">Crop Problem Library</div>
            <div className="stat-info-value">{library.length}</div>
            <div className="stat-info-sub">Pest and disease information</div>
          </div>
        </div>
      </div>


      {/* Active Health Observations List */}
      <div className="card" style={{ marginBottom: "24px" }}>
        <div className="card-header">
          <div className="card-header-left">
            <AlertTriangle size={20} color="#d97706" />
            <div>
              <h3>Current Crop Problems ({activeIssues.length})</h3>
              <span className="card-subtitle">Problems that need checking and treatment</span>
            </div>
          </div>
        </div>


        {activeIssues.length > 0 ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
            {activeIssues.map((log) => (
              <div
                key={log._id}
                style={{
                  border: "1px solid var(--border-color)",
                  borderRadius: "var(--radius-md)",
                  padding: "16px",
                  background: "#ffffff",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    flexWrap: "wrap",
                    gap: "10px",
                    marginBottom: "10px",
                  }}
                >
                  <div>
                    <h4 style={{ fontSize: "1.05rem", color: "var(--text-primary)" }}>
                      {log.diagnosis}
                    </h4>
                    <p style={{ fontSize: "0.82rem", color: "var(--text-muted)" }}>
                      Crop: <strong>{log.crop?.name}</strong> • Farm:{" "}
                      <strong>{log.farm?.name}</strong> • Date:{" "}
                      {new Date(log.date).toLocaleDateString()}
                    </p>
                  </div>


                  <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                    <AlertBadge priority={log.severity} text={`Problem Level: ${log.severity}`} />
                    <AlertBadge text={log.status} />
                    <button
                      className="btn btn-outline-primary btn-sm"
                      onClick={() => handleToggleResolve(log._id)}
                      title="Mark as resolved"
                    >
                      <CheckCircle2 size={14} /> Mark Resolved
                    </button>
                    <button
                      className="btn btn-danger btn-sm"
                      onClick={() => handleDelete(log._id)}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>


                {log.symptoms && log.symptoms.length > 0 && (
                  <div style={{ marginBottom: "10px", fontSize: "0.85rem" }}>
                    <strong style={{ color: "var(--text-secondary)" }}>Symptoms Seen: </strong>
                    <span>{log.symptoms.join(", ")}</span>
                  </div>
                )}


                {log.suggestedActions && log.suggestedActions.length > 0 && (
                  <div
                    style={{
                      background: "var(--bg-subtle)",
                      padding: "10px 14px",
                      borderRadius: "var(--radius-sm)",
                      borderLeft: "3px solid var(--primary)",
                      fontSize: "0.84rem",
                    }}
                  >
                    <strong>What to Do:</strong>
                    <ul style={{ paddingLeft: "20px", marginTop: "4px" }}>
                      {log.suggestedActions.map((action, i) => (
                        <li key={i}>{action}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p style={{ color: "var(--text-muted)", fontSize: "0.9rem", padding: "12px 0" }}>
            No crop health problems recorded. Your crops look healthy.
          </p>
        )}
      </div>


      {/* Resolved History */}
      {resolvedIssues.length > 0 && (
        <div className="card">
          <h3 style={{ fontSize: "1.05rem", marginBottom: "14px" }}>
            Treatment History & Resolved Problems ({resolvedIssues.length})
          </h3>
          <div className="table-responsive">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Problem</th>
                  <th>Crop</th>
                  <th>Date Reported</th>
                  <th>Date Resolved</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {resolvedIssues.map((log) => (
                  <tr key={log._id}>
                    <td>
                      <strong>{log.diagnosis}</strong>
                    </td>
                    <td>{log.crop?.name}</td>
                    <td>{new Date(log.date).toLocaleDateString()}</td>
                    <td>{log.resolvedDate ? new Date(log.resolvedDate).toLocaleDateString() : "—"}</td>
                    <td>
                      <span className="badge badge-success">Resolved</span>
                    </td>
                    <td>
                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={() => handleToggleResolve(log._id)}
                      >
                        Re-open
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}


      {/* Add Observation Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Record Crop Health Problem"
        maxWidth="680px"
      >
        <form onSubmit={handleSubmit}>
          {/* Quick template selector from pathology library */}
          <div style={{ marginBottom: "16px" }}>
            <label className="form-label" style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <BookOpen size={15} /> Quick Fill from Crop Problem Library:
            </label>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
              {library.map((item, idx) => (
                <button
                  type="button"
                  key={idx}
                  onClick={() => handleLibrarySelect(item)}
                  style={{
                    background: "var(--bg-subtle)",
                    border: "1px solid var(--border-color)",
                    padding: "4px 10px",
                    borderRadius: "var(--radius-full)",
                    fontSize: "0.76rem",
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  + {item.diagnosis}
                </button>
              ))}
            </div>
          </div>


          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
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
                    {c.name} ({c.growthStage})
                  </option>
                ))}
              </select>
            </div>


            <div className="form-group">
              <label className="form-label">Problem Level</label>
              <select
                className="form-select"
                value={formData.severity}
                onChange={(e) => setFormData({ ...formData, severity: e.target.value })}
              >
                <option value="None">None (Regular Check)</option>
                <option value="Low">Low (A few plants)</option>
                <option value="Medium">Medium (Some areas of the field)</option>
                <option value="High">High (Spread across the field)</option>
              </select>
            </div>
          </div>


          <div className="form-group">
            <label className="form-label">Problem / Issue *</label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g. Early Blight, Aphid Infestation, Nitrogen Deficiency"
              value={formData.diagnosis}
              onChange={(e) => setFormData({ ...formData, diagnosis: e.target.value })}
              required
            />
          </div>


          <div className="form-group">
            <label className="form-label">Symptoms</label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g. Yellowing leaves, Dark spots, Curled foliage"
              value={formData.symptoms}
              onChange={(e) => setFormData({ ...formData, symptoms: e.target.value })}
            />
          </div>


          <div className="form-group">
            <label className="form-label">What to Do (one per line)</label>
            <textarea
              className="form-textarea"
              placeholder="e.g. Spray Neem oil (3ml/L)&#10;Remove infected lower leaves"
              value={formData.suggestedActions}
              onChange={(e) => setFormData({ ...formData, suggestedActions: e.target.value })}
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
              {submitting ? "Saving..." : "Save Record"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};


export default CropHealthPage;

