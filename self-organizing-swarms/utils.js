

export function getRandomInt(min, max) {
  const minCeiled = Math.ceil(min);
  const maxFloored = Math.floor(max);
  return Math.floor(Math.random() * (maxFloored - minCeiled) + minCeiled); // The maximum is exclusive and the minimum is inclusive
}


export function getRandom(min, max) {
  return Math.random() * (max - min) + min;
}

export function computeCentroid(particles) {
  
  let centroid = new Vector3(0, 0, 0);
  
  for (let i = 0; i < particles.length; i++) {
    centroid = centroid.add(particles[i].position)
  }
  centroid = centroid.scale(1.0 / particles.length)
  return centroid;
}


export class Vector3 {
  constructor(x = 0, y = 0, z = 0) {
    this.x = x;
    this.y = y;
    this.z = z;
  }

  add(v) {
    return new Vector3(this.x + v.x, this.y + v.y, this.z + v.z);
  }

  sub(v) {
    return new Vector3(this.x - v.x, this.y - v.y, this.z - v.z);
  }

  scale(s) {
    return new Vector3(this.x * s, this.y * s, this.z * s);
  }

  distance(v) {
    const dx = this.x - v.x
    const dy = this.y - v.y
    const dz = this.z - v.z
    return Math.sqrt(dx * dx + dy * dy + dz * dz);

  }

  length() {
    return Math.sqrt(this.x * this.x + this.y * this.y + this.z * this.z);
  }

  normalize() {
    const len = this.length();
    return len === 0 ? new Vector3() : this.scale(1 / len); // guard divide-by-zero
  }

}