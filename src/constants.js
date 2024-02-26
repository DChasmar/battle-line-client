// Constants
export const COLORS = ['r', 'o', 'y', 'g', 'b', 'v'];
export const COLORS_SET = new Set(['r', 'o', 'y', 'g', 'b', 'v']);
export const CARDS_PER_COLOR = 10;
export const PINS = 9;
export const WEDGE_VALUE = 100000;
export const TRIPS_VALUE = 10000;
export const FLUSH_VALUE = 1000;
export const STRAIGHT_VALUE = 100;
export const CARD_COLORS = {
    'r': '#ee3224',
    'o': '#e69339',
    'y': '#f1ea15',
    'g': '#54a542',
    'b': '#198dfe',
    'v': '#7d96fb',
    '': '#eee',
    't': '#ddd',
    "T": '#999'
};

export const TACTICS = {
    't1': {name: "Red"},
    't2': {name: "Blue"},
    't3': {name: "Yellow"},
    't4': {name: "Swap"},
    't5': {name: "Steal"},
    't6': {name: "MultiplesOf5"},
    't7': {name: "1isHigh"},
    't8': {name: "6is9"},
    't9': {name: "Switch"},
    't10': {name: "NewTroops"}
}

export const TACTICS_PLAY_COLOR = {
    "Red": {},
    "Blue": {},
    "Yellow": {}
}

export const TACTICS_MAKE_PLAY = {
    "Swap": {},
    "Steal": {}
}

export const TACTICS_CHANGE_PIN = {
    "MultiplesOf5": {},
    "1isHigh": {},
    "6is9": {}
}

export const TACTICS_CHANGE_CARDS = {
    "Switch": {},
    "NewTroops": {}
}