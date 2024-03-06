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
    'r': '#fe4234',
    'o': '#f6a349',
    'y': '#eaea15',
    'g': '#64b552',
    'b': '#299dff',
    'v': '#8da6fe',
    '': '#eee',
    't': '#aa923e',
    "T": '#dfc076'
};

export const COLOR_REFERENCE = {
    'r': 'Red',
    'o': 'Orange',
    'y': 'Yellow',
    'g': 'Green',
    'b': 'Blue',
    'v': 'Purple',
}

export const TACTICS = {
    't1': {name: "Darius", symbol: "Da", type: "playCard",
        description: "Wild card. Can respresent any color or number. Cannot play if have already played Alexander."
    },
    't2': {name: "Alexander", symbol: "A", type: "playCard", 
        description: "Wild card. Can respresent any color or number. Cannot play if have already played Darius."
    },
    't3': {name: "Campaign Cavalry", symbol: "CC", type: "playCard", 
        description: "Can represent 8 of any color."
    },
    't4': {name: "Shield Bearer", symbol: "SB", type: "playCard", 
        description: "Can represent 1, 2, or 3 of any color."
    },
    't5': {name: "Traitor", symbol: "T", type: "youTroop", 
        description: "Steal a Troop card played by the opponent on an unclaimed flag. Place it on your side in front of an unclaimed flag."
    },
    't6': {name: "Deserter", symbol: "De", type: "youAny", 
        description: "Discard any Troop or Tactic card played by the opponent on an unclaimed flag."
    },
    't7': {name: "Mud", symbol: "M", type: "changePin", 
        description: "Makes it so a flag is based on the best four-card arrangement, instead of three."
    },
    't8': {name: "Fog", symbol: "F", type: "changePin", 
        description: "Makes it so a flag is based on highest total; no other arrangment has value."
    },
    't9': {name: "Redeploy", symbol: "Re", type: "meAny", 
        description: "Move one of your played Tactic or Troop cards next to an unclaimed flag to another flag, or discard the card."
    },
    't10': {name: "Scout", symbol: "Sc", type: "newCards", 
        description: "Draw three cards from either card deck. Return two cards from your hand to the top of either deck."
    }
}

export const TACTICS_VARIANT = {
    't1': {name: "Red", symbol: "R", type: "playCard"},
    't2': {name: "Blue", symbol: "B", type: "playCard"},
    't3': {name: "Yellow", symbol: "Y", type: "playCard"},
    't4': {name: "Swap", symbol: "Sa", type: "youTroopMeTroop"},
    't5': {name: "Steal", symbol: "St", type: "youTroopHand"},
    't6': {name: "Troop 5", symbol: "T5", type: "changePin"},
    't7': {name: "Aim Low", symbol: "AL", type: "changePin"},
    't8': {name: "Flip", symbol: "F", type: "changePin"},
    't9': {name: "Switch", symbol: "Si", type: "meTwoAny"},
    't10': {name: "New Troops", symbol: "NT", type: "newCards"}
}
// eslint-disable-next-line
const TACTIC_TYPES = {
    playCard: new Set(['Darius', 'Alexander', 'Campaign Cavalry', 'Shield Bearer', 'Red', 'Blue', 'Yellow']),
    changePin: new Set(['Mud', 'Fog', 'Troop 5', 'Aim Low', 'Flip']),
    youTroop: new Set(['Traitor']),
    youAny: new Set(['Deserter']),
    meAny: new Set(['Redeploy']),
    newCards: new Set(['Scout', 'New Troops']),
    youTroopMeTroop: new Set(['Swap']),
    meTwoAny: new Set(['Switch']),
    youTroopHand: new Set(['Steal']),
}

export const SCOUT_MESSAGES = [
    "To use scout, draw three cards from either deck.",
    "Draw two more cards.",
    "Draw one more cards.",
    "Select two cards from your hand to return to the top of the deck.",
    "Return one more card from your hand."
];