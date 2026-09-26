const addressForm = document.getElementById("addressForm");
const addressInput = document.getElementById("addressInput");
const statusEl = document.getElementById("status");
const nearestList = document.getElementById("nearestList");
const printButton = document.getElementById("printButton");
const mapViewport = document.getElementById("mapViewport");
const mapStage = document.getElementById("mapStage");
const mapImage = document.getElementById("mapImage");
const mapPlaceholder = document.getElementById("mapPlaceholder");
const facilityMarkerLayer = document.getElementById("facilityMarkerLayer");
const homeMarkerLayer = document.getElementById("homeMarkerLayer");
const zoomInButton = document.getElementById("zoomInButton");
const zoomOutButton = document.getElementById("zoomOutButton");
const resetMapButton = document.getElementById("resetMapButton");

let mapState = { scale: 1, x: 0, y: 0 };
let dragState = null;

function hasMapBounds() {
  const b = APP_CONFIG.mapBounds;
  return [b.north, b.south, b.west, b.east].every(Number.isFinite);
}

function hasMapReady() {
  return hasMapBounds() && mapImage.complete && mapImage.naturalWidth > 0;
}

function toRadians(value) {
  return value * Math.PI / 180;
}

function haversineDistanceKm(lat1, lon1, lat2, lon2) {
  const earthRadiusKm = 6371.0088;
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLon / 2) ** 2;

  return 2 * earthRadiusKm * Math.asin(Math.sqrt(a));
}

function getNearestFacilities(latitude, longitude, limit = 3) {
  return FACILITIES
    .filter(f => Number.isFinite(f.latitude) && Number.isFinite(f.longitude))
    .map(f => ({
      ...f,
      distanceKm: haversineDistanceKm(
        latitude,
        longitude,
        f.latitude,
        f.longitude
      )
    }))
    .sort((a, b) => a.distanceKm - b.distanceKm)
    .slice(0, limit);
}

function renderNearestFacilities(facilities) {
  nearestList.replaceChildren();

  if (!facilities.length) {
    const p = document.createElement("p");
    p.className = "empty";
    p.textContent = "距離計算できる施設データがありません。";
    nearestList.append(p);
    return;
  }

  facilities.forEach((facility, index) => {
    const card = document.createElement("article");
    card.className = "facility-card";

    const rank = document.createElement("div");
    rank.className = "rank";
    rank.textContent = String(index + 1);

    const name = document.createElement("h3");
    name.textContent = facility.name;

    const address = document.createElement("p");
    address.textContent = facility.address;

    const distance = document.createElement("p");
    distance.className = "distance";
    distance.textContent = `直線距離 約${facility.distanceKm.toFixed(1)} km`;

    card.append(rank, name, address, distance);
    nearestList.append(card);
  });
}

function mercatorY(latitude) {
  const lat = Math.max(-85.05112878, Math.min(85.05112878, latitude));
  const rad = toRadians(lat);
  return Math.log(Math.tan(Math.PI / 4 + rad / 2));
}

function latLonToPercent(latitude, longitude) {
  const b = APP_CONFIG.mapBounds;
  const x = (longitude - b.west) / (b.east - b.west);

  const northY = mercatorY(b.north);
  const southY = mercatorY(b.south);
  const pointY = mercatorY(latitude);
  const y = (northY - pointY) / (northY - southY);

  return { x: x * 100, y: y * 100 };
}

function createMarker(latitude, longitude, type, label) {
  if (!hasMapBounds()) return null;

  const point = latLonToPercent(latitude, longitude);
  const marker = document.createElement("div");
  marker.className = `marker marker-${type}`;
  marker.style.left = `${point.x}%`;
  marker.style.top = `${point.y}%`;
  marker.textContent = type === "home" ? "★" : "●";
  marker.title = label;
  return marker;
}

