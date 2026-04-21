
import { percentile, getRandomInteger, getRandomNumber, norm2D } from "./math.js"
import { paletteMapper, extendPalette } from "./color_palettes.js"




export class HeatMap {

    constructor(locations, bandwidth, gridHeight, gridWidth, cellSize, canvas, style) {

        this.locations = locations;
        this.bandwidthX = bandwidth.h_x ?? bandwidth;
        this.bandwidthY = bandwidth.h_y ?? bandwidth;
        this.gridHeight = gridHeight;
        this.gridWidth = gridWidth;
        this.cellSize = cellSize;
        this.opacity = style.opacity ?? 255;
        this.opacityWeight = style.opacityWeight ?? 0.0;
        this.drawCellBorder = style.drawCellBorder ?? true;
        this.colorPaletteName = style.colorPaletteName ?? "Hot"
        this.colorDepth = style.colorDepth ?? 32;
        this.totalWeight = this.locations.reduce((acc, obj) => acc + obj.v, 0);
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');


        this.kdeGrid = new Float32Array(gridWidth * gridHeight);

        this.setColorDepth(this.colorDepth)
    }


    computeColor(v, palette) {
        return this.valueToColor(v, palette);
    }

    setBandwith(h) {
        this.bandwidthX = h.h_x ?? h;
        this.bandwidthY = h.h_y ?? h;
    }

    setColorDepth(cd) {
        this.colorDepth = cd;
        this.colorPalette = extendPalette(this.colorPaletteName, this.colorDepth);
    }

    setColorPalette(name) {
        this.colorPaletteName = name;
        this.colorPalette = extendPalette(this.colorPaletteName, this.colorDepth);
    }

    valueToColor(v, palette) {
        const idx = Math.floor(v * (palette.length - 1));
        return palette[idx];
    }


    boxKernel2D(u) {
        if (Math.abs(u.x) <= 1 && Math.abs(u.y) <= 1) {
            return 0.25;
        }
        else {
            return 0;
        }
    }

    triangularKernel2D(u) {
        const r = Math.sqrt(u.x * u.x + u.y * u.y);
        if (r > 1) return 0;  // Outside unit circle
        return 3 / Math.PI * (1 - r);  // Linear falloff with correct normalization
    }

    gaussianKernel2D(u) {
        // u is a 2D vector in "bandwidth units" 
        return 1 / (2 * Math.PI) * Math.exp(-1 / 2 * (u.x * u.x + u.y * u.y));
    }

    epanechnikovKernel2D(u) {
        const d_sq = u.x * u.x + u.y * u.y;
        if (d_sq > 1) return 0;
        return (2 / Math.PI) * (1 - d_sq);
    }

    pointIsFarAway(dx, dy) {
        const u_x = dx / this.bandwidthX;
        const u_y = dy / this.bandwidthY;
        return (u_x * u_x + u_y * u_y) > 9; // beyond 3σ ellipse
    }

    kernelDensityEsimation(p) {
        const h_x = this.bandwidthX;
        const h_y = this.bandwidthY;

        const xMin = Math.max(0, Math.ceil(p.x - 3 * h_x));
        const xMax = Math.min(this.gridWidth - 1, Math.floor(p.x + 3 * h_x));
        const yMin = Math.max(0, Math.ceil(p.y - 3 * h_y));
        const yMax = Math.min(this.gridHeight - 1, Math.floor(p.y + 3 * h_y));

        for (let cy = yMin; cy <= yMax; cy++) {
            for (let cx = xMin; cx <= xMax; cx++) {
                const u = { x: (cx - p.x) / h_x, y: (cy - p.y) / h_y };
                this.kdeGrid[cy * this.gridWidth + cx] += p.v * this.gaussianKernel2D(u);
            }
        }
    }


    normalize(v, v_max) {
        if (v_max === 0) return 0
        return Math.pow(v / v_max, 1 / 2);
    }

    computeKDEGrid() {

        this.kdeGrid.fill(0);

        for (const p of this.locations) {
            this.kernelDensityEsimation(p);
        }

        const norm = this.totalWeight === 0 ? 0 : 1 / (this.totalWeight * this.bandwidthX * this.bandwidthY);
        
        let maxKDEValue = 0;
        
        for (let i = 0; i < this.kdeGrid.length; i++) {
            this.kdeGrid[i] *= norm;
            if (this.kdeGrid[i] > maxKDEValue) maxKDEValue = this.kdeGrid[i];
        }
        return maxKDEValue;

    }


    drawCellToImageData(imageData, x, y, color) {
        // Each grid cell is cellSize × cellSize pixels
        for (let dy = 0; dy < this.cellSize; dy++) {
            for (let dx = 0; dx < this.cellSize; dx++) {

                // Convert grid cell coordinates to pixel coordinates
                const px = x * this.cellSize + dx;  // pixel x-position
                const py = y * this.cellSize + dy;  // pixel y-position

                // Calculate index in the flat pixel array
                // Row-major order: (py * width + px) gives pixel number
                // Multiply by 4 because each pixel has 4 values (RGBA)
                const idx = (py * imageData.width + px) * 4;


                // Check if this is a border pixel
                if (this.drawCellBorder && (dy === 0 || dx === 0)) {
                    // Border: black
                    imageData.data[idx] = 0;
                    imageData.data[idx + 1] = 0;
                    imageData.data[idx + 2] = 0;
                    imageData.data[idx + 3] = color.opacity;
                } else {
                    // Interior: heatmap color
                    imageData.data[idx] = color.r;
                    imageData.data[idx + 1] = color.g;
                    imageData.data[idx + 2] = color.b;
                    imageData.data[idx + 3] = color.opacity;
                }
            }
        }
    }

    drawNormalizeKDEGrid() {

        // imageData.data is a Uint8ClampedArray
        // Format: [R, G, B, A, R, G, B, A, R, G, B, A, ...]
        // 4 values per pixel, left-to-right, top-to-bottom
        const imageData = this.ctx.createImageData(
            this.gridWidth * this.cellSize,   // e.g., 70 * 6 = 420px wide
            this.gridHeight * this.cellSize   // e.g., 50 * 6 = 300px tall
        );

        for (let y = 0; y < this.gridHeight; y++) {
            for (let x = 0; x < this.gridWidth; x++) {

                let normalized_kde = this.normalize(this.kdeGrid[y * this.gridWidth + x], this.maxKDEValue);

                let [r, g, b] = this.computeColor(normalized_kde, this.colorPalette);

                const opacity = Math.pow(normalized_kde, this.opacityWeight) * this.opacity;
                this.drawCellToImageData(imageData, x, y, { r: r, g: g, b: b, opacity: opacity })

            }
        }
        this.ctx.putImageData(imageData, 0, 0);

    }

    computeHeatMap() {
        const maxKDEValue = this.computeKDEGrid()

        this.maxKDEValue = maxKDEValue;

        this.drawNormalizeKDEGrid()
    }
}


export class GeoHeatMap extends HeatMap {
    constructor(locations, bandwidth, gridHeight, gridWidth, cellSize, canvas, geoBounds, style) {

        super(locations, bandwidth, gridHeight, gridWidth, cellSize, canvas, style);
        this.geobounds = geoBounds;
    }
}