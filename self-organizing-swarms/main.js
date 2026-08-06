import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { SwarmFormation } from "./swarm-math.js";
import { SWARM_PARAMS } from "./config.js";


// 1. Scene, camera, renderer — the three essentials
const scene = new THREE.Scene();
const clock = new THREE.Clock();
const geometry = new THREE.SphereGeometry(0.2, 32, 32); 
const material = new THREE.MeshStandardMaterial({ color: 0x30F091 });

const camera = new THREE.PerspectiveCamera(
    75,                                     // field of view
    window.innerWidth / window.innerHeight, // aspect ratio
    0.1,                                    // near clip
    1000                                    // far clip
);

camera.position.z = 30;                    // pull the camera back so we can see

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(window.devicePixelRatio); // less pixalated spehres
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);


const controls = new OrbitControls(camera, renderer.domElement);
controls.target.set(0, 0, 0);   // orbit around the swarm's center
controls.update();


const swarm = new SwarmFormation(SWARM_PARAMS);

let meshes = swarm.particles.map(() => {
    const m = new THREE.Mesh(geometry, material);
    scene.add(m);
    return m;
});

// 3. Light — StandardMaterial needs light to be visible
const light = new THREE.DirectionalLight(0xffffff, 1.0);
light.position.set(2, 3, 4);
scene.add(light);
scene.add(new THREE.AmbientLight(0xffffff, 0.3)); // soft fill


function syncMeshes() {
    for (let i = 0; i < swarm.particles.length; i++) {
        const p = swarm.particles[i].position;
        meshes[i].position.set(p.x, p.y, p.z);
    }
}

const grid = new THREE.GridHelper(100, 100, 0x444444, 0x222222);
grid.rotation.x = Math.PI / 2; // stand it up into the x/y plane
scene.add(grid);



let accumulator = 0;
const step = 1 / 200; // simulate at a fixed 200 Hz

// 4. Render loop
function animate() {
    requestAnimationFrame(animate);

    accumulator += clock.getDelta();
    while (accumulator >= step) {
        swarm.update(step)
        accumulator -= step;
    }
    syncMeshes();

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