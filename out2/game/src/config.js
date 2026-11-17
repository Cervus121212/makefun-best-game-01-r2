// STORMKEEPER — tuning, crops, valleys and upgrades.
// Pure data: no imports, no side effects. Every number here was chosen so a
// valley is winnable with focused play and lost when the keeper ignores a
// dry field or lets a storm sit over ripe crops.

export const VIEW_W = 1280;
export const VIEW_H = 720;
export const HUD_H = 56;
export const LAKE_Y = 648; // the lake strip along the bottom refills clouds

// A plot drinks while its water is above the thirst line and grows while it
// drinks. Rain can only soak a plot so far: the gain fades as the soil
// nears soaked, so no amount of rain floods a crop. Neglect is the killer
// instead — a plot left dry withers and must be replanted.
export const THIRST = 22;
export const SOAKED = 85; // rain stops soaking a plot past this water level
export const WITHER_LOW = 10; // below this water a crop starts withering
export const WITHER_TIME = 5; // seconds bone-dry before it withers
export const EVAP_PER_SEC = 3.2; // water lost per second, more on hot days
export const GROW_PER_SEC = 9.0; // growth gained per second while drinking

export const CROPS = {
  wheat:   { name: 'Wheat',   growTime: 1.0, value: 10, color: '#e8b64c', seed: '🌾' },
  berry:   { name: 'Berry',   growTime: 0.8, value: 8,  color: '#e0586a', seed: '🍇' },
  corn:    { name: 'Corn',    growTime: 1.3, value: 16, color: '#7ec850', seed: '🌽' },
  pumpkin: { name: 'Pumpkin', growTime: 1.8, value: 26, color: '#e07b39', seed: '🎃' },
  grape:   { name: 'Grape',   growTime: 1.5, value: 20, color: '#9a6ee0', seed: '🍇' },
};

// Seven valleys. Each raises the harvest target, the field count, the wind
// and the storm pressure. Valley 7 is the Storm King: one giant storm cell
// that keeps coming back until the keeper grounds it with rods.
export const VALLEYS = [
  { name: 'First Furrow',  plots: [2, 3], target: 6,  seconds: 80, wind: 6,  storms: 0, hot: 0, crops: ['wheat', 'berry'] },
  { name: 'Twin Brooks',   plots: [2, 4], target: 9,  seconds: 85, wind: 9,  storms: 1, hot: 0, crops: ['wheat', 'berry', 'corn'] },
  { name: 'Copper Field',  plots: [3, 3], target: 12, seconds: 90, wind: 12, storms: 1, hot: 1, crops: ['wheat', 'corn', 'berry'] },
  { name: 'Amber Rows',    plots: [3, 4], target: 16, seconds: 95, wind: 15, storms: 2, hot: 1, crops: ['wheat', 'corn', 'pumpkin', 'berry'] },
  { name: 'High Pasture',  plots: [3, 4], target: 20, seconds: 100, wind: 18, storms: 2, hot: 2, crops: ['corn', 'pumpkin', 'grape', 'berry'] },
  { name: 'Stormbreak',    plots: [4, 4], target: 26, seconds: 105, wind: 22, storms: 3, hot: 2, crops: ['corn', 'pumpkin', 'grape', 'wheat'] },
  { name: 'The Storm King', plots: [4, 4], target: 30, seconds: 120, wind: 24, storms: 3, hot: 2, crops: ['pumpkin', 'grape', 'corn', 'wheat'], king: true },
];

// Bought in the shop between valleys. Gold comes only from harvest, so every
// purchase is a choice about which problem the next valley will hurt less.
export const UPGRADES = [
  { id: 'bigcloud', name: 'Broad Clouds', desc: 'Rain covers a wider patch of field.', cost: 40, max: 3 },
  { id: 'swiftrain', name: 'Swift Rain', desc: 'Clouds rain faster and refill faster.', cost: 45, max: 3 },
  { id: 'rod', name: 'Lightning Rod', desc: 'A rod grounds one lightning strike nearby.', cost: 50, max: 4 },
  { id: 'windcharm', name: 'Wind Charm', desc: 'The wind pushes your clouds half as hard.', cost: 35, max: 2 },
  { id: 'extracould', name: 'Extra Cloud', desc: 'One more cloud in the sky.', cost: 60, max: 2 },
  { id: 'fertile', name: 'Fertile Soil', desc: 'Crops grow a fifth faster.', cost: 40, max: 3 },
];

export const CLOUD_R = 46;
export const RAIN_RATE = 26; // water per second a raining cloud gives a plot
export const REFILL_RATE = 34; // water per second a cloud regains over the lake
export const STORM_STRIKE_EVERY = 7; // seconds between lightning strikes
export const SCORE_PER_HARVEST = 10;
