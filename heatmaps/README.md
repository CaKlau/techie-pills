# Heatmaps with Kernel Density Estimation

This project explores how to generate heatmaps using Kernel Density Estimation (KDE) — first in an isolated playground, then overlaid on real map data.

### KDE Playground

Experiment with KDE parameters and visual effects in a standalone grid view.

```bash
cd kernel_density_estimation
python3 -m http.server 8081 --bind 127.0.0.1
```

### Heatmap on OpenStreetMap

The same KDE grid can be projected onto OpenStreetMap tiles. As a demo, the app fetches live public earthquake data from USGS and renders it as a heatmap layer.

```bash
python3 -m http.server 8082 --bind 127.0.0.1
```
