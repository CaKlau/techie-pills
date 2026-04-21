
import { HeatMap, GeoHeatMap } from "./kernel_density_estimation/heatmap.js"

import { filterLocationsInBounds, getGeoBounds, locationsToGrid, drawLocationGeoPoints, removeLocationGeoPoints, aggregateLocations, synthesizeGeodata, scottsRuleOfThumb, silvermansRuleOfThumb } from "./utils.js"


const map = L.map('map').setView([53.550556, 9.993333], 4);
map.attributionControl.setPrefix('🌿 Leaflet')


const arcgisLayer = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}', {
    minZoom: 3,
    maxZoom: 20,  // Overlap at zoom 11
    attribution: '© Esri'
});

// Add ArcGIS first (bottom layer)
arcgisLayer.addTo(map);

const circleLayer = L.layerGroup();

let circlesVisible = false;
let heatmapVisible = true;

let initialBandwidth = { h_x: 18, h_y: 18 };
let initialColorDepth = 40; // Initial color depth
const viewportBuffer = 0.5; // optimization to make panning across the map continuous 



let allLocations = []



// EARTHQUAKES - https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/2.5_month.geojson

async function loadEarthquakeData(starttime, endtime, minmagnitude = 2.5) {
    const url = `https://earthquake.usgs.gov/fdsnws/event/1/query?format=csv`
              + `&starttime=${starttime}&endtime=${endtime}`
              + `&minmagnitude=${minmagnitude}`;

    const response = await fetch(url);
    const text = await response.text();
    const lines = text.trim().split('\n');
    const results = [];


    for (let i = 1; i < lines.length; i++) {        
        const cols = lines[i].split(',');
        const lat = parseFloat(cols[1]);
        const lng = parseFloat(cols[2]);

        if (isNaN(lat) || isNaN(lng)) continue;

        results.push({ latitude: lat, longitude: lng, count: 1 });
    }

    return results;
}

allLocations = await loadEarthquakeData('2025-12-01', '2026-03-01');
document.getElementById('info').textContent = `🪨 ${allLocations.length} earthquakes`;



const HeatMapLayer = L.Layer.extend({
    //constructor 
    initialize: function (options) {
        L.setOptions(this, options);
        this.data = options.data || [];
        this.bandwidth = options.bandwidth || { h_x: 12, h_y: 12 };
        this.cellSize = options.cellSize || 3;
        this.style = options.style;
    },

    onAdd: function (map) {
        // Called when layer is added to the map
        this._map = map;

        // Create a canvas element for drawing
        this._canvas = L.DomUtil.create('canvas', 'heatmap-layer');
        this._canvas.style.position = 'absolute';
        this._canvas.style.pointerEvents = 'none';

        // Add canvas to map panes
        map.getPanes().overlayPane.appendChild(this._canvas);

        // Single handler for both events
        this._debouncedRender = this._debounce(() => this._render(), 500);

        map.on('zoomend moveend', this._debouncedRender, this);

        // Initial render
        this._render();
    },

    onRemove: function (map) {
        // Clear pending renders
        if (this._debouncedRender && this._debouncedRender.cancel) {
            this._debouncedRender.cancel();
        }

        // Clean up events
        map.off('zoomend', this._debouncedRender, this);
        map.off('moveend', this._debouncedRender, this);

        // Remove canvas
        L.DomUtil.remove(this._canvas);

        // Clear map reference
        this._map = null;
    },

    _onZoomEnd: function () {
        console.log("Current zoom level: ", this._map.getZoom())
        this._render();
    },

    _onMoveEnd: function () {
        this._render();
    },

    _debounce: function (func, wait) {
        let timeout;
        return function () {
            clearTimeout(timeout);
            timeout = setTimeout(() => func.apply(this), wait);
        };
    },

    setBandwidth: function (h) {
        this.bandwidth = h;
        this.useSilverman = false;
    },

    setColorDepth: function (cd) {
        this.style.colorDepth = cd;
    },

    setColorPalette: function (name) {
        this.style.colorPaletteName = name;
    },

    _render: function () {

        const buffer = viewportBuffer;
        const size = this._map.getSize();

        this._canvas.width  = size.x * (1 + 2 * buffer);
        this._canvas.height = size.y * (1 + 2 * buffer);

        // Position canvas so the buffer extends equally outside the viewport
        const topLeft = this._map.containerPointToLayerPoint([-size.x * buffer, -size.y * buffer]);
        L.DomUtil.setPosition(this._canvas, topLeft);

        const gridWidth  = Math.ceil(this._canvas.width  / this.cellSize);
        const gridHeight = Math.ceil(this._canvas.height / this.cellSize);

        const geoBounds = getGeoBounds(this._map.getBounds());

        const visibleLocations = filterLocationsInBounds(this.data, geoBounds, buffer);

        drawLocationGeoPoints(circleLayer, visibleLocations)

        const locations = locationsToGrid(visibleLocations, geoBounds, gridWidth, gridHeight, this._map, buffer);

        if (this.useSilverman) {
            const { h_x, h_y } = silvermansRuleOfThumb(locations, gridWidth, gridHeight);
            this.bandwidth = { h_x: h_x * this.cellSize, h_y: h_y * this.cellSize };
            console.log("Silverman");
            console.log("Bandwidth X:", this.bandwidth.h_x, "Bandwidth Y:", this.bandwidth.h_y, );
        }

        // create geoHeatMap object
        this.geoHeatMap = new GeoHeatMap(
            locations,
            { 
                h_x: this.bandwidth.h_x / this.cellSize, 
                h_y: this.bandwidth.h_y / this.cellSize 
            },
            gridHeight,
            gridWidth,
            this.cellSize,
            this._canvas,
            getGeoBounds(this._map.getBounds()),
            this.style
        );

        this.geoHeatMap.computeHeatMap();
    },
});


