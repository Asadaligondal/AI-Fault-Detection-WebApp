// Dummy AI Model for Fault Detection

function analyzeFFTData(magnitudes) {
    // Simulating AI behavior: Detecting faults based on threshold logic
    const avgMagnitude = magnitudes.reduce((sum, val) => sum + val, 0) / magnitudes.length;

    return {
        motor: avgMagnitude > 5,   // If avg magnitude > 5, motor fault
        belt: avgMagnitude > 3,    // If avg magnitude > 3, belt fault
        bearing: avgMagnitude > 4, // If avg magnitude > 4, bearing fault
        pully: avgMagnitude > 2,   // If avg magnitude > 2, pully fault
        gear: avgMagnitude > 4     // If avg magnitude > 4, gear fault
    };
}

module.exports = { analyzeFFTData };
