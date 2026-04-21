import { HeatMap } from "./heatmap.js"
import { percentile, getRandomInteger } from "./math.js"


const canvas = document.getElementById('gridCanvas');
const ctx = canvas.getContext('2d');

// Bandwidth controls
const bandwidthSlider = document.getElementById('bandwidthSlider');
const bandwidthValue = document.getElementById('bandwidthValue');
const bandwidthIncrementBtn = document.getElementById('bandwidthIncrementBtn');
const bandwidthDecrementBtn = document.getElementById('bandwidthDecrementBtn');

const bandwidthXSlider = document.getElementById('bandwidthXSlider');
const bandwidthXValue = document.getElementById('bandwidthXValue');
const bandwidthXIncrementBtn = document.getElementById('bandwidthXIncrementBtn');
const bandwidthXDecrementBtn = document.getElementById('bandwidthXDecrementBtn');

const bandwidthYSlider = document.getElementById('bandwidthYSlider');
const bandwidthYValue = document.getElementById('bandwidthYValue');
const bandwidthYIncrementBtn = document.getElementById('bandwidthYIncrementBtn');
const bandwidthYDecrementBtn = document.getElementById('bandwidthYDecrementBtn');

// Color depth controls
const colorDepthSlider = document.getElementById('colorDepthSlider');
const colorDepthValue = document.getElementById('colorDepthValue');
const colorDepthIncrementBtn = document.getElementById('colorDepthIncrementBtn');
const colorDepthDecrementBtn = document.getElementById('colorDepthDecrementBtn');


const gridHeight = 120;
const gridWidth = 180;
const cellSize = 12;

let bandwidth = {
            h_x: 3, 
            h_y: 3
        };
let colorDepth = 21;

// Initialize bandwidth sliders
bandwidthXSlider.value = bandwidth.h_x;
bandwidthXValue.textContent = bandwidth.h_x;
bandwidthYSlider.value = bandwidth.h_y;
bandwidthYValue.textContent = bandwidth.h_y;

// Initialize color depth slider
colorDepthSlider.value = colorDepth;
colorDepthValue.textContent = colorDepth;

canvas.width = gridWidth * cellSize;
canvas.height = gridHeight * cellSize;


// Snake spiral — Archimedean spiral with a thick body.
// At each point along the centreline, points are added
// perpendicular to the path direction to create the snake width.
const locations = [];

const cx = 90, cy = 60;
const turns        = 4.0;
const rMin         = 4,  rMax = 54;
const numPathPoints = 500;
const halfWidth    = 2;   // cells either side of centreline
const widthSteps   = 5;   // samples across the body (odd = includes centre)

const b = (rMax - rMin) / (turns * 2 * Math.PI); // dr/dθ

for (let i = 0; i < numPathPoints; i++) {
    const theta = (i / numPathPoints) * turns * 2 * Math.PI;
    const r     = rMin + b * theta;

    // Centreline position
    const px = cx + r * Math.cos(theta);
    const py = cy + r * Math.sin(theta);

    // Tangent vector (dposition/dθ), then rotate 90° for the normal
    const tx =  b * Math.cos(theta) - r * Math.sin(theta);
    const ty =  b * Math.sin(theta) + r * Math.cos(theta);
    const tLen = Math.sqrt(tx * tx + ty * ty);
    const nx = -ty / tLen;   // normal (perpendicular to path)
    const ny =  tx / tLen;

    // Spread points across the snake body
    for (let w = 0; w < widthSteps; w++) {
        const offset = -halfWidth + (w / (widthSteps - 1)) * 2 * halfWidth;
        const x = Math.round(px + offset * nx);
        const y = Math.round(py + offset * ny);

        if (x >= 0 && x < gridWidth && y >= 0 && y < gridHeight) {
            locations.push({ x, y, v: 1.0 });
        }
    }
}

console.log(locations)


const heatmap = new HeatMap(
    locations, 
    bandwidth, 
    gridHeight, 
    gridWidth, 
    cellSize, 
    canvas, 
    { 
        opacity: 255, 
        colorDepth: colorDepth,
        opacityWeight: 0.0, 
        drawCellBorder: true, 
        colorPaletteName: "Viridis",  });

heatmap.computeHeatMap()


// Bandwidth event listeners
let bandwidthDebounceTimer;

function applyBothBandwidth(v) {
    bandwidthSlider.value = v;
    bandwidthValue.textContent = v;
    bandwidthXSlider.value = v;
    bandwidthXValue.textContent = v;
    bandwidthYSlider.value = v;
    bandwidthYValue.textContent = v;
    heatmap.setBandwith({ h_x: v, h_y: v });
}

bandwidthSlider.addEventListener('input', (e) => {
    applyBothBandwidth(parseInt(e.target.value));
    clearTimeout(bandwidthDebounceTimer);
    bandwidthDebounceTimer = setTimeout(() => { heatmap.computeHeatMap(); }, 100);
});

bandwidthIncrementBtn.addEventListener('click', () => {
    applyBothBandwidth(Math.min(parseInt(bandwidthSlider.value) + 1, parseInt(bandwidthSlider.max)));
    heatmap.computeHeatMap();
});

bandwidthDecrementBtn.addEventListener('click', () => {
    applyBothBandwidth(Math.max(parseInt(bandwidthSlider.value) - 1, parseInt(bandwidthSlider.min)));
    heatmap.computeHeatMap();
});

