export const SWARM_PARAMS = {
    potential: "morse",
    a: 1.0,  //knob for Morse potential
    r0: 3.0,        // equilibrium spacing
    epsilon: 1.0,    // well depth
    // r_c: 7.5,  //cutoff, invariance: 2.5*r0 -> overwritten by SwarmFormation

    // Cohesion
    k_c: 0.2,        // centroid spring stiffness

    // Dynamics
    dt: 1 / 100, // simulate at a fixed Hz
    damping: 0.5,
    mass: 1.0,

    // Initialization
    count: 200,
    spawnRange: 50,   
    velocityRange: 15,

    vRef: 1.0,

    // Projectiles
    C: 800.0,
    rho: 8.0
};