const heatMapLayer = new HeatMapLayer({
    data: allLocations,
    bandwidth: initialBandwidth,
    cellSize: 3,
    style: { 
            opacity: 180, 
            opacityWeight: 0.0, 
            drawCellBorder: false, 
            colorPaletteName: "Hot", 
            colorDepth: initialColorDepth 
        }
});

heatMapLayer.addTo(map);




///////////////////
// Event Listeners


const toggleBtn = document.getElementById('toggleCircles');

toggleBtn.addEventListener('click', () => {
    if (circlesVisible) {
        map.removeLayer(circleLayer);
        toggleBtn.textContent = '🟣 Show Circles';
    } else {
        map.addLayer(circleLayer);
        toggleBtn.textContent = '🚫 Hide Circles';
    }
    circlesVisible = !circlesVisible;
});



// Toggle button handler

document.getElementById('toggleHeatmap').addEventListener('click', function () {
    if (heatmapVisible) {
        map.removeLayer(heatMapLayer);
        this.textContent = '🔥 Show Heatmap';
        heatmapVisible = false;
    } else {
        heatMapLayer.addTo(map);
        this.textContent = '🚫 Hide Heatmap';
        heatmapVisible = true;
    }
});


document.getElementById('decreaseBandwidth').addEventListener('click', function () {
    const v = Math.max(1, Math.round((initialBandwidth.h_x + initialBandwidth.h_y) / 2) - 1);
    initialBandwidth = { h_x: v, h_y: v };
    heatMapLayer.setBandwidth(initialBandwidth);
    heatMapLayer._render();
    console.log("Bandwidth X:", initialBandwidth.h_x, "Bandwidth Y:", initialBandwidth.h_y);
});

document.getElementById('increaseBandwidth').addEventListener('click', function () {
    const v = Math.min(50, Math.round((initialBandwidth.h_x + initialBandwidth.h_y) / 2) + 1);
    initialBandwidth = { h_x: v, h_y: v };
    heatMapLayer.setBandwidth(initialBandwidth);
    heatMapLayer._render();
    console.log("Bandwidth X:", initialBandwidth.h_x, "Bandwidth Y:", initialBandwidth.h_y);
});

document.getElementById('decreaseBandwidthX').addEventListener('click', function () {
    initialBandwidth = { h_x: Math.max(1, initialBandwidth.h_x - 1), h_y: initialBandwidth.h_y };
    heatMapLayer.setBandwidth(initialBandwidth);
    heatMapLayer._render();
    console.log("Bandwidth X:", initialBandwidth.h_x);
});

document.getElementById('increaseBandwidthX').addEventListener('click', function () {
    initialBandwidth = { h_x: Math.min(50, initialBandwidth.h_x + 1), h_y: initialBandwidth.h_y };
    heatMapLayer.setBandwidth(initialBandwidth);
    heatMapLayer._render();
    console.log("Bandwidth X:", initialBandwidth.h_x);
});

document.getElementById('decreaseBandwidthY').addEventListener('click', function () {
    initialBandwidth = { h_x: initialBandwidth.h_x, h_y: Math.max(1, initialBandwidth.h_y - 1) };
    heatMapLayer.setBandwidth(initialBandwidth);
    heatMapLayer._render();
    console.log("Bandwidth Y:", initialBandwidth.h_y);
});

