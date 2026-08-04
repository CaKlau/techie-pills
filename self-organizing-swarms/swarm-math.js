import { Particle } from "./particle.js";
import { getRandom, getRandomInt, Vector3 } from "./utils.js";

export class SwarmFormation {
    constructor() {
        this.particles = this.initSampleParticles(20);
        this.damping = 0.3;
        this.mass = 1.0;
    };

    initSampleParticles(number) {
        let new_particles = [];

        for (let i = 0; i < number; i++) {

            const p_x = getRandom(-5, 5);
            const p_y = getRandom(-5, 5);
            const p_z = 0;

            const v_x = getRandom(-2, 2);
            const v_y = getRandom(-2, 2);
            const v_z = 0;

            const particle = new Particle(
                new Vector3(p_x, p_y, p_z),
                new Vector3(v_x, v_y, v_z),
            );
            new_particles.push(particle)
        }
        return new_particles;
    }

    computeForceVector(particleIndex, particles) {

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

            const forceMagnitude = Particle.lennartJonesPotentialDerivative(distance)

            const partialForce = unitSeparationVector.scale(-forceMagnitude);
            accumulatedForce = accumulatedForce.add(partialForce);
        }
        return accumulatedForce;
    }

    update(dt) {

        let forces = [];

        for (let i = 0; i < this.particles.length; i++) {

            let force = this.computeForceVector(i, this.particles)

            forces.push(force)
        }

        for (let i = 0; i < this.particles.length; i++) {

            let particle = this.particles[i];

            let force = forces[i];

            force = force.scale(dt / this.mass)

            particle.velocity = particle.velocity.add(force)

            particle.velocity = particle.velocity.scale(1 - this.damping * dt);

            particle.position = particle.position.add(particle.velocity.scale(dt))

        }
    }
}