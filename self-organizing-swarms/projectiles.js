import { Vector3 } from "./utils.js";

const _offset = new Vector3();

export class Projectile {
  constructor(position, velocity) {
    this.position = position;
    this.velocity = velocity;
  }
}

export class ProjectileSystem {
  constructor(params) {
    this.params = params;
    this.projectiles = [];
  }

  shoot(position, velocity) {
    this.projectiles.push(new Projectile(position, velocity));
  }

  update(dt) {
    for (const p of this.projectiles) {
      p.position.addScaledVector(p.velocity, dt);
    }
    this.projectiles = this.projectiles.filter(
      (p) =>
        Math.abs(p.position.x) <= 300 &&
        Math.abs(p.position.y) <= 300 &&
        Math.abs(p.position.z) <= 300,
    );
  }

  applyForces(particles) {
    const { C, rho } = this.params;
    const strength = C / (rho * rho);
    const twoRhoSquared = 2 * rho * rho;

    for (const projectile of this.projectiles) {
      for (const particle of particles) {
        _offset.copy(particle.position).sub(projectile.position);
        const distanceSquared = _offset.x ** 2 + _offset.y ** 2 + _offset.z ** 2;
        const falloff = Math.exp(-distanceSquared / twoRhoSquared);
        particle.force.addScaledVector(_offset, strength * falloff);
      }
    }
  }
}
