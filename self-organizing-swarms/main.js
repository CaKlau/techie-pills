import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { SwarmFormation } from "./swarm-math.js";
import { SWARM_PARAMS } from "./config.js";
import { ParameterControls } from "./gui.js";


// 1. Scene, camera, renderer — the three essentials
const scene = new THREE.Scene();
const clock = new THREE.Clock();
const geometry = new THREE.SphereGeometry(0.2, 16, 16); // radius, resolution
const material = new THREE.MeshStandardMaterial({ color: 0xffffff });

const COLOR_SLOW = new THREE.Color(0x30F091);   // your green, speed 0
const COLOR_FAST = new THREE.Color(0xF0304F);   // a "fitting red" — pick to taste
const scratchColor = new THREE.Color();         // reused every particle

const camera = new THREE.PerspectiveCamera(
    75,                                     // field of view
    window.innerWidth / window.innerHeight, // aspect ratio
    0.1,                                    // near clip
    1000                                    // far clip
);

camera.position.z = 35;                    // pull the camera back so we can see

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(window.devicePixelRatio); // less pixalated spehres
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);


const controls = new OrbitControls(camera, renderer.domElement);
controls.target.set(0, 0, 0);   // orbit around the swarm's center
controls.update();

// Instantiate Swarm
const swarm = new SwarmFormation(SWARM_PARAMS);

// Instantiate lil-gui controls
const gui = new ParameterControls(swarm, SWARM_PARAMS);

// InstancedMesh container for particles
const numberParticles = swarm.particles.length;
const spheres = new THREE.InstancedMesh(geometry, material, numberParticles);
spheres.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
spheres.frustumCulled = false;
scene.add(spheres);
const dummy = new THREE.Object3D();

//  Light — StandardMaterial needs light to be visible
const light = new THREE.DirectionalLight(0xffffff, 1.0);
light.position.set(2, 3, 4);
scene.add(light);
scene.add(new THREE.AmbientLight(0xffffff, 0.3)); // soft fill


const hsl = {};

function syncInstances() {
    for (let i = 0; i < swarm.particles.length; i++) {
        const p = swarm.particles[i].position;
        dummy.position.set(p.x, p.y, p.z);
        dummy.updateMatrix();
        spheres.setMatrixAt(i, dummy.matrix);

        const speed = swarm.particles[i].velocity.length();
        const t = speed / (speed + SWARM_PARAMS.vRef); // soft, saturating: [0,∞) → [0,1)
        scratchColor.lerpColors(COLOR_SLOW, COLOR_FAST, t);

        scratchColor.getHSL(hsl);
        scratchColor.setHSL(hsl.h, 1.0, hsl.l);   // keep hue & lightness, Hardcode saturation to 1.0 (full)

        spheres.setColorAt(i, scratchColor);
    }
    spheres.instanceMatrix.needsUpdate = true;
    spheres.instanceColor.needsUpdate = true;
}

const grid = new THREE.GridHelper(1000, 1000, 0x444444, 0x222222);
grid.rotation.x = Math.PI / 2; // stand it up into the x/y plane
scene.add(grid);



let accumulator = 0;
const step = 1 / 100; // simulate at a fixed 100 Hz
const maxSubSteps = 3; // ost catch-up steps allowed per frame

// 4. Render loop
function animate() {
    requestAnimationFrame(animate);

    // Explanation of this loop:
    // Correct speed on any machine: a 144 Hz monitor calls animate() more 
    // often but runs fewer substeps each time; both land on 200 physics 
    // steps per real second.

    accumulator += clock.getDelta();
    accumulator = Math.min(accumulator, maxSubSteps * step);
    while (accumulator >= step) {
        swarm.update(step)
        accumulator -= step;
    }

    syncInstances();
    controls.update();
    renderer.render(scene, camera);
}
animate();

// Keep it responsive on resize
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});