import { Particle } from "./particle.js";
import { computeCentroid, getRandom, Vector3 } from "./utils.js";

export const POTENTIALS = {
    lj: Particle.lennardJonesForce,
    morse: Particle.morseForce,
};

export class SwarmFormation {
    constructor(params) {
        this.params = params;
        this.forceFn = POTENTIALS[params.potential];
        this.particles = this.initSampleParticles();
        
        this.params.r_c = 2.5 * this.params.r0 // Invariance to assure r0 < r_c

    };

    initSampleParticles() {
        const { count, spawnRange, velocityRange } = this.params;
        let new_particles = [];

        for (let i = 0; i < count; i++) {

            const p_x = getRandom(-spawnRange, spawnRange);
            const p_y = getRandom(-spawnRange, spawnRange);
            const p_z = 0;

            const v_x = getRandom(-velocityRange, velocityRange);
            const v_y = getRandom(-velocityRange, velocityRange);
            const v_z = 0;

            const particle = new Particle(
                new Vector3(p_x, p_y, p_z),
                new Vector3(v_x, v_y, v_z),
            );
            new_particles.push(particle)
        }
        return new_particles;
    }

    cellKey(cx, cy, cz) {
        return `${cx},${cy},${cz}`;
    }

    buildGrid(particles) {
        const r_c = this.params.r_c;
        const grid = new Map();
        for (let i = 0; i < particles.length; i++) {
            const p = particles[i].position;
            const key = this.cellKey(Math.floor(p.x / r_c), Math.floor(p.y / r_c), Math.floor(p.z / r_c));
            if (!grid.has(key)) grid.set(key, []);
            grid.get(key).push(i);
        }
        return grid;
    }

    filterCloseParticles(sourceParticleIndex, particles, grid) {

        let closeParticleIndices = []
        const sourceParticle = particles[sourceParticleIndex];

        const r_c = this.params.r_c;
        const cx = Math.floor(sourceParticle.position.x / r_c);
        const cy = Math.floor(sourceParticle.position.y / r_c);
        const cz = Math.floor(sourceParticle.position.z / r_c);



        for (let dx = -1; dx <= 1; dx++) {
            for (let dy = -1; dy <= 1; dy++) {
                for (let dz = -1; dz <= 1; dz++) {

                    const cell = grid.get(this.cellKey(cx + dx, cy + dy, cz + dz));
                    if (!cell) continue;

                    closeParticleIndices.push(...cell);

                }
            }
        }
        return closeParticleIndices
    }

    computePotentialForceVector(particleIndex, particles, grid, forceMagnitudeFn) {

        let accumulatedForce = new Vector3(0, 0, 0);

        const sourceParticle = particles[particleIndex];

        const closeParticleIndices = this.filterCloseParticles(particleIndex, particles, grid);

        for (let j = 0; j < closeParticleIndices.length; j++) {
            
            const idx = closeParticleIndices[j]
            if (idx == particleIndex) continue;   // no force on self

            const separationVector = sourceParticle.position.sub(particles[idx].position);
            const distance = separationVector.length();

            if (distance >= this.params.r_c) continue; // Dispite grid cutoff we need to respect the radius

            const unitSeparationVector = separationVector.normalize();

            const forceMagnitude = -forceMagnitudeFn(distance, this.params);
            accumulatedForce = accumulatedForce.add(unitSeparationVector.scale(forceMagnitude));
        }

        return accumulatedForce;
    }


    computeCentroidCohesionForce(particleIndex, centroid, particles) {
        let forceCentroidCohesion = particles[particleIndex].position.sub(centroid).scale(-this.params.k_c)
        return forceCentroidCohesion
    }



    computeForceVector(particleIndex, centroid, particles, grid) {

        const potentialForce = this.computePotentialForceVector(particleIndex, particles, grid, this.forceFn);

        const cohesionForce = this.computeCentroidCohesionForce(particleIndex, centroid, particles);

        return potentialForce.add(cohesionForce);
    }

    update(dt) {

        let forces = [];
        let centroid = computeCentroid(this.particles);
        let grid = this.buildGrid(this.particles);

        // 1. Compute forces first ... 
        for (let i = 0; i < this.particles.length; i++) {

            let force = this.computeForceVector(i, centroid, this.particles, grid)

            forces.push(force)
        }
        // 2. ... then change position (not mixed)
        for (let i = 0; i < this.particles.length; i++) {

            let particle = this.particles[i];

            let force = forces[i];

            //  semi-implicit (symplectic) Euler

            force = force.scale(dt / this.params.mass)

            particle.velocity = particle.velocity.add(force)

            particle.velocity = particle.velocity.scale(1 - this.params.damping * dt);

            particle.position = particle.position.add(particle.velocity.scale(dt))

        }
    }

    rebuildSwarm() {
        this.particles = this.initSampleParticles();
    }
}