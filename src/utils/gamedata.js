// eslint-disable-next-line
import { COLORS_ARRAY, CARDS_PER_COLOR, PINS } from '../constants'

const buildTacticDeck = () => {
    const tacticCards = new Set();

    for (let number = 1; number <= 10; number++) {
        const card = "t" + number;
        tacticCards.add(card);
    };
    return tacticCards;
};

const buildTroopDeck = () => {
    const troopCards = new Set();

    for (const color of COLORS_ARRAY) {
        for (let number = 1; number <= CARDS_PER_COLOR; number++) {
            const card = color + number;
            troopCards.add(card);
        }
    }
    return troopCards;
};

export const disguiseOpponentHand = (hand) => {
    // The hand is a set
    let tacticNumber = 0;
    const concealedHand = [];

    for (const card of hand) {
        if (card[0] === 't') tacticNumber++;
        else concealedHand.push("T0");
    }

    for (let i = 0; i < tacticNumber; i++) {
        concealedHand.push("t0");
    }

    return concealedHand;
};

// Is there an issue with adding Tactic cards to "used"? Should they have another destination?
// Do they even need to be added to used?

export const initializeGameData = () => {
    let data = {};
    let troopCards = buildTroopDeck()

    for (let i = 1; i <= PINS; i++) {
        const pin = "pin" + i;
        const player1 = {}, player2 = {};

    for (const player of [player1, player2]) {
            player["cardsPlayed"] = [];
            player["score"] = null;
            player["claimable"] = false;
        }
        
        data[pin] = {"player1": player1, "player2": player2, "claimed": false, "firstToCompleteHand": false, "tacticsPlayed": []};
    }

    const dealCardData = dealCards(troopCards);

    data["player1Hand"] = dealCardData.player1Hand;
    data["player2Hand"] = dealCardData.player2Hand;
    data["player2HandConcealed"] = disguiseOpponentHand(dealCardData.player2Hand);
    data["used"] = new Set();
    data["troopCards"] = dealCardData.newTroopCards;
    data["tacticCards"] = buildTacticDeck();
    data["claimed"] = {
        "pin1": false,
        "pin2": false,
        "pin3": false,
        "pin4": false,
        "pin5": false,
        "pin6": false,
        "pin7": false,
        "pin8": false,
        "pin9": false
    }
    data["nextAction"] = "player1Play"

    const pinSet = new Set();

    for (let i = 1; i <= 9; i++) {
        pinSet.add("pin" + i);
    }

    data["player1PinsPlayable"] = pinSet;
    data["player2PinsPlayable"] = pinSet;

    data["tacticsPlayed"] = { "player1": new Set(), "player2": new Set()};
    data["gameOver"] = false;
    data["events"] = [];
    data["discardedCards"] = [];
    data["troopDeckTop"] = [];
    data["tacticDeckTop"] = [];

    return data;
};

export const findRemainingCards = (usedCards) => {
    const remainingCards = buildTroopDeck();
    for (const card of usedCards) {
        remainingCards.delete(card);
    }
    return remainingCards;
};

const getRandomSample = (array, size) => {
    // Utility function to get a random sample from an array
    const sample = [];
    for (let i = 0; i < size; i++) {
        const randomIndex = Math.floor(Math.random() * array.length);
        sample.push(array.splice(randomIndex, 1)[0]);
    }
    return sample;
};

const dealCards = (troopCards) => {
    // Check if there are enough cards in troopCards to deal
    if (troopCards.size < 14) {
        console.log("Not enough cards to deal.");
        return;
    }

    // Take a random sample of 14 cards
    const troopCardsArray = Array.from(troopCards);
    const randomSample = new Set(getRandomSample(troopCardsArray, 14));

    // Deal 7 cards to player1
    const player1Hand = new Set([...randomSample].slice(0, 7));

    // Deal 7 cards to player2
    const player2Hand = new Set([...randomSample].slice(7, 14));

    // Update troopCards by removing the dealt cards
    const newTroopCards = new Set([...troopCards].filter(card => !randomSample.has(card)));

    return { player1Hand, player2Hand, newTroopCards };
};

export const sortHand = (arr) => {
    return arr.sort((a, b) => {
        const colorA = a.charAt(0);
        const colorB = b.charAt(0);
        
        const numberA = parseInt(a.substring(1));
        const numberB = parseInt(b.substring(1));

        const colorIndexA = COLORS_ARRAY.indexOf(colorA);
        const colorIndexB = COLORS_ARRAY.indexOf(colorB);

        // First, sort based on the color index
        if (colorIndexA !== colorIndexB) {
            return colorIndexA - colorIndexB
        };

        // If colors are the same, sort based on the number
        return numberA - numberB;
    });
};

export const resetGame = (winner, setGameData) => {
    console.log("Resetting game for winner:", winner);
    const newGameData = initializeGameData();
    setGameData(newGameData);
};