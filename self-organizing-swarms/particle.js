
export class Particle {
    constructor(position, velocity) {
        this.position = position
        this.velocity = velocity;
    }

    static lennartJonesPotential(r, r0 = 1.0, epsilon = 1.0) {
        return epsilon * ((r0 / r) ** 12 - 2 * (r0 / r) ** 6);
    }

    static lennartJonesPotentialDerivative(r, r0 = 1.0, epsilon = 1.0) {
        return (12 * epsilon) / r  * ((r0 / r) ** 6 - (r0 / r) ** 12);
    }

}
