

r_c - filter out far away neighbours

three.core.js:2001 THREE.Clock: This module has been deprecated. Please use THREE.Timer instead.




function addGridBox(size = 20, divisions = 20, color = 0x333333) {
    const floor = new THREE.GridHelper(size, divisions, color, color); // x/z
    const wall  = new THREE.GridHelper(size, divisions, color, color); // x/y
    const side  = new THREE.GridHelper(size, divisions, color, color); // y/z

    wall.rotation.x = Math.PI / 2;
    side.rotation.z = Math.PI / 2;

    scene.add(floor, wall, side);
}
addGridBox();