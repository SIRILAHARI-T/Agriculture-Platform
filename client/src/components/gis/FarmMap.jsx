import React, { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, Circle, useMapEvents } from "react-leaflet";
import L from "leaflet";
import { MapPin, Layers } from "lucide-react";

// Modern custom SVG marker for Farms
const farmMarkerIcon = L.divIcon({
  className: "custom-farm-pin",
  html: `
    <div style="
      background: #15803d;
      width: 34px;
      height: 34px;
      border-radius: 50% 50% 50% 0;
      transform: rotate(-45deg);
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 4px 12px rgba(21, 128, 61, 0.45);
      border: 2px solid #ffffff;
    ">
      <div style="
        transform: rotate(45deg);
        color: white;
        font-size: 16px;
        line-height: 1;
      ">🌱</div>
    </div>
  `,
  iconSize: [34, 34],
  iconAnchor: [17, 34],
  popupAnchor: [0, -32],
});

// Pin for coordinate picker
const pickerMarkerIcon = L.divIcon({
  className: "custom-picker-pin",
  html: `
    <div style="
      background: #ef4444;
      width: 32px;
      height: 32px;
      border-radius: 50% 50% 50% 0;
      transform: rotate(-45deg);
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 4px 12px rgba(239, 68, 68, 0.45);
      border: 2px solid #ffffff;
    ">
      <div style="
        transform: rotate(45deg);
        color: white;
        font-size: 14px;
        line-height: 1;
      ">📍</div>
    </div>
  `,
  iconSize: [32, 32],
  iconAnchor: [16, 32],
  popupAnchor: [0, -30],
});

// Helper component for map clicks
function LocationPickerHandler({ onPick }) {
  useMapEvents({
    click(e) {
      if (onPick) {
        onPick(e.latlng.lat, e.latlng.lng);
      }
    },
  });
  return null;
}

const FarmMap = ({
  farms = [],
  selectedFarm = null,
  isPickerMode = false,
  pickedLocation = null,
  onPickLocation = null,
  height = "420px",
}) => {
  // Center determination
  let center = [24.0, 78.0]; // Default India central geographic view
  let zoom = 5;

  if (selectedFarm && selectedFarm.coordinates?.latitude) {
    center = [selectedFarm.coordinates.latitude, selectedFarm.coordinates.longitude];
    zoom = 12;
  } else if (farms.length > 0 && farms[0].coordinates?.latitude) {
    center = [farms[0].coordinates.latitude, farms[0].coordinates.longitude];
    zoom = 8;
  }

  if (isPickerMode && pickedLocation?.latitude) {
    center = [pickedLocation.latitude, pickedLocation.longitude];
    zoom = 10;
  }

  return (
    <div className="map-container-wrapper" style={{ height }}>
      {isPickerMode && (
        <div
          style={{
            position: "absolute",
            top: 12,
            right: 12,
            zIndex: 1000,
            background: "rgba(15, 23, 42, 0.85)",
            color: "white",
            padding: "6px 14px",
            borderRadius: "20px",
            fontSize: "0.8rem",
            fontWeight: 600,
            backdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "center",
            gap: "6px",
          }}
        >
          <MapPin size={14} color="#4ade80" /> Click on the map to choose your farm location
        </div>
      )}

      <MapContainer
        center={center}
        zoom={zoom}
        scrollWheelZoom={true}
        style={{ width: "100%", height: "100%" }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {isPickerMode && <LocationPickerHandler onPick={onPickLocation} />}

        {/* Render interactive Farm markers */}
        {!isPickerMode &&
          farms.map((farm) => {
            if (!farm.coordinates?.latitude || !farm.coordinates?.longitude) return null;
            const lat = farm.coordinates.latitude;
            const lng = farm.coordinates.longitude;
            const radiusMeters = Math.max(150, Math.sqrt((farm.totalArea || 1) * 4047 / Math.PI));

            return (
              <React.Fragment key={farm._id}>
                {/* Visual Field Boundary Radius */}
                <Circle
                  center={[lat, lng]}
                  radius={radiusMeters}
                  pathOptions={{
                    color: "#16a34a",
                    fillColor: "#22c55e",
                    fillOpacity: 0.18,
                    weight: 2,
                  }}
                />

                <Marker position={[lat, lng]} icon={farmMarkerIcon}>
                  <Popup>
                    <div style={{ padding: "4px 2px", minWidth: "180px" }}>
                      <h4 style={{ margin: "0 0 4px 0", color: "#15803d", fontSize: "1rem" }}>
                        {farm.name}
                      </h4>
                      <p style={{ margin: "2px 0", fontSize: "0.82rem", color: "#475569" }}>
                        <strong>Farm Area:</strong> {farm.totalArea} Acres
                      </p>
                      <p style={{ margin: "2px 0", fontSize: "0.82rem", color: "#475569" }}>
                        <strong>Soil:</strong> {farm.soilType} (pH {farm.soilPh || "6.8"})
                      </p>
                      <p style={{ margin: "2px 0", fontSize: "0.82rem", color: "#475569" }}>
                        <strong>Location:</strong> {farm.location?.district || farm.location?.state || "Registered Farm"}
                      </p>
                      <p style={{ margin: "4px 0 0 0", fontSize: "0.75rem", color: "#94a3b8" }}>
                        Map Coordinates: {lat.toFixed(4)}, {lng.toFixed(4)}
                      </p>
                    </div>
                  </Popup>
                </Marker>
              </React.Fragment>
            );
          })}

        {/* Selected or picked pin in picker mode */}
        {isPickerMode && pickedLocation?.latitude && pickedLocation?.longitude && (
          <Marker
            position={[pickedLocation.latitude, pickedLocation.longitude]}
            icon={pickerMarkerIcon}
          >
            <Popup>
              <span style={{ fontSize: "0.85rem" }}>
                Selected Farm Location: {pickedLocation.latitude.toFixed(4)},{" "}
                {pickedLocation.longitude.toFixed(4)}
              </span>
            </Popup>
          </Marker>
        )}
      </MapContainer>
    </div>
  );
};

export default FarmMap;

