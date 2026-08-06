import { Particle } from "./particle.js";
import { computeCentroid, getRandom, Vector3 } from "./utils.js";

export class SwarmFormation {
    constructor(params) {
        this.params = params;
        this.particles = this.initSampleParticles();
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

    computeLJForceVector(particleIndex, particles) {

        let accumulatedForce = new Vector3(0, 0, 0);

        const sourceParticle = particles[particleIndex];

        for (let j = 0; j < particles.length; j++) {
            if (particleIndex == j) {
                continue;
            }

            const targetParticle = particles[j];

            const separationVector = sourceParticle.position.sub(targetParticle.position);
            const distance = separationVector.length();
            const unitSeparationVector = separationVector.normalize()

            const forceMagnitude = Particle.lennardJonesPotentialDerivative(distance, this.params.r0, this.params.epsilon)

            const partialForce = unitSeparationVector.scale(-forceMagnitude);
            accumulatedForce = accumulatedForce.add(partialForce);
        }

        return accumulatedForce;
    }


    computeCentroidCohersionForce(particleIndex, centroid, particles) {
        let forceCentroidCohersion = particles[particleIndex].position.sub(centroid).scale(-this.params.k_c)
        return forceCentroidCohersion
    }

    computeForceVector(particleIndex, centroid, particles) {
        
        const LVForce = this.computeLJForceVector(particleIndex, particles);

        const CCForce = this.computeCentroidCohersionForce(particleIndex, centroid, particles);

        return LVForce.add(CCForce);
    }

    update(dt) {

        let forces = [];
        let centroid = computeCentroid(this.particles);

        for (let i = 0; i < this.particles.length; i++) {

            let force = this.computeForceVector(i, centroid, this.particles)

            forces.push(force)
        }
    


        for (let i = 0; i < this.particles.length; i++) {

            let particle = this.particles[i];

            let force = forces[i];

            force = force.scale(dt / this.params.mass)

            particle.velocity = particle.velocity.add(force)

            particle.velocity = particle.velocity.scale(1 - this.params.damping * dt);

            particle.position = particle.position.add(particle.velocity.scale(dt))

        }
    }
}