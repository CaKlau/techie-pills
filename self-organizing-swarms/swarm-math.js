import { Particle } from "./particle.js";
import { computeCentroid, getRandom, Vector3 } from "./utils.js";

const _separation = new Vector3();
const _cohesion = new Vector3();

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

    addPotentialForce(particleIndex, particles, grid, forceMagnitudeFn, out) {
        const sourceParticle = particles[particleIndex];
        const r_c = this.params.r_c;
        const closeParticleIndices = this.filterCloseParticles(particleIndex, particles, grid);

        for (let j = 0; j < closeParticleIndices.length; j++) {
            const idx = closeParticleIndices[j];
            if (idx == particleIndex) continue;

            _separation.copy(sourceParticle.position).sub(particles[idx].position);
            const distance = _separation.length();
            if (distance >= r_c) continue;

            const forceMagnitude = -forceMagnitudeFn(distance, this.params);
            out.addScaledVector(_separation, forceMagnitude / distance);
        }
    }

    addCohesionForce(particleIndex, centroid, particles, out) {
        _cohesion.copy(particles[particleIndex].position).sub(centroid);
        out.addScaledVector(_cohesion, -this.params.k_c);
    }

    accumulateForces() {
        const centroid = computeCentroid(this.particles);
        const grid = this.buildGrid(this.particles);

        for (let i = 0; i < this.particles.length; i++) {
            const force = this.particles[i].force;
            this.addPotentialForce(i, this.particles, grid, this.forceFn, force);
            this.addCohesionForce(i, centroid, this.particles, force);
        }
    }

    integrate(dt) {
        const forceToVelocity = dt / this.params.mass;
        const dampingFactor = 1 - this.params.damping * dt;

        for (let i = 0; i < this.particles.length; i++) {
            const particle = this.particles[i];

            // semi-implicit (symplectic) Euler, all in place
            particle.velocity.addScaledVector(particle.force, forceToVelocity);
            particle.velocity.scale(dampingFactor);
            particle.position.addScaledVector(particle.velocity, dt);

            particle.force.set(0, 0, 0);
        }
    }

    update(dt) {
        this.accumulateForces();
        this.integrate(dt);
    }

    rebuildSwarm() {
        this.particles = this.initSampleParticles();
    }
}