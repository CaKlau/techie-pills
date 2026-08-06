
export class Particle {
    constructor(position, velocity) {
        this.position = position
        this.velocity = velocity;
    }

    static lennardJonesPotential(r, r0, epsilon) {
        return epsilon * ((r0 / r) ** 12 - 2 * (r0 / r) ** 6);
    }

    static lennardJonesPotentialDerivative(r, r0, epsilon) {
        return (12 * epsilon) / r  * ((r0 / r) ** 6 - (r0 / r) ** 12);
    }

}