function renderFacilityMarkers() {
  facilityMarkerLayer.replaceChildren();
  if (!hasMapBounds()) return;

  FACILITIES
    .filter(f => Number.isFinite(f.latitude) && Number.isFinite(f.longitude))
    .forEach(f => {
      const marker = createMarker(f.latitude, f.longitude, "facility", f.name);
      if (marker) facilityMarkerLayer.append(marker);
    });
}

function renderHomeMarker(latitude, longitude) {
  homeMarkerLayer.replaceChildren();
  const marker = createMarker(latitude, longitude, "home", "検索した住所");
  if (marker) homeMarkerLayer.append(marker);
}

function applyMapTransform() {
  mapStage.style.transform =
    `translate(${mapState.x}px, ${mapState.y}px) scale(${mapState.scale})`;
}

function resetMap() {
  mapState = { scale: 1, x: 0, y: 0 };
  applyMapTransform();
}

function changeZoom(factor, centerX = mapViewport.clientWidth / 2, centerY = mapViewport.clientHeight / 2) {
  const oldScale = mapState.scale;
  const nextScale = Math.min(5, Math.max(1, oldScale * factor));
  if (nextScale === oldScale) return;

  const ratio = nextScale / oldScale;
  mapState.x = centerX - (centerX - mapState.x) * ratio;
  mapState.y = centerY - (centerY - mapState.y) * ratio;
  mapState.scale = nextScale;
  applyMapTransform();
}

async function geocodeAddress(address) {
  if (!APP_CONFIG.geocoder.provider || !APP_CONFIG.geocoder.endpoint) {
    throw new Error("GEOCODER_NOT_CONFIGURED");
  }

  throw new Error("GEOCODER_NOT_IMPLEMENTED");
}

addressForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const address = addressInput.value.trim();

  if (!address) {
    statusEl.textContent = "住所を入力してください。";
    return;
  }

  statusEl.textContent = "住所を検索しています…";

  try {
    const { latitude, longitude } = await geocodeAddress(address);

    renderHomeMarker(latitude, longitude);
    renderNearestFacilities(getNearestFacilities(latitude, longitude, 3));

    statusEl.textContent = `「${address}」の周辺施設を表示しました。`;
  } catch (error) {
    if (error.message === "GEOCODER_NOT_CONFIGURED") {
      statusEl.textContent =
        "画面と距離計算の土台は完成しています。住所検索サービスの接続は次の工程です。";
      return;
    }

    console.error(error);
    statusEl.textContent = "住所を検索できませんでした。";
  }
});

printButton.addEventListener("click", () => window.print());
zoomInButton.addEventListener("click", () => changeZoom(1.25));
zoomOutButton.addEventListener("click", () => changeZoom(0.8));
resetMapButton.addEventListener("click", resetMap);

mapViewport.addEventListener("pointerdown", (event) => {
  if (mapState.scale <= 1) return;
  dragState = {
    pointerId: event.pointerId,
    startX: event.clientX,
    startY: event.clientY,
    originX: mapState.x,
    originY: mapState.y
  };
  mapViewport.setPointerCapture(event.pointerId);
});

mapViewport.addEventListener("pointermove", (event) => {
  if (!dragState || dragState.pointerId !== event.pointerId) return;
  mapState.x = dragState.originX + event.clientX - dragState.startX;
  mapState.y = dragState.originY + event.clientY - dragState.startY;
  applyMapTransform();
});

mapViewport.addEventListener("pointerup", () => {
  dragState = null;
});

mapViewport.addEventListener("wheel", (event) => {
  event.preventDefault();
  const rect = mapViewport.getBoundingClientRect();
  changeZoom(
    event.deltaY < 0 ? 1.12 : 0.9,
    event.clientX - rect.left,
    event.clientY - rect.top
  );
}, { passive: false });

mapImage.addEventListener("load", () => {
  if (hasMapBounds()) {
    mapPlaceholder.hidden = true;
    renderFacilityMarkers();
  }
});

mapImage.addEventListener("error", () => {
  mapPlaceholder.hidden = false;
});

mapImage.src = APP_CONFIG.mapImage;
resetMap();
