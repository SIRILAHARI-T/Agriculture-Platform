import React from "react";

const AlertBadge = ({ text, priority, type }) => {
  let badgeClass = "badge-neutral";
  const val = (priority || type || text || "").toLowerCase();

  if (val.includes("high") || val.includes("critical") || val.includes("danger") || val.includes("down")) {
    badgeClass = "badge-danger";
  } else if (val.includes("medium") || val.includes("warning") || val.includes("stress") || val.includes("moderate")) {
    badgeClass = "badge-warning";
  } else if (val.includes("low") || val.includes("healthy") || val.includes("optimal") || val.includes("success") || val.includes("up")) {
    badgeClass = "badge-success";
  } else if (val.includes("info") || val.includes("cereal") || val.includes("pending")) {
    badgeClass = "badge-info";
  }

  return <span className={`badge ${badgeClass}`}>{text || priority || type}</span>;
};

export default AlertBadge;

