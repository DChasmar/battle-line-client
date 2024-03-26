// Constants
export const COLORS_ARRAY = ['r', 'o', 'y', 'g', 'b', 'v'];
export const COLORS_SET = new Set(['r', 'o', 'y', 'g', 'b', 'v']);
export const CARDS_PER_COLOR = 10;
export const NUMBERS_ARRAY = [10, 9, 8, 7, 6, 5, 4, 3, 2, 1];
export const NUMBERS_SET = new Set([10, 9, 8, 7, 6, 5, 4, 3, 2, 1]);
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
    'T': '#dfc076',
    'mud': '#72400b',
    'fog': '#a7beb9',
    'claim': '#4caf50'
};

export const COLOR_REFERENCE = {
    'r': 'Red',
    'o': 'Orange',
    'y': 'Yellow',
    'g': 'Green',
    'b': 'Blue',
    'v': 'Purple',
}

export const WORD_COLORS = {
    'Red': CARD_COLORS.r,
    'Orange': CARD_COLORS.o,
    'Yellow': CARD_COLORS.y,
    'Green': CARD_COLORS.g,
    'Blue': CARD_COLORS.b,
    'Purple': CARD_COLORS.v,
    'Troop': CARD_COLORS.T,
    'Tactic': CARD_COLORS.t,
    'Mud': CARD_COLORS.mud,
    'Fog': CARD_COLORS.fog,
    'Campaign': CARD_COLORS.t,
    'Cavalry': CARD_COLORS.t,
    'Shield': CARD_COLORS.t,
    'Bearer': CARD_COLORS.t,
    'Alexander': CARD_COLORS.t,
    'Darius': CARD_COLORS.t,
    'Redeploy': CARD_COLORS.t,
    'Scout': CARD_COLORS.t,
    'Traitor': CARD_COLORS.t,
    'Deserter': CARD_COLORS.t,
}

export const TACTICS = {
    't1': {name: "Darius", symbol: "Da", possibleColors: COLORS_ARRAY, possibleNumbers: NUMBERS_ARRAY, type: "playCard",
        description: "Wild card. Can respresent any color or number. Cannot play if have already played Alexander."
    },
    't2': {name: "Alexander", symbol: "Al", possibleColors: COLORS_ARRAY, possibleNumbers: NUMBERS_ARRAY, type: "playCard", 
        description: "Wild card. Can respresent any color or number. Cannot play if have already played Darius."
    },
    't3': {name: "Campaign Cavalry", symbol: "CC", possibleColors: COLORS_ARRAY, possibleNumbers: [8], type: "playCard", 
        description: "Can represent 8 of any color."
    },
    't4': {name: "Shield Bearer", symbol: "SB", possibleColors: COLORS_ARRAY, possibleNumbers: [3, 2, 1], type: "playCard", 
        description: "Can represent 1, 2, or 3 of any color."
    },
    't5': {name: "Traitor", symbol: "Tr", type: "youTroop", 
        description: "Steal a Troop card played by the opponent on an unclaimed flag. Place it on your side in front of an unclaimed flag."
    },
    't6': {name: "Deserter", symbol: "De", type: "youAny", 
        description: "Discard any Troop or Tactic card played by the opponent on an unclaimed flag."
    },
    't7': {name: "Mud", symbol: "Mu", type: "changePin", 
        description: "Makes it so a flag is based on the best four-card arrangement, instead of three."
    },
    't8': {name: "Fog", symbol: "Fo", type: "changePin", 
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
    't1': {name: "Red", symbol: "Re", type: "playCard"},
    't2': {name: "Blue", symbol: "Bl", type: "playCard"},
    't3': {name: "Yellow", symbol: "Ye", type: "playCard"},
    't4': {name: "Swap", symbol: "Sa", type: "youTroopMeTroop"},
    't5': {name: "GoFish", symbol: "Go", type: "youTroopHand"},
    't6': {name: "Troop 5", symbol: "T5", type: "changePin"},
    't7': {name: "Aim Low", symbol: "AL", type: "changePin"},
    't8': {name: "Flip", symbol: "Fl", type: "changePin"},
    't9': {name: "Switch", symbol: "Si", type: "meTwoAny"},
    't10': {name: "New Troops", symbol: "NT", type: "newCards"}
}

export const TACTIC_TYPES = {
    playCard: new Set(['Darius', 'Alexander', 'Campaign Cavalry', 'Shield Bearer', 'Red', 'Blue']),
    playAnytime: new Set(['Deserter', 'Scout', 'Mud', 'Fog', 'Redeploy'])
}

// export const TURN_MESSAGES = {
//     'player1Play': "Play a card.",
//     'player1Draw': "Draw a card.",
//     'player2Play': "It is the opponent's turn to play a card.",
//     'player2Draw': "It is the opponent's turn to draw a card."
// }

// {scout ? (<div>{SCOUT_MESSAGES[cardToTactic !== null ? cardToTactic.stage : 0]}</div>) : (<div>{TURN_MESSAGES[gameData.nextAction]}</div>)}

// export const TACTIC_TYPES = {
//     playCard: new Set(['Darius', 'Alexander', 'Campaign Cavalry', 'Shield Bearer', 'Red', 'Blue', 'Yellow']),
//     changePin: new Set(['Mud', 'Fog', 'Troop 5', 'Aim Low', 'Flip']),
//     youTroop: new Set(['Traitor']),
//     youAny: new Set(['Deserter']),
//     meAny: new Set(['Redeploy']),
//     newCards: new Set(['Scout', 'New Troops']),
//     youTroopMeTroop: new Set(['Swap']),
//     meTwoAny: new Set(['Switch']),
//     youTroopHand: new Set(['GoFish']),
//     playAnytime: new Set([])
// }

export const SCOUT_MESSAGES = [
    "To use scout, draw three cards from either deck.",
    "Draw two more cards.",
    "Draw one more cards.",
    "Select two cards from your hand to return to the top of the deck.",
    "Return one more card from your hand."
];