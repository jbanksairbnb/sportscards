export type Condition =
  | "Gem Mint" | "Mint" | "NM-MT" | "NM" | "EX-MT" | "EX" | "VG-EX" | "VG" | "G" | "P";

export type CardRow = {
  id: string;
  setName: string;
  number: string;
  description: string;
  team: string;
  condition: Condition;
  graded: boolean;
  gradeValue?: number | "";
  purchaseDate?: string;
  purchasePrice?: number | "";
  valueEstimate?: number | "";
  imgFront?: string;
  imgBack?: string;
};

export const PSA_CONDITIONS: Condition[] = [
  "Gem Mint","Mint","NM-MT","NM","EX-MT","EX","VG-EX","VG","G","P",
];

export const MLB_TEAMS = [
  "Arizona Diamondbacks","Atlanta Braves","Baltimore Orioles","Boston Red Sox",
  "Chicago Cubs","Chicago White Sox","Cincinnati Reds","Cleveland Guardians",
  "Colorado Rockies","Detroit Tigers","Houston Astros","Kansas City Royals",
  "Los Angeles Angels","Los Angeles Dodgers","Miami Marlins","Milwaukee Brewers",
  "Minnesota Twins","New York Mets","New York Yankees","Oakland Athletics",
  "Philadelphia Phillies","Pittsburgh Pirates","San Diego Padres","San Francisco Giants",
  "Seattle Mariners","St. Louis Cardinals","Tampa Bay Rays","Texas Rangers","Toronto Blue Jays",
  "Washington Nationals",
];

export const STORAGE_KEYS = {
  setsIndex: "card-sets-index",            // string[] of set names
  setData: (setName: string) => `cards-${setName}`, // each set stored separately
};

export function uid() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}
