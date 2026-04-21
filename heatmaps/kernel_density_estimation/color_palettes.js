


export const infernoPalette = [
    [0, 0, 4],
    [31, 12, 72],
    [85, 15, 109],
    [136, 34, 106],
    [186, 54, 85],
    [227, 89, 51],
    [249, 140, 10],
    [252, 195, 40],
    [252, 255, 164]
];

export const plasmaPalette = [
    [13, 8, 135],
    [76, 2, 161],
    [126, 3, 168],
    [170, 35, 149],
    [204, 71, 120],
    [230, 108, 92],
    [248, 149, 64],
    [253, 197, 39],
    [240, 249, 33]
];

export const viridisPalette = [
    [68, 1, 84],
    [71, 45, 123],
    [59, 82, 139],
    [44, 114, 142],
    [33, 145, 140],
    [40, 174, 128],
    [94, 201, 98],
    [173, 220, 48],
    [253, 231, 37]
];

export const magmaPalette = [
    [0, 0, 4],
    [29, 17, 71],
    [81, 18, 124],
    [131, 38, 129],
    [183, 55, 121],
    [231, 82, 99],
    [252, 137, 97],
    [254, 196, 136],
    [252, 253, 191]
];


// Classic black → red → yellow → white. Reads intuitively as heat
export const hotPalette = [
    [0, 0, 0],
    [128, 0, 0],
    [255, 0, 0],
    [255, 128, 0],
    [255, 255, 0],
    [255, 255, 255]
];

// Google Maps style: light yellow → orange → deep red. Map tiles show through at low density
export const ylorrdPalette = [
    [255, 255, 204],
    [255, 237, 160],
    [254, 217, 118],
    [254, 178, 76],
    [253, 141, 60],
    [252, 78, 42],
    [227, 26, 28],
    [177, 0, 38]
];

// Cyan → magenta. High contrast over warm-toned map tiles
export const coolPalette = [
    [0, 255, 255],
    [51, 204, 255],
    [102, 153, 255],
    [153, 102, 255],
    [204, 51, 255],
    [255, 0, 255]
];

// White → deep blue. Clean and subtle, works well over light map tiles
export const bluesPalette = [
    [247, 251, 255],
    [198, 219, 239],
    [158, 202, 225],
    [107, 174, 214],
    [66, 146, 198],
    [33, 113, 181],
    [8, 69, 148]
];

export const paletteMapper = {
    "Inferno": infernoPalette,
    "Magma": magmaPalette,
    "Plasma": plasmaPalette,
    "Viridis": viridisPalette,
    "Hot": hotPalette,
    "YlOrRd": ylorrdPalette,
    "Cool": coolPalette,
    "Blues": bluesPalette
}


// Helper function to interpolate between colors
export function extendPalette(paletteName, colorDepth) {
    const extended = [];
    let palette = paletteMapper[paletteName]
    const oldSize = palette.length;

    for (let i = 0; i < colorDepth; i++) {
        // Map position i in [0, 17] to position in original palette [0, 8]
        const pos = i * (oldSize - 1) / (colorDepth - 1);
        const lowerIdx = Math.floor(pos);
        const upperIdx = Math.ceil(pos);
        const fraction = pos - lowerIdx;

        if (lowerIdx === upperIdx) {
            // Exact match with original color
            extended.push([...palette[lowerIdx]]);
        } else {
            // Interpolate between two colors
            const interpolated = palette[lowerIdx].map((val, idx) =>
                Math.round(val + fraction * (palette[upperIdx][idx] - val))
            );
            extended.push(interpolated);
        }
    }

    return extended;
}