
import { Vector3 } from "./utils.js";

export class Particle {
    constructor(position, velocity) {
        this.position = position
        this.velocity = velocity;
        this.force = new Vector3(0, 0, 0);
    }

    static lennardJonesForce(r, params) {
        const { r0, epsilon } = params;
        return (12 * epsilon) / r * ((r0 / r) ** 6 - (r0 / r) ** 12);
    }

    static morseForce(r, params) {
        const { r0, epsilon, a } = params;
        return 2 * a * epsilon * (Math.exp(-a * (r - r0)) - Math.exp(-2 * a * (r - r0)));
    }

}