document.addEventListener('keydown', (e) => {
    if (e.key === '+' || e.key === '=') {
        applyBothBandwidth(Math.min(parseInt(bandwidthSlider.value) + 1, parseInt(bandwidthSlider.max)));
        heatmap.computeHeatMap();
    } else if (e.key === '-') {
        applyBothBandwidth(Math.max(parseInt(bandwidthSlider.value) - 1, parseInt(bandwidthSlider.min)));
        heatmap.computeHeatMap();
    }
});

bandwidthXSlider.addEventListener('input', (e) => {
    bandwidthXValue.textContent = e.target.value;
    heatmap.setBandwith({ h_x: parseInt(e.target.value), h_y: parseInt(bandwidthYSlider.value) });
    clearTimeout(bandwidthDebounceTimer);
    bandwidthDebounceTimer = setTimeout(() => { heatmap.computeHeatMap(); }, 100);
});

bandwidthXIncrementBtn.addEventListener('click', () => {
    bandwidthXSlider.value = Math.min(parseInt(bandwidthXSlider.value) + 1, bandwidthXSlider.max);
    bandwidthXValue.textContent = bandwidthXSlider.value;
    heatmap.setBandwith({ h_x: parseInt(bandwidthXSlider.value), h_y: parseInt(bandwidthYSlider.value) });
    heatmap.computeHeatMap();
});

bandwidthXDecrementBtn.addEventListener('click', () => {
    bandwidthXSlider.value = Math.max(parseInt(bandwidthXSlider.value) - 1, bandwidthXSlider.min);
    bandwidthXValue.textContent = bandwidthXSlider.value;
    heatmap.setBandwith({ h_x: parseInt(bandwidthXSlider.value), h_y: parseInt(bandwidthYSlider.value) });
    heatmap.computeHeatMap();
});

bandwidthYSlider.addEventListener('input', (e) => {
    bandwidthYValue.textContent = e.target.value;
    heatmap.setBandwith({ h_x: parseInt(bandwidthXSlider.value), h_y: parseInt(e.target.value) });
    clearTimeout(bandwidthDebounceTimer);
    bandwidthDebounceTimer = setTimeout(() => { heatmap.computeHeatMap(); }, 100);
});

bandwidthYIncrementBtn.addEventListener('click', () => {
    bandwidthYSlider.value = Math.min(parseInt(bandwidthYSlider.value) + 1, bandwidthYSlider.max);
    bandwidthYValue.textContent = bandwidthYSlider.value;
    heatmap.setBandwith({ h_x: parseInt(bandwidthXSlider.value), h_y: parseInt(bandwidthYSlider.value) });
    heatmap.computeHeatMap();
});

bandwidthYDecrementBtn.addEventListener('click', () => {
    bandwidthYSlider.value = Math.max(parseInt(bandwidthYSlider.value) - 1, bandwidthYSlider.min);
    bandwidthYValue.textContent = bandwidthYSlider.value;
    heatmap.setBandwith({ h_x: parseInt(bandwidthXSlider.value), h_y: parseInt(bandwidthYSlider.value) });
    heatmap.computeHeatMap();
});


// Color depth event listeners
let colorDepthDebounceTimer;
colorDepthSlider.addEventListener('input', (e) => {
    colorDepthValue.textContent = e.target.value;
    heatmap.setColorDepth(e.target.value);

    clearTimeout(colorDepthDebounceTimer);
    colorDepthDebounceTimer = setTimeout(() => {
        heatmap.computeHeatMap();
    }, 100);
});

colorDepthIncrementBtn.addEventListener('click', () => {
    colorDepthSlider.value = Math.min(parseInt(colorDepthSlider.value) + 1, colorDepthSlider.max);
    colorDepthValue.textContent = colorDepthSlider.value;
    heatmap.setColorDepth(colorDepthSlider.value);
    heatmap.computeHeatMap()
});

colorDepthDecrementBtn.addEventListener('click', () => {
    colorDepthSlider.value = Math.max(parseInt(colorDepthSlider.value) - 1, colorDepthSlider.min);
    colorDepthValue.textContent = colorDepthSlider.value;
    heatmap.setColorDepth(colorDepthSlider.value);
    heatmap.computeHeatMap()
});

document.getElementById('paletteSelect').addEventListener('change', (e) => {
    heatmap.setColorPalette(e.target.value);
    heatmap.computeHeatMap();
});



const tooltip = document.getElementById('tooltip');

canvas.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    const x = Math.floor((e.clientX - rect.left) / cellSize);
    const y = Math.floor((e.clientY - rect.top) / cellSize);

    // Check bounds
    if (x >= 0 && x < gridWidth && y >= 0 && y < gridHeight) {
        const kdeValue = heatmap.kdeGrid[y * heatmap.gridWidth + x];
        const normalizedValue = heatmap.normalize(kdeValue, heatmap.maxKDEValue);

        tooltip.style.display = 'block';
        tooltip.style.left = (e.clientX + 15) + 'px';
        tooltip.style.top = (e.clientY + 15) + 'px';
        tooltip.innerHTML = `
           ${kdeValue.toFixed(4)}<br>
          (${(normalizedValue * 100).toFixed(1)}%)
        `;


    } else {
        tooltip.style.display = 'none';
    }
});

canvas.addEventListener('mouseleave', () => {
    tooltip.style.display = 'none';
});