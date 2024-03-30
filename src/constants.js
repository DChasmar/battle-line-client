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

export const instructionsModalContent = (
    <div>
        <p>
            Battle Line is a card game created by Reiner Knizia. This is a web version of Battle Line. If you enjoy the game, I thoroughly recommend purchasing a copy of the original. It is a simple and rich, two-player card game.
        </p>
        <p>
            The object of the game is to create a better three-card hand than your opponent for each Flag. If you win 5 of the 9 Flags, or 3 Flags in a row, you win the game.
        </p>
        <p>
            Hands are ranked in the following order:
        </p>
        <ul>
            <li><strong>Wedge (Straight-Flush):</strong> Three-in-a-row of the same color. The best hand is 10-9-8 all of one color. This beats 9-8-7 of one color, which beats 8-7-6 of one color, etc. Any Wedge is beats a…</li>
            <li><strong>Phalanx (Three-of-a-Kind):</strong> Three 10s is better than three 9s, etc. Any Phalanx beats a…</li>
            <li><strong>Battalion Order (Flush):</strong> Three of one color (but not three-in-a-row). Sum the three numbers. Between two Flush hands, the one with the larger sum wins. Any flush beats a…</li>
            <li><strong>Skirmish Line (Straight):</strong> Three-in-a-row (but not of the same color). 10-9-8 beats 9-8-7, which beats 8-7-6, etc. Any straight beats…</li>
            <li><strong>Host (Sum):</strong> If there is no Flush, Straight or Three-of-a-Kind, sum the number values on the cards. A larger sum beats a smaller sum.</li>
        </ul>
        <p>
            If opposing hands have the same value, the hand which was completed first wins.
        </p>
        <p>
            There are two decks in the game.
        </p>
        <ul>
            <li><strong>The Troop Deck</strong> contains 60 Troop cards: 1 to 10 for each of six colors: Red, Orange, Yellow, Green, Blue, and Purple.</li>
            <li><strong>The Tactic Deck</strong> contains 10 unique Tactic cards.</li>
        </ul>
        <p>
            Each Tactic card has a special ability:
        </p>
        <ul>
            <li><strong>Darius and Alexander</strong> can represent any Troop Card. If you have already played Darius or Alexander, you cannot play the other.</li>
            <li><strong>Campaign Cavalry</strong> can be 8 of any color.</li>
            <li><strong>Shield Bearer</strong> can be 3, 2, or 1 of any color.</li>
            <li><strong>Fog</strong> makes a Flag based solely on largest sum.</li>
            <li><strong>Mud</strong> makes a Flag based on the best 4-card hand.</li>
            <li><strong>Traitor</strong> allows a player to take a Troop card the opponent has played, and place it on their own side next to an unclaimed flag.</li>
            <li><strong>Deserter</strong> allows a player to remove a Troop or Tactic card the opponent has played on an unclaimed Flag.</li>
            <li><strong>Redeploy</strong> allows a player to reposition a card played on an unclaimed flag to another unclaimed flag, or discard the card.</li>
            <li><strong>Scout</strong> allows a player to choose three cards from either Deck, and return any two cards to the top of the deck.</li>
        </ul>
        <p>
            A player can never play two more Tactic cards than their opponent. If you have played one more Tactic card than your opponent, you must wait for your opponent to play a Tactic card before you can play another.
        </p>
        <p>
            Each player begins with 7 Troop Cards. A Player may never have more than 7 cards in their hand at one time. On a player’s turn, they can:
        </p>
        <ol>
            <li>Claim one or more Flags.</li>
            <li>Play one Troop or Tactic Card.</li>
            <li>Draw one Troop Card or one Tactic Card.</li>
        </ol>
        <p>
            In this web version, a player cannot claim a Flag at the end of their turn. In the original card game, you can play either way: Claim flags at the beginning of your turn, or at the end, but not both.
        </p>
    </div>
);