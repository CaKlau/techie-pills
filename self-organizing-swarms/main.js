import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { SwarmFormation } from "./swarm-math.js";
import { SWARM_PARAMS } from "./config.js";
import { ParameterControls } from "./gui.js";
import { ProjectileSystem } from "./projectiles.js";
import { Vector3 } from "./utils.js";


// 1. Scene, camera, renderer — the three essentials
const scene = new THREE.Scene();
const clock = new THREE.Clock();
const geometry = new THREE.SphereGeometry(0.2, 16, 16); // radius, resolution
const material = new THREE.MeshStandardMaterial({ color: 0xffffff });

const COLOR_SLOW = new THREE.Color(0x30F091);   // your green, speed 0
const COLOR_FAST = new THREE.Color(0xF0304F);   // a "fitting red" — pick to taste
const scratchColor = new THREE.Color();         // reused every particle

const camera = new THREE.PerspectiveCamera(
    75,                                     // field of view in degree
    window.innerWidth / window.innerHeight, // aspect ratio
    0.1,                                    // near clip (how far the "window plane" is away from the eye)
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




const projectiles = new ProjectileSystem(SWARM_PARAMS);

const projectileGeometry = new THREE.SphereGeometry(1.0, 16, 16);
const projectileMaterial = new THREE.MeshStandardMaterial({ color: 0xffa500 });
const projectileMeshes = new Map();

function syncProjectiles() {
    for (const p of projectiles.projectiles) {
        let mesh = projectileMeshes.get(p);
        if (!mesh) {
            mesh = new THREE.Mesh(projectileGeometry, projectileMaterial);
            scene.add(mesh);
            projectileMeshes.set(p, mesh);
        }
        mesh.position.set(p.position.x,p.position.y,p.position.z);
    }
    // Projectile remove when leaving bounding box
    for (const [p, mesh] of projectileMeshes) {
        if(!projectiles.projectiles.includes(p)) {
            scene.remove(mesh);
            projectileMeshes.delete(p);
        }
    }
}

let armed = false;
window.addEventListener("keydown", e => { 
    if (e.key === "x") { 
        armed = true;  
        controls.enabled = false; 
    } });

window.addEventListener("keyup", e => { 
    if (e.key === "x") { 
        armed = false; 
        controls.enabled = true;  
    } });


const raycaster = new THREE.Raycaster();
const distance = 15.0
const projectileVelocity = 25.0

renderer.domElement.addEventListener("pointerdown", e => {
    if (!armed || e.button !== 0) return;

    const ndcX = e.clientX / window.innerWidth * 2 - 1;
    const ndcY = -e.clientY / window.innerHeight * 2 + 1;
    const ndc = new THREE.Vector2(ndcX, ndcY);
    raycaster.setFromCamera(ndc, camera); // setup of the ray, create a ray between eye and window cross point

    const rayOrigin = raycaster.ray.origin // the eye of the camera
    const rayDirection = raycaster.ray.direction;

   // spawn = origin + direction * distance
    const spawn = rayDirection.clone().multiplyScalar(distance).add(rayOrigin);

    projectiles.shoot(
        new Vector3(spawn.x, spawn.y, spawn.z),
        new Vector3(
            rayDirection.x * projectileVelocity, 
            rayDirection.y * projectileVelocity, 
            rayDirection.z * projectileVelocity)
    )

});





let accumulator = 0;
const step = SWARM_PARAMS.dt;
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
        projectiles.applyForces(swarm.particles);
        swarm.update(step)
        projectiles.update(step)
        accumulator -= step;
    }

    syncInstances();
    syncProjectiles()
    
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