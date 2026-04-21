
import { percentile } from './kernel_density_estimation/math.js'

export function filterLocationsInBounds(allLocations, geoBounds, buffer = 0.1) {
    // Buffer expands bounds by percentage (0.1 = 10% on each side)
    const latRange = geoBounds.north - geoBounds.south;
    const lngRange = geoBounds.east - geoBounds.west;

    const north = geoBounds.north + (latRange * buffer);
    const south = geoBounds.south - (latRange * buffer);
    const east = geoBounds.east + (lngRange * buffer);
    const west = geoBounds.west - (lngRange * buffer);

    return allLocations.filter(loc => {
        const lat = parseFloat(loc.latitude);
        const lng = parseFloat(loc.longitude);

        return lat <= north &&
            lat >= south &&
            lng <= east &&
            lng >= west;
    });
}

export function getGeoBounds(bounds) {
    return {
        north: bounds.getNorth(),
        south: bounds.getSouth(),
        east: bounds.getEast(),
        west: bounds.getWest()
    };
}


function _getViewportPixelBounds(map) {
    // Get map bounds in pixel coordinates
    const bounds = map.getBounds();
    const topLeft = map.latLngToContainerPoint(bounds.getNorthWest());
    const bottomRight = map.latLngToContainerPoint(bounds.getSouthEast());

    return {
        topLeft: topLeft,
        bottomRight: bottomRight,
        pixelWidth: bottomRight.x - topLeft.x,
        pixelHeight: bottomRight.y - topLeft.y
    }
}


export function locationsToGrid(visibleData, geoBounds, gridWidth, gridHeight, map, buffer = 0) {

    const size = map.getSize();
    const pxOffsetX = size.x * buffer;
    const pxOffsetY = size.y * buffer;
    const pxWidth   = size.x * (1 + 2 * buffer);
    const pxHeight  = size.y * (1 + 2 * buffer);

    // Map each aggregated location to its grid cell
    return visibleData.map(loc => {
        const lat = loc.latitude;
        const lng = loc.longitude;
        const count = loc.count;

        // Convert lat/lng to pixel coordinates (accounts for mercator projection)
        const point = map.latLngToContainerPoint([lat, lng]);

        // Convert pixel coordinates to grid coordinates (offset by buffer)
        const x = Math.floor(((point.x + pxOffsetX) / pxWidth) * gridWidth);
        const y = Math.floor(((point.y + pxOffsetY) / pxHeight) * gridHeight);

        // Clamp to grid bounds
        const clampedX = Math.max(0, Math.min(gridWidth - 1, x));
        const clampedY = Math.max(0, Math.min(gridHeight - 1, y));

        return { x: clampedX, y: clampedY, v: count };
    });
}


export function drawLocationGeoPoints(circleLayer, locations) {
    for (const p of locations) {
        L.circleMarker([p.latitude, p.longitude], {
            radius: 4,
            fillColor: '#ff00d0ff',
            color: '#000000ff',
            weight: 1,
            opacity: 1.0,
            fillOpacity: 0.8
        }).addTo(circleLayer); // .bindPopup(`<b>${p.count}</b><br>${p.city} (${p.country})`);
    }
}


export function removeLocationGeoPoints(circleLayer) {
    circleLayer.clearLayers();
}




export function aggregateLocations(locations) {
    const locationMap = {};

    locations.forEach(loc => {
        const lat = parseFloat(loc.latitude);
        const lng = parseFloat(loc.longitude);
        const count = parseFloat(loc.count);

        // Create unique key for this coordinate
        const key = `${lat},${lng}`;

        if (!locationMap[key]) {
            locationMap[key] = {
                latitude: lat,
                longitude: lng,
                count: 0,
                city: loc.city,
                country: loc.country
            };
        }
        locationMap[key].count += count;
    });

    return Object.values(locationMap);
}





export function scottsRuleOfThumb(locations) {

    const n = locations.length;

    if (n === 0) return 8;

    const meanX = locations.reduce((sum, currentLoc) => sum + currentLoc.x, 0,) / n;
    const meanY = locations.reduce((sum, currentLoc) => sum + currentLoc.y, 0,) / n;

    const varX = locations.reduce((sum, currentLoc) => sum + Math.pow(currentLoc.x - meanX, 2), 0,) / n;
    const varY = locations.reduce((sum, currentLoc) => sum + Math.pow(currentLoc.y - meanY, 2), 0,) / n;

    const sd = Math.sqrt((varX + varY) / 2)

    return 1.06 * sd * Math.pow(n, -1 / 5)

}





