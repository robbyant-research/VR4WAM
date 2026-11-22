// Every number on the page, copied from the technical report's tables and the data records of its figures
// (paper/tr-work-20261117: tables/report/*.tex, figures/report/*/source.json, scripts/render_pretraining_results.py).
// Success in percent; losses x 1e-3.

const SPACES = [
  { key: "wan", name: "Wan VAE", kind: "recon", color: "#D9820F", fill: "#F5A83D",
    about: "Latent of the Wan2.2 video generator's VAE, used in its native form." },
  { key: "flux2", name: "FLUX.2 AE", kind: "recon", color: "#A93E2C", fill: "#C9644A",
    about: "Latent of the FLUX.2 image generator's autoencoder, used in its native form." },
  { key: "siglip", name: "SigLIP 2", kind: "repr", color: "#3E8FC4", fill: "#ABCCF5",
    about: "Language–image encoder; features projected to 32 channels by a frozen PCA." },
  { key: "dino", name: "DINOv3", kind: "repr", color: "#2346B8", fill: "#5D8DFD",
    about: "Self-supervised image encoder; features projected to 32 channels by a frozen PCA." },
  { key: "vggt", name: "VGGT-Ω", kind: "repr", color: "#4A8B32", fill: "#88B06D",
    about: "Geometry encoder; features projected to 32 channels by a frozen PCA." },
  { key: "vjepa", name: "V-JEPA 2.1", kind: "repr", color: "#7B45C2", fill: "#A48CE6",
    about: "Self-supervised video encoder; features projected to 32 channels by a frozen PCA." },
];

// Single spaces trained from scratch (Table 1, Table 8, Figure 3). RoboTwin: 50 tasks x 100 episodes per
// condition; LIBERO: 40 tasks x 50 trials; LIBERO-Plus: 10,030 tasks.
const SINGLE = {
  wan:    { c2c: 72.0, c2r: 1.0,  libero: 94.5, plus: 47.6 },
  flux2:  { c2c: 76.6, c2r: 1.0,  libero: 95.2, plus: 47.1 },
  siglip: { c2c: 81.4, c2r: 16.2, libero: 97.9, plus: 60.5 },
  dino:   { c2c: 79.7, c2r: 6.1,  libero: 97.2, plus: 58.4 },
  vggt:   { c2c: 81.8, c2r: 22.2, libero: 97.8, plus: 65.2 },
  vjepa:  { c2c: 84.3, c2r: 20.5, libero: 98.0, plus: 57.3 },
};

// LIBERO-Plus success by perturbation category (Table 1).
const CATEGORIES = ["Camera", "Noise", "Background", "Light", "Robot", "Layout", "Language"];
const CATEGORY_ABOUT = {
  Camera: "camera viewpoint", Noise: "sensor noise", Background: "background", Light: "lighting",
  Robot: "robot initial state", Layout: "object layout", Language: "language instruction",
};
const PLUS_BY_CATEGORY = {
  wan:    [21.6, 40.6, 16.8, 68.0, 48.4, 64.7, 70.4],
  flux2:  [28.7, 37.9, 21.0, 76.8, 32.6, 59.4, 74.7],
  siglip: [24.2, 60.8, 77.8, 94.0, 29.6, 69.6, 83.1],
  dino:   [48.2, 54.0, 48.7, 87.8, 28.1, 68.4, 79.2],
  vggt:   [45.9, 61.5, 78.8, 93.5, 31.0, 74.0, 84.4],
  vjepa:  [28.5, 59.3, 41.6, 90.9, 33.0, 71.1, 82.3],
};
// V-JEPA 2.1 aligned to Wan VAE (Table 2).
const PLUS_ALIGNED_TO_WAN = {
  repa: [33.0, 69.8, 61.6, 95.4, 57.7, 75.1, 84.6],
  ff:   [33.8, 71.4, 67.0, 95.8, 57.7, 75.1, 84.5],
};

