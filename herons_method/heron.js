function randomIntFromInterval(min, max) { // min and max included
    return Math.floor(Math.random() * (max - min + 1) + min);
}

function heronSqrt(number, getHistory = false, tolerance = 1e-3, maxIterations = 1000) {
    let history = []

    if (number < 0) {
        throw new Error("Cannot compute the square root of a negative number.");
    }
    if (number === 0 || number === 1) {
        return number;
    }

    let guess = number   ; // Initial guess
    history.push(guess);
    let iterations = 0;

    while (Math.abs(guess * guess - number) > tolerance && iterations < maxIterations) {
        guess = (guess + number / guess) / 2;
        history.push(guess);
        iterations++;
    }
    return getHistory ? history : guess;
}


function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }


function roundAndTrim(number, position) {
    // Round the number to position decimal places
    let rounded = number.toFixed(position);
    // Remove trailing zeros and optional decimal point if not needed
    return parseFloat(rounded);
}

export {
    randomIntFromInterval,
    heronSqrt,
    sleep,
    roundAndTrim
}

const N = 25
console.log(`Square root of ${N}:`)
console.log(heronSqrt(25, false, 1e-3, 1000))