export function silvermansRuleOfThumb(locations, gridWidth, gridHeight) {

    const n = locations.reduce((acc, p) => acc + p.v, 0);

    if (n === 0) return { h_x: 8, h_y: 8 };

    const meanX = locations.reduce((sum, loc) => sum + loc.x * loc.v, 0) / n;
    const meanY = locations.reduce((sum, loc) => sum + loc.y * loc.v, 0) / n;

    const varX = locations.reduce((sum, loc) => sum + loc.v * Math.pow(loc.x - meanX, 2), 0) / n;
    const varY = locations.reduce((sum, loc) => sum + loc.v * Math.pow(loc.y - meanY, 2), 0) / n;

    // Calculate IQR for both dimensions
    const xValues = locations.map(loc => loc.x).sort((a, b) => a - b);
    const yValues = locations.map(loc => loc.y).sort((a, b) => a - b);

    const q1Index = Math.floor(locations.length * 0.25);
    const q3Index = Math.floor(locations.length * 0.75);

    const iqrX = xValues[q3Index] - xValues[q1Index];
    const iqrY = yValues[q3Index] - yValues[q1Index];

    const robustScaleX = Math.min(Math.sqrt(varX), iqrX / 1.349);
    const robustScaleY = Math.min(Math.sqrt(varY), iqrY / 1.349);

    const h_x = 0.9 * robustScaleX * Math.pow(n, -1/5);
    const h_y = 0.9 * robustScaleY * Math.pow(n, -1/5);
    return { h_x, h_y };

}







/**
 * Synthesize geodata with normal distribution around global centers
 * @param {number} numClusters - Number of cluster centers
 * @param {number} pointsPerCluster - Points to generate per cluster
 * @param {number} stdDevDegrees - Standard deviation in degrees for point spread
 * @returns {Array} Array of location objects
 */
export function synthesizeGeodata(numClusters = 5, pointsPerCluster = 50, stdDevDegrees = 2.0) {

    // Define cluster centers around the globe (lat, lng, name)
    const clusterCenters = [
        // North America
        { lat: 41.8781, lng: -87.6298, name: "Chicago", country: "USA" },
        { lat: 39.7392, lng: -104.9903, name: "Denver", country: "USA" },
        { lat: 32.7767, lng: -96.7970, name: "Dallas", country: "USA" },

        // Europe
        { lat: 52.5200, lng: 13.4050, name: "Berlin", country: "Germany" },
        { lat: 48.1351, lng: 11.5820, name: "Munich", country: "Germany" },
        { lat: 48.2082, lng: 16.3738, name: "Vienna", country: "Austria" },
        { lat: 40.4168, lng: -3.7038, name: "Madrid", country: "Spain" },
        { lat: 50.0755, lng: 14.4378, name: "Prague", country: "Czech Republic" },

        // Asia
        { lat: 30.5728, lng: 104.0668, name: "Chengdu", country: "China" },
        { lat: 39.9042, lng: 116.4074, name: "Beijing", country: "China" },
        { lat: 28.6139, lng: 77.2090, name: "New Delhi", country: "India" },
        { lat: 13.7563, lng: 100.5018, name: "Bangkok", country: "Thailand" },
        { lat: 39.9334, lng: 32.8597, name: "Ankara", country: "Turkey" },

        // South America
        { lat: -23.5505, lng: -46.6333, name: "São Paulo", country: "Brazil" },
        { lat: 4.7110, lng: -74.0721, name: "Bogotá", country: "Colombia" },
        { lat: -16.5000, lng: -68.1500, name: "La Paz", country: "Bolivia" },

        // Africa
        { lat: -26.2041, lng: 28.0473, name: "Johannesburg", country: "South Africa" },
        { lat: -1.2921, lng: 36.8219, name: "Nairobi", country: "Kenya" },
        { lat: 30.0444, lng: 31.2357, name: "Cairo", country: "Egypt" },

        // Australia (limited inland options)
        { lat: -35.2809, lng: 149.1300, name: "Canberra", country: "Australia" }
    ];

    // Select random centers
    const selectedCenters = [];
    const shuffled = [...clusterCenters].sort(() => 0.5 - Math.random());
    for (let i = 0; i < Math.min(numClusters, shuffled.length); i++) {
        selectedCenters.push(shuffled[i]);
    }

    const locations = [];

    // Generate points around each center
    selectedCenters.forEach(center => {
        for (let i = 0; i < pointsPerCluster; i++) {
            // Box-Muller transform for normal distribution
            const u1 = Math.random();
            const u2 = Math.random();
            const z0 = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
            const z1 = Math.sqrt(-2 * Math.log(u1)) * Math.sin(2 * Math.PI * u2);

            // Apply to lat/lng with standard deviation
            let lat = center.lat + (z0 * stdDevDegrees);
            let lng = center.lng + (z1 * stdDevDegrees / Math.cos(center.lat * Math.PI / 180));

            // Clamp latitude to valid range
            lat = Math.max(-90, Math.min(90, lat));

            // Wrap longitude to valid range
            lng = ((lng + 180) % 360) - 180;

            // Generate INDEPENDENT random value for count
            const u3 = Math.random();
            const u4 = Math.random();
            const z2 = Math.sqrt(-2 * Math.log(u3)) * Math.cos(2 * Math.PI * u4);

            const logMean = 4;
            const logStdDev = 1.5;
            const logNormal = Math.exp(logMean + logStdDev * z2);
            const count = Math.max(1, Math.min(3000, Math.round(logNormal)));

            locations.push({
                latitude: lat,
                longitude: lng,
                count: count,
                city: center.name,
                country: center.country
            });
        }
    });

    return locations;
}