// Figure 2: the 21 flow-matching-only configurations; loss = AgiBot pretraining action loss (30k-40k mean).
const MEASURE = {
  robotwin: [
    ["wan", "Wan VAE", null, null, 8.849, 71.96, 0.98],
    ["flux2", "FLUX.2 AE", null, null, 8.723, 76.6, 1.02],
    ["siglip", "SigLIP 2", null, null, 8.823, 81.36, 16.18],
    ["dino", "DINOv3", null, null, 8.432, 79.74, 6.1],
    ["vggt", "VGGT-Ω", null, null, 8.242, 81.84, 22.2],
    ["vjepa", "V-JEPA 2.1", null, null, 7.915, 84.28, 20.52],
    ["wan", "Wan VAE + DINOv3", "dino", "Fusion", 8.499, 81.5, 3.72],
    ["wan", "Wan VAE + DINOv3", "dino", "Joint Attention", 8.349, 83.74, 3.82],
    ["wan", "Wan VAE + DINOv3", "dino", "Multi-expert", 8.23, 83.78, 1.62],
    ["vjepa", "V-JEPA 2.1 + VGGT-Ω", "vggt", "Fusion", 7.777, 83.38, 23.64],
    ["vjepa", "V-JEPA 2.1 + VGGT-Ω", "vggt", "Joint Attention", 7.85, 84.7, 29.12],
    ["vjepa", "V-JEPA 2.1 + VGGT-Ω", "vggt", "Multi-expert", 7.807, 85.72, 26.98],
    ["vjepa", "V-JEPA 2.1 + SigLIP 2", "siglip", "Fusion", 7.854, 85.56, 22.6],
    ["vjepa", "V-JEPA 2.1 + SigLIP 2", "siglip", "Joint Attention", 8.026, 86.78, 25.8],
    ["vjepa", "V-JEPA 2.1 + SigLIP 2", "siglip", "Multi-expert", 7.973, 86.64, 25.08],
    ["vjepa", "V-JEPA 2.1 + DINOv3", "dino", "Fusion", 7.746, 84.26, 13.58],
    ["vjepa", "V-JEPA 2.1 + DINOv3", "dino", "Joint Attention", 7.744, 85.36, 18.52],
    ["vjepa", "V-JEPA 2.1 + DINOv3", "dino", "Multi-expert", 7.728, 84.58, 13.06],
    ["vjepa", "V-JEPA 2.1 + Wan VAE", "wan", "Fusion", 8.018, 82.4, 2.42],
    ["vjepa", "V-JEPA 2.1 + Wan VAE", "wan", "Joint Attention", 7.748, 84.58, 4.06],
    ["vjepa", "V-JEPA 2.1 + Wan VAE", "wan", "Multi-expert", 7.695, 85.04, 16.48],
  ],
  liberoPlus: [
    ["wan", "Wan VAE", null, null, 8.849, 47.57],
    ["flux2", "FLUX.2 AE", null, null, 8.723, 47.14],
    ["siglip", "SigLIP 2", null, null, 8.823, 60.49],
    ["dino", "DINOv3", null, null, 8.432, 58.41],
    ["vggt", "VGGT-Ω", null, null, 8.242, 65.2],
    ["vjepa", "V-JEPA 2.1", null, null, 7.915, 57.34],
    ["wan", "Wan VAE + DINOv3", "dino", "Fusion", 8.499, 65.59],
    ["wan", "Wan VAE + SigLIP 2", "siglip", "Fusion", 8.648, 60.79],
    ["wan", "Wan VAE + V-JEPA 2.1", "vjepa", "Fusion", 7.931, 64.4],
    ["wan", "Wan VAE + VGGT-Ω", "vggt", "Fusion", 8.405, 65.54],
    ["vjepa", "V-JEPA 2.1 + DINOv3", "dino", "Fusion", 7.746, 60.67],
    ["vjepa", "V-JEPA 2.1 + SigLIP 2", "siglip", "Fusion", 7.854, 64.57],
    ["vjepa", "V-JEPA 2.1 + VGGT-Ω", "vggt", "Fusion", 7.777, 63.91],
    ["dino", "DINOv3 + SigLIP 2", "siglip", "Fusion", 8.107, 66.48],
    ["wan", "Wan VAE + DINOv3", "dino", "Joint Attention", 8.349, 62.4],
    ["wan", "Wan VAE + DINOv3", "dino", "Multi-expert", 8.23, 63.7],
    ["vjepa", "V-JEPA 2.1 + DINOv3", "dino", "Joint Attention", 7.744, 61.97],
    ["vjepa", "V-JEPA 2.1 + DINOv3", "dino", "Multi-expert", 7.728, 62.93],
    ["vjepa", "V-JEPA 2.1 + VGGT-Ω", "vggt", "Joint Attention", 7.85, 61.75],
    ["vjepa", "V-JEPA 2.1 + VGGT-Ω", "vggt", "Multi-expert", 7.807, 63.09],
    ["vjepa", "V-JEPA 2.1 + Wan VAE", "wan", "Multi-expert", 7.695, 62.1],
  ],
  r: { clean: -0.80, random: -0.53, plus: -0.48 },
};

