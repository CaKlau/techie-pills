

export function percentile(arr, p) {

    // Sort the array in ascending order
    const sorted = [...arr].sort((a, b) => a - b);

    // Calculate the index for the percentile
    const index = (p / 100) * (sorted.length - 1);

    // If index is an integer, return that element
    if (Number.isInteger(index)) {
        return sorted[index];
    }

    // Otherwise, interpolate between the two nearest values
    const lowerIndex = Math.floor(index);
    const upperIndex = Math.ceil(index);
    const fraction = index - lowerIndex;

    return sorted[lowerIndex] + fraction * (sorted[upperIndex] - sorted[lowerIndex]);
}


export function getRandomNumber(min, max) {
    return Math.random() * (max - min) + min;
}

export function getRandomInteger(min, max) {
    const minCeiled = Math.ceil(min);
    const maxFloored = Math.floor(max);
    return Math.floor(Math.random() * (maxFloored - minCeiled) + minCeiled); // The maximum is exclusive and the minimum is inclusive
}

export function norm2D(p) {
    return Math.sqrt(p.x * p.x + p.y * p.y);
}