document.getElementById('increaseBandwidthY').addEventListener('click', function () {
    initialBandwidth = { h_x: initialBandwidth.h_x, h_y: Math.min(50, initialBandwidth.h_y + 1) };
    heatMapLayer.setBandwidth(initialBandwidth);
    heatMapLayer._render();
    console.log("Bandwidth Y:", initialBandwidth.h_y);

});


document.getElementById('silvermanBtn').addEventListener('click', function () {
    heatMapLayer.useSilverman = true;
    heatMapLayer._render();
    initialBandwidth = {
        h_x: Math.round(heatMapLayer.bandwidth.h_x),
        h_y: Math.round(heatMapLayer.bandwidth.h_y)
    };
    heatMapLayer.setBandwidth(initialBandwidth);
});


document.getElementById('decreaseColorDepth').addEventListener('click', function () {
    initialColorDepth = Math.max(2, initialColorDepth - 1);
    heatMapLayer.setColorDepth(initialColorDepth);
    heatMapLayer._render();
    console.log("Color Depth:", initialColorDepth);
});

document.getElementById('increaseColorDepth').addEventListener('click', function () {
    initialColorDepth = Math.min(256, initialColorDepth + 1);
    heatMapLayer.setColorDepth(initialColorDepth);
    heatMapLayer._render();
    console.log("Color Depth:", initialColorDepth);
});

document.getElementById('paletteSelect').addEventListener('change', function (e) {
    heatMapLayer.setColorPalette(e.target.value);
    heatMapLayer._render();
});


///////////////////
// Draw Mode

let drawModeActive = false;
let drawKeyDown = false;
let isPointerDown = false;
let lastDrawPixel = null;
const MIN_DRAW_DISTANCE_PX = 20;

let drawnPoints = []
window.drawnPoints = drawnPoints;

let drawRenderTimeout;
function debouncedDrawRender() {
    clearTimeout(drawRenderTimeout);
    drawRenderTimeout = setTimeout(() => {
        heatMapLayer.data = allLocations;
        heatMapLayer._render();
    }, 300);
}

function addDrawPoint(containerPoint) {
    const latlng = map.containerPointToLatLng(containerPoint);
    drawnPoints.push(latlng)
    allLocations.push({ latitude: latlng.lat, longitude: latlng.lng, count: 1 });
    lastDrawPixel = containerPoint;
    document.getElementById('info').textContent = `✏️ ${allLocations.length} points drawn`;
    debouncedDrawRender();
}

document.getElementById('drawMode').addEventListener('click', function () {
    drawModeActive = !drawModeActive;
    if (drawModeActive) {
        allLocations = [];
        heatMapLayer.data = allLocations;
        removeLocationGeoPoints(circleLayer)
        heatMapLayer._render();
        this.textContent = '🚫 Exit Draw Mode';
        document.getElementById('info').textContent = '✏️ Hold D + drag to draw';
    } else {
        this.textContent = '✏️ Draw Mode';
        map.getContainer().classList.remove('draw-mode-active');
        map.dragging.enable();
        document.getElementById('info').textContent = `📍 ${allLocations.length} locations`;
    }
});

document.addEventListener('keydown', (e) => {
    if ((e.key === 'd' || e.key === 'D') && !drawKeyDown) {
        drawKeyDown = true;
        if (drawModeActive) {
            map.dragging.disable();
            map.getContainer().classList.add('draw-mode-active');
        }
    }
});

document.addEventListener('keyup', (e) => {
    if (e.key === 'd' || e.key === 'D') {
        drawKeyDown = false;
        isPointerDown = false;
        lastDrawPixel = null;
        map.dragging.enable();
        if (drawModeActive) map.getContainer().classList.remove('draw-mode-active');
    }
});

const mapContainer = map.getContainer();

mapContainer.addEventListener('mousedown', (e) => {
    if (!drawModeActive || !drawKeyDown || e.button !== 0) return;
    isPointerDown = true;
    const rect = mapContainer.getBoundingClientRect();
    const pt = L.point(e.clientX - rect.left, e.clientY - rect.top);
    addDrawPoint(pt);
});

mapContainer.addEventListener('mousemove', (e) => {
    if (!drawModeActive || !drawKeyDown || !isPointerDown) return;
    const rect = mapContainer.getBoundingClientRect();
    const pt = L.point(e.clientX - rect.left, e.clientY - rect.top);
    if (lastDrawPixel) {
        const dx = pt.x - lastDrawPixel.x;
        const dy = pt.y - lastDrawPixel.y;
        if (Math.sqrt(dx * dx + dy * dy) < MIN_DRAW_DISTANCE_PX) return;
    }
    addDrawPoint(pt);
});

document.addEventListener('mouseup', () => {
    isPointerDown = false;
    lastDrawPixel = null;
});


