export const SWARM_PARAMS = {
    potential: "morse",
    a: 1.0,  //knob for Morse potential
    r0: 3.0,        // equilibrium spacing
    epsilon: 1.0,    // well depth
    r_c: 2.5,  //cutoff, 2.5*r0

    // Cohesion
    k_c: 0.75,        // centroid spring stiffness

    // Dynamics
    damping: 2.0,
    mass: 1.0,

    // Initialization
    count: 4000,
    spawnRange: 50,   
    velocityRange: 15,
};