// The five couplings (Section 4.1, Table 7, Figure 7: training compute per step relative to one space).
const COUPLINGS = [
  { key: "repa", name: "REPA", family: "aligning", color: "#2F5FD0", compute: 1.01,
    about: "Aligns the world Transformer's hidden states with the future features of the second space." },
  { key: "ff", name: "Feature Forcing", family: "aligning", color: "#D47A06", compute: 1.34,
    about: "Also feeds the model its own prediction of the second space, made by an extra forward pass." },
  { key: "fusion", name: "Fusion", family: "input", color: "#4A8B32", compute: 1.00,
    about: "Adds the second space's tokens to the primary space's, position by position." },
  { key: "ja", name: "Joint Attention", family: "input", color: "#3B93C9", compute: 1.96,
    about: "Lets the two token sequences attend to each other in the last 24 world layers." },
  { key: "me", name: "Multi-expert", family: "input", color: "#858585", compute: 1.24,
    about: "Gives the second space a world Transformer of its own; the action expert reads both." },
];

// RoboTwin success of V-JEPA 2.1 with each second space (Table 8; self-pair from its caption): [C2C, C2R].
const PAIRS = [
  { second: "wan", name: "Wan VAE", alone: [72.0, 1.0],
    repa: [85.1, 29.4], ff: [86.4, 33.0], fusion: [82.4, 2.4], ja: [84.6, 4.1], me: [85.0, 16.5] },
  { second: "dino", name: "DINOv3", alone: [79.7, 6.1],
    repa: [87.4, 26.8], ff: [85.8, 35.8], fusion: [84.3, 13.6], ja: [85.4, 18.5], me: [84.6, 13.1] },
  { second: "siglip", name: "SigLIP 2", alone: [81.4, 16.2],
    repa: [85.8, 25.4], ff: [85.3, 34.3], fusion: [85.6, 22.6], ja: [86.8, 25.8], me: [86.6, 25.1] },
  { second: "vggt", name: "VGGT-Ω", alone: [81.8, 22.2],
    repa: [86.6, 25.5], ff: [85.5, 35.3], fusion: [83.4, 23.6], ja: [84.7, 29.1], me: [85.7, 27.0] },
  { second: "vjepa", name: "V-JEPA 2.1 (itself)", alone: [84.3, 20.5],
    repa: [84.1, 19.5], ff: [83.9, 31.1], fusion: [85.2, 24.2], ja: [84.2, 22.4], me: [85.6, 26.8] },
];
const PRIMARY_ALONE = [84.3, 20.5];

// Pretraining data (Figure 8): training hours per embodiment; 24,454 h in total, 2,096 h simulated.
const EMBODIMENTS = [
  ["AgiBot G1", 6702.9], ["Leju KUAVO 4 Pro", 4966.3], ["AgileX", 3143.4], ["Galaxea R1Lite", 2015.9],
  ["Astribot S1", 1581.8], ["ARX Lift2", 1507.6], ["Galaxea R1Pro", 1453.1], ["Tienkung", 1158.5],
  ["YAM", 1125.1], ["Realman Rs-02", 799.4],
];

// After pretraining and fine-tuning (Figure 10, tables/pretraining-sota.tex): published policies as reported.
const OURS = [
  { key: "wan", name: "Ours (Wan VAE)", color: "#F5A83D" },
  { key: "vjepa", name: "Ours (V-JEPA 2.1)", color: "#A48CE6" },
  { key: "ff", name: "Ours (V-JEPA 2.1 + Wan VAE)", color: "#7B45C2", hatch: true },
];
const BENCHMARKS = [
  { key: "c2r", name: "RoboTwin 2.0, randomized", unit: "success (%)",
    ours: { wan: 56.9, vjepa: 63.9, ff: 65.3 },
    published: { "Spatial Forcing": 62.6, "OpenWAM-α": 48.7, "π0.5": 46.0, "4D-WAM": 41.8, "X-WAM": 25.8,
                 "starVLA": 3.2, "Fast-WAM": 1.9 } },
  { key: "avg", name: "RoboTwin 2.0, average", unit: "success (%), mean of clean and randomized",
    ours: { wan: 71.2, vjepa: 76.1, ff: 77.1 },
    published: { "OpenWAM-α": 69.1, "Spatial Forcing": 68.7, "4D-WAM": 61.7, "π0.5": 58.4, "X-WAM": 47.9,
                 "Fast-WAM": 39.9, "starVLA": 24.8 } },
  { key: "robocasa", name: "RoboCasa", unit: "success (%)",
    ours: { wan: 56.4, vjepa: 61.9, ff: 68.5 },
    published: { "Spatial Forcing": 67.6, "Cosmos Policy": 67.1, "FLARE": 66.4, "Video Policy": 66.0,
                 "GR00T-N1.5": 64.1, "π0": 62.5, "UWM": 60.8, "DreamGen": 57.6, "GR00T-N1": 49.6 } },
  { key: "robodojo", name: "RoboDojo", unit: "leaderboard score",
    ours: { wan: 13.1, vjepa: 15.1, ff: 17.6 },
    published: { "OpenWAM-α": 17.2, "4D-WAM": 12.7, "Spatial Forcing": 12.4, "π0.5": 11.4, "X-WAM": 7.7,
                 "starVLA": 6.4, "Fast-WAM": 3.5 } },
  { key: "plus", name: "LIBERO-Plus", unit: "success (%)",
    ours: { wan: 70.7, vjepa: 72.5, ff: 82.9 },
    published: { "π0.5": 84.8, "Cosmos Policy": 82.2, "starVLA": 77.8, "X-WAM": 74.8, "Spatial Forcing": 71.1,
                 "4D-WAM": 71.0, "OpenWAM-α": 68.8, "π0": 53.6, "Fast-WAM": 52.6 } },
  { key: "pro", name: "LIBERO-PRO", unit: "success (%), mean of four perturbations",
    ours: { wan: 51.4, vjepa: 55.2, ff: 57.6 },
    published: { "π0.5": 58.6, "OpenWAM-α": 57.9, "X-WAM": 55.0, "4D-WAM": 50.4, "starVLA": 48.0,
                 "Spatial Forcing": 45.1, "Fast-WAM": 42.7 } },
];

// Real robot (Figure 11): successes / trials; pi0.5 fine-tuned with openpi on the same demonstrations.
const REAL = [
  { key: "tube_id", name: "Tube insertion, in domain", trials: 10,
    values: { wan: 6, vjepa: 6, ff: 8, pi05: 6 } },
  { key: "tube_ood", name: "Tube insertion, new positions", trials: 10,
    values: { wan: 3, vjepa: 4, ff: 7, pi05: 2 } },
  { key: "screws", name: "Picking up screws", trials: 30,
    values: { wan: 26, vjepa: 24, ff: 27, pi05: 26 } },
];
