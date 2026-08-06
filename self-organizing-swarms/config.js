export const SWARM_PARAMS = {
    // Lennard-Jones interaction
    r0: 1.0,        // equilibrium spacing
    epsilon: 1.0,    // well depth
    r_c: 2.5,  //cutoff, 2.5*r0

    // Cohesion
    k_c: 0.75,        // centroid spring stiffness

    // Dynamics
    damping: 2.0,
    mass: 1.0,

    // Initialization
    count: 4000,
    spawnRange: 50,      // positions in [-50, 50]
    velocityRange: 15,    // velocities in [-5, 5]
};