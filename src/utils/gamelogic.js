import { COLORS_SET, COLOR_REFERENCE, TACTICS } from '../constants'
import { calculateScore, calculateMaxScore } from './scores'
import { disguiseOpponentHand } from './gamedata'

const checkFirstToCompletePinHand = (player, pin, data) => {
    const numberOfCards = data[pin]["tacticsPlayed"].includes("Mud") ? 4 : 3;
    const otherPlayer = player === "player1" ? "player2" : "player1";
    if (data[pin][otherPlayer]["cardsPlayed"].length === numberOfCards) {
        return otherPlayer;
    } else return player;
};

export const playCard = (player, pin, card, data) => {
    const numberOfCards = data[pin]["tacticsPlayed"].includes("Mud") ? 4 : 3;
    
    const newData = { ...data };
    
    newData[pin][player]["cardsPlayed"].push(card);
    newData["used"].add(card);
    if (card[0] === 't') newData["tacticsPlayed"][player].add(TACTICS[card].name);
    newData[`${player}Hand`].delete(card);
    
    if (newData[pin][player]["cardsPlayed"].length === numberOfCards) {
        newData[pin]["firstToCompleteHand"] = checkFirstToCompletePinHand(player, pin, newData);
        newData[pin][player]["score"] = calculateScore(player, pin, newData);
    }

    const color = COLORS_SET.has(card[0]) ? COLOR_REFERENCE[card[0]] : card[0] === 't' ? TACTICS[card].name : "Error finding card value";
    const cardName = COLORS_SET.has(card[0]) ? `${parseInt(card.slice(1))} ${color}` : color;

    const nextEventMessage = { description: `${player} played ${cardName} on Flag ${pin[3]}.` }

    newData["events"].push(nextEventMessage);

    return newData
};

const takeCardOnTopOfDeck = (player, deck, data) => {
    const deckToDrawFrom = `${deck}DeckTop`;
    const drawnCard = data[deckToDrawFrom].slice(-1)[0];
    console.log(drawnCard);

    const nextEventMessage = { description: `${player} selected a T${deck.slice(1)} Card.` };

    const newData = {
        ...data,
        [`${player}Hand`]: new Set([...data[`${player}Hand`], drawnCard]),
        [deckToDrawFrom]: data[deckToDrawFrom].slice(0, -1),
        "events": [...data["events"], nextEventMessage]
    };
    return newData;
};

export const selectTroopCard = (player, scout, data) => {
    if ((data[`${player}Hand`].size > 6 || data["troopCards"].size < 1) && !scout) return data;
    if (data["troopDeckTop"].length > 0) return takeCardOnTopOfDeck(player, "troop", data);

    const troopCardsList = Array.from(data["troopCards"]);
    const drawnCard = troopCardsList[Math.floor(Math.random() * troopCardsList.length)];

    const nextEventMessage = !scout ? { description: `${player} selected a Troop Card.` } :
    { description: `${player} used Scout to select a Troop Card.` };

    const newData = {
        ...data,
        [`${player}Hand`]: new Set([...data[`${player}Hand`], drawnCard]),
        "troopCards": new Set([...data["troopCards"]].filter(card => card !== drawnCard)),
        "events": [...data["events"], nextEventMessage]
    };
    return newData;
};

export const selectTacticCard = (player, scout, data) => {
    if ((data[`${player}Hand`].size > 6 || data["tacticCards"].size < 1) && !scout) return data;
    if (data["tacticDeckTop"].length > 0) return takeCardOnTopOfDeck(player, "tactic", data);

    const tacticCardsList = Array.from(data["tacticCards"]);
    const drawnCard = tacticCardsList[Math.floor(Math.random() * tacticCardsList.length)];

    const nextEventMessage = !scout ? { description: `${player} selected a Tactic Card.` } :
    { description: `${player} used Scout to select a Tactic Card.` };

    const newData = {
        ...data,
        [`${player}Hand`]: new Set([...data[`${player}Hand`], drawnCard]),
        "tacticCards": new Set([...data["tacticCards"]].filter(card => card !== drawnCard)),
        "events": [...data["events"], nextEventMessage]
    };
    return newData;
};

const findClaimableAndPlayable = (player, data) => {
    const newPinsPlayable = new Set();

    for (let i = 1; i <= 9; i++) {
        const pin = "pin" + i;
        const numberOfCards = data[pin]["tacticsPlayed"].includes("Mud") ? 4 : 3;
        if (data[pin]["claimed"]) continue;
        const p1HandComplete = data[pin]["player1"]["cardsPlayed"].length === numberOfCards;
        const p2HandComplete = data[pin]["player2"]["cardsPlayed"].length === numberOfCards;

        if (!p1HandComplete && player === "player1") newPinsPlayable.add(pin);
        else if (!p2HandComplete && player === "player2") newPinsPlayable.add(pin);
        // Manage if Tactics are playable too;

        if (p1HandComplete && p2HandComplete) {
            const scorePlayer1 = calculateScore("player1", pin, data);
            const scorePlayer2 = calculateScore("player2", pin, data);

            data[pin]["player1"]["claimable"] = player === "player1" && scorePlayer1 > scorePlayer2;
            data[pin]["player2"]["claimable"] = player === "player2" && scorePlayer1 < scorePlayer2;
            if (scorePlayer1 === scorePlayer2) {
                console.log("The hands are the same.")
                data[pin]["player1"]["claimable"] = player === "player1" && data[pin]["firstToCompleteHand"] === "player1";
                data[pin]["player2"]["claimable"] = player === "player2" && data[pin]["firstToCompleteHand"] === "player2";
            }
        } else if (p1HandComplete) {
            const player1Score = calculateScore("player1", pin, data);
            data[pin]["player1"]["claimable"] = player === "player1" && player1Score >= calculateMaxScore("player2", pin, player1Score, data);
        } else if (p2HandComplete) {
            const player2Score = calculateScore("player2", pin, data);
            data[pin]["player2"]["claimable"] = player === "player2" && player2Score >= calculateMaxScore("player1", pin, player2Score, data);
        }
    }

    // Add a condition for when newPinsPlayable is empty and when cannot play a Tactic card.
    return data;
};

export const updateNextAction = (data) => {
    if (data.nextAction === "gameOver") return;
    const actionCycle = ["player1Play", "player1Draw", "player2Play", "player2Draw"];
    const currentIndex = actionCycle.indexOf(data["nextAction"]);
    
    if (currentIndex === -1) {
        console.error("Invalid nextAction value in data");
        return data;
    }

    const latestAction = actionCycle[currentIndex];

    const newIndex = (currentIndex + 1) % actionCycle.length;
    const newNextAction = actionCycle[newIndex];
    
    const newData = { ...data };
    if (latestAction === "player2Draw") newData["player2HandConcealed"] = disguiseOpponentHand(data.player2Hand);

    newData["nextAction"] = newNextAction;
    if (newNextAction === "player1Draw" || newNextAction === "player2Draw") return newData;

    const player = newNextAction.slice(0, 7);
    return findClaimableAndPlayable(player, newData);
};

// This function is for the instances when the normal cycle of playing and drawing a card is broken,
// such as when a player cannot play, or after a player plays Scout.
export const updateNextAction2 = (newNextAction, data) => {
    if (data.nextAction === "gameOver") return;
    
    const newData = { ...data };

    newData["nextAction"] = newNextAction;

    const player = newNextAction.slice(0, 7);
    return findClaimableAndPlayable(player, newData);  
};

const hasConsecutivePins = (pins) => {
    // Check if there are three consecutive pins
    for (let i = 0; i < pins.length - 2; i++) {
        if (pins[i] === pins[i + 1] - 1 && pins[i] === pins[i + 2] - 2) {
            return true;
        }
    }

    return false;
};

export const checkGameOver = (data) => {
    const player1Pins = [];
    const player2Pins = [];

    for (let i = 1; i <= 9; i++) {
        const pin = "pin" + i;

        if (data["claimed"][pin]) {
            if (data["claimed"][pin] === "player1") player1Pins.push(i);
            else if (data["claimed"][pin] === "player2") player2Pins.push(i);
        }
    }

    if (player1Pins.length >= 5 || hasConsecutivePins(player1Pins)) return "player1";
    else if (player2Pins.length >= 5 || hasConsecutivePins(player2Pins)) return "player2";
    else return false;
};

