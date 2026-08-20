import GUI from "lil-gui";
import { POTENTIALS } from "./swarm-math.js"

export class ParameterControls {

    constructor(swarm, params) {
        this.swarm = swarm;
        this.params = params;
        this.gui = new GUI({ title: "Swarm Controls", width: 250 });

        const physics = this.gui.addFolder("Physics");


        // potential is cached as forceFn — re-resolve on change
        physics.add(this.params, "potential", ["lj", "morse"])
            .onChange(() => { swarm.forceFn = POTENTIALS[this.params.potential]; });

        physics.add(this.params, "damping", 0, 20, 0.05);
        physics.add(this.params, "r0", 1.0, 10.0, 0.05)
            .onChange(() => { this.params.r_c = 2.5 * this.params.r0 });

        physics.add(this.params, "epsilon", 1.0, 10.0, 0.05);
        physics.add(this.params, "k_c", 0, 3, 0.05);
        physics.add(this.params, "r_c", 0.5, 20, 0.1)
            .name("r_c")
            .listen()                 // display auto-tracks the derived value
            .disable();               // read-only — can't violate the invariance

        physics.add(this.params, "a", 0.2, 4, 0.1);
        physics.add(this.params, "mass", 1, 5, 1);

        const appearance = this.gui.addFolder("Appearance");
        appearance.add(this.params, "vRef", 0.1, 20, 0.1)
            .name("vRef (color)");
       

        // count/spawn need a fresh swarm — add a reset button
        this.gui.add({ reset: () => swarm.rebuildSwarm() }, "reset").name("Respawn");

    }
}
