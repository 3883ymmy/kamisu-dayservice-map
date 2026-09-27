const addressForm = document.getElementById("addressForm");
const addressInput = document.getElementById("addressInput");
const currentLocationButton = document.getElementById("currentLocationButton");
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

    const phone = document.createElement("p");
    const phoneLink = document.createElement("a");
    phoneLink.className = "phone-link";
    phoneLink.href = `tel:${facility.phone.replace(/-/g, "")}`;
    phoneLink.textContent = `電話 ${facility.phone}`;
    phone.append(phoneLink);

    const distance = document.createElement("p");
    distance.className = "distance";
    distance.textContent = `直線距離 約${facility.distanceKm.toFixed(1)} km`;

    card.append(rank, name, address, phone, distance);
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

function renderHomeMarker(latitude, longitude, label = "指定した位置") {
  homeMarkerLayer.replaceChildren();
  const marker = createMarker(latitude, longitude, "home", label);
  if (marker) homeMarkerLayer.append(marker);
}

function showNearbyFacilities(latitude, longitude, label) {
  renderHomeMarker(latitude, longitude, label);
  renderNearestFacilities(getNearestFacilities(latitude, longitude, 3));
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

function normalizeAddressQuery(address) {
  const value = address
    .normalize("NFKC")
    .replace(/\s+/g, "")
    .trim();

  if (!value) return "";

  if (value.includes("神栖市")) {
    return value.startsWith("茨城県") ? value : `茨城県${value}`;
  }

  if (value.startsWith("茨城県")) {
    return value;
  }

  return `${APP_CONFIG.geocoder.defaultPrefix || ""}${value}`;
}

function isInsideConfiguredSearchArea(latitude, longitude) {
  const area = APP_CONFIG.geocoder.searchArea;
  if (!area) return true;

  return (
    latitude >= area.south &&
    latitude <= area.north &&
    longitude >= area.west &&
    longitude <= area.east
  );
}

async function geocodeAddress(address) {
  if (
    APP_CONFIG.geocoder.provider !== "gsi" ||
    !APP_CONFIG.geocoder.endpoint
  ) {
    throw new Error("GEOCODER_NOT_CONFIGURED");
  }

  const query = normalizeAddressQuery(address);
  if (!query) {
    throw new Error("GEOCODER_EMPTY_QUERY");
  }

  const url = new URL(APP_CONFIG.geocoder.endpoint);
  url.searchParams.set("q", query);
  url.searchParams.set("lang", "ja");
  url.searchParams.set("zl", "T");
  url.searchParams.set("ilvl", "T");
  url.searchParams.set("sort_il", "1");

  const response = await fetch(url.toString(), {
    method: "GET",
    headers: { "Accept": "application/json" },
    cache: "no-store"
  });

  if (!response.ok) {
    throw new Error("GEOCODER_REQUEST_FAILED");
  }

  const results = await response.json();
  if (!Array.isArray(results) || results.length === 0) {
    throw new Error("GEOCODER_NO_RESULTS");
  }

  const candidates = results
    .map(item => {
      const coordinates = item?.geometry?.coordinates;
      const longitude = Number(coordinates?.[0]);
      const latitude = Number(coordinates?.[1]);

      if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
        return null;
      }

      return {
        latitude,
        longitude,
        matchedAddress: item?.properties?.title || query
      };
    })
    .filter(Boolean);

  const localCandidate = candidates.find(candidate =>
    isInsideConfiguredSearchArea(candidate.latitude, candidate.longitude)
  );

  if (!localCandidate) {
    throw new Error("GEOCODER_OUTSIDE_AREA");
  }

  return localCandidate;
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
    const { latitude, longitude, matchedAddress } = await geocodeAddress(address);

    showNearbyFacilities(latitude, longitude, "検索した住所");

    statusEl.textContent =
      `「${matchedAddress}」付近から近い3施設を表示しました。`;
  } catch (error) {
    if (error.message === "GEOCODER_NOT_CONFIGURED") {
      statusEl.textContent = "住所検索サービスが設定されていません。";
      return;
    }

    if (error.message === "GEOCODER_NO_RESULTS") {
      statusEl.textContent =
        "住所を特定できませんでした。町名・番地を含めて入力してください。";
      return;
    }

    if (error.message === "GEOCODER_OUTSIDE_AREA") {
      statusEl.textContent =
        "神栖市周辺の住所として確認できませんでした。入力内容をご確認ください。";
      return;
    }

    console.error(error);
    statusEl.textContent =
      "住所検索サービスへ接続できませんでした。時間をおいて再度お試しください。";
  }
});

currentLocationButton.addEventListener("click", () => {
  if (!navigator.geolocation) {
    statusEl.textContent = "この端末またはブラウザでは現在地を取得できません。";
    return;
  }

  currentLocationButton.disabled = true;
  statusEl.textContent = "現在地を取得しています…";

  navigator.geolocation.getCurrentPosition(
    (position) => {
      const latitude = position.coords.latitude;
      const longitude = position.coords.longitude;
      const accuracy = Math.max(1, Math.round(position.coords.accuracy));
      showNearbyFacilities(latitude, longitude, "現在地");
      statusEl.textContent = "現在地から近い3施設を表示しました（位置精度の目安 ±" + accuracy + "m）。";
      currentLocationButton.disabled = false;
    },
    (error) => {
      if (error.code === 1) {
        statusEl.textContent = "現在地の利用が許可されていません。端末の位置情報設定をご確認ください。";
      } else if (error.code === 2) {
        statusEl.textContent = "現在地を取得できませんでした。通信環境や位置情報設定をご確認ください。";
      } else if (error.code === 3) {
        statusEl.textContent = "現在地の取得に時間がかかりすぎました。もう一度お試しください。";
      } else {
        statusEl.textContent = "現在地を取得できませんでした。";
      }
      currentLocationButton.disabled = false;
    },
    { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
  );
});

async function switchMapForPrint() {
  const printSource = APP_CONFIG.printMapImage;
  if (!printSource || printSource === APP_CONFIG.mapImage) return true;

  const previousSource = mapImage.getAttribute("src") || APP_CONFIG.mapImage;

  try {
    mapImage.src = printSource;

    if (typeof mapImage.decode === "function") {
      await mapImage.decode();
    } else if (!mapImage.complete) {
      await new Promise((resolve, reject) => {
        mapImage.addEventListener("load", resolve, { once: true });
        mapImage.addEventListener("error", reject, { once: true });
      });
    }

    mapImage.dataset.screenSource = previousSource;
    return true;
  } catch (error) {
    console.error(error);
    mapImage.src = previousSource;
    statusEl.textContent = "印刷用の高精細地図を読み込めなかったため、画面表示用の地図で印刷します。";
    return false;
  }
}

function restoreScreenMap() {
  const screenSource = mapImage.dataset.screenSource || APP_CONFIG.mapImage;
  if (mapImage.getAttribute("src") !== screenSource) {
    mapImage.src = screenSource;
  }
  delete mapImage.dataset.screenSource;
}

printButton.addEventListener("click", async () => {
  printButton.disabled = true;
  statusEl.textContent = "印刷用の高精細地図を準備しています…";

  await switchMapForPrint();

  statusEl.textContent = "印刷画面を開きます。";
  window.print();
  printButton.disabled = false;
});

window.addEventListener("afterprint", restoreScreenMap);
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
