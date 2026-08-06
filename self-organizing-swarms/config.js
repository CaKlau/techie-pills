export const SWARM_PARAMS = {
    // Lennard-Jones interaction
    r0: 0.75,        // equilibrium spacing
    epsilon: 1.0,    // well depth

    // Cohesion
    k_c: 0.1,        // centroid spring stiffness

    // Dynamics
    damping: 2,
    mass: 1.0,

    // Initialization
    count: 300,
    spawnRange: 50,      // positions in [-50, 50]
    velocityRange: 500,    // velocities in [-5, 5]
};