import { COLORS_SET, COLOR_REFERENCE, TACTICS } from '../constants'
import { calculateScore, calculateMaxScore } from './scores'

const checkFirstToCompletePinHand = (player, pin, data) => {
    const numberOfCards = data[pin]["tacticPlayed"] === "Mud" ? 4 : 3;
    const otherPlayer = player === "player1" ? "player2" : "player1";
    if (data[pin][otherPlayer]["cardsPlayed"].length === numberOfCards) {
        return otherPlayer;
    } else return player;
};

export const playCard = (player, pin, card, data) => {
    const numberOfCards = data[pin]["tacticPlayed"] === "Mud" ? 4 : 3;
    // I am pretty sure this check is not doing anything. I block this condition earlier.
    if (data[pin][player]["cardsPlayed"].length === numberOfCards || data[pin]["claimed"]) {
        console.error("Error in playCard");
    };
    const newData = { ...data };
    
    newData[pin][player]["cardsPlayed"].push(card);
    newData["used"].add(card);
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

    const nextEventMessage = { description: `${player} selected a Troop Card.` };

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

    const nextEventMessage = { description: `${player} selected a Tactic Card.` };

    const newData = {
        ...data,
        [`${player}Hand`]: new Set([...data[`${player}Hand`], drawnCard]),
        "tacticCards": new Set([...data["tacticCards"]].filter(card => card !== drawnCard)),
        "events": [...data["events"], nextEventMessage]
    };
    return newData;
};

const findClaimableAndPlayable = (player, data) => {
    // Can I reduce this object to a single set?
    const newPinsPlayable = new Set();

    for (let i = 1; i <= 9; i++) {
        const pin = "pin" + i;
        const numberOfCards = data[pin]["tacticPlayed"] === "Mud" ? 4 : 3;
        if (data[pin]["claimed"]) continue;
        const p1HandComplete = data[pin]["player1"]["cardsPlayed"].length === numberOfCards;
        const p2HandComplete = data[pin]["player2"]["cardsPlayed"].length === numberOfCards;

        if (!p1HandComplete && player === "player1") newPinsPlayable.add(pin);
        else if (!p2HandComplete && player === "player2") newPinsPlayable.add(pin);
        // Manage if Tactics are playable too;

        if (p1HandComplete && p2HandComplete) {
            const scorePlayer1 = calculateScore("player1", pin, data);
            const scorePlayer2 = calculateScore("player2", pin, data);

            data[pin]["player1"]["claimable"] = scorePlayer1 > scorePlayer2;
            data[pin]["player2"]["claimable"] = scorePlayer1 < scorePlayer2;
            if (!data[pin]["player1"]["claimable"] && !data[pin]["player2"]["claimable"]) {
                console.log("The hands are the same.")
                data[pin]["player1"]["claimable"] = data[pin]["firstToCompleteHand"] === "player1"
                data[pin]["player2"]["claimable"] = data[pin]["firstToCompleteHand"] === "player2"
            }
        } else if (p1HandComplete) {
            const player1Score = calculateScore("player1", pin, data);
            data[pin]["player1"]["claimable"] = player1Score >= calculateMaxScore("player2", pin, player1Score, data);
        } else if (p2HandComplete) {
            const player2Score = calculateScore("player2", pin, data);
            data[pin]["player2"]["claimable"] = player2Score >= calculateMaxScore("player1", pin, player2Score, data);
        }
    }
    return data
};

export const updateNextAction = (data) => {
    if (data.nextAction === "gameOver") return;
    const actionCycle = ["player1Play", "player1Draw", "player2Play", "player2Draw"];
    const currentIndex = actionCycle.indexOf(data["nextAction"]);
    
    if (currentIndex === -1) {
        console.error("Invalid nextAction value in data");
        return data;
    }

    const newIndex = (currentIndex + 1) % actionCycle.length;
    const newNextAction = actionCycle[newIndex];
    
    const newData = { ...data };
    newData["nextAction"] = newNextAction;
    if (newNextAction === "player1Draw" || newNextAction === "player2Draw") return newData;
    const player = newNextAction.slice(0, 7);
    return findClaimableAndPlayable(player, newData);
    // Manage the scenario where there are no places to play.
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

