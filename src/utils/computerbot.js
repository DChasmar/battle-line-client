import { COLORS_SET, TACTICS, TACTIC_TYPES } from '../constants';
import { findRemainingCards } from './gamedata'
import { updateNextAction, selectTroopCard, selectTacticCard, playCard, checkGameOver } from './gamelogic'
import { handleDiscard, handleMud, handleFog, handleTraitor } from './tacticlogic';

const randomComputerMove = (data) => {
    const handAsArray = Array.from(data["player2Hand"]);
    const card = handAsArray[Math.floor(Math.random() * handAsArray.length)];

    const remainingPins = [];

    for (let i = 1; i <= 9; i++) {
        const pin = "pin" + i;
        if (!data["claimed"][pin] && data[pin]["player2"]["cardsPlayed"].length < 3) {
            remainingPins.push(i);
        }
    }

    const pin = "pin" + remainingPins[Math.floor(Math.random() * remainingPins.length)];

    return { card, pin };
};

const idealPin = (data) => {
    const emptyPins = [];
    const unfinishedPins = [];

    for (let i = 1; i <= 9; i++) {
        const pin = "pin" + i;
        if (data[pin]["claimed"]) continue;
        const cardsPlayed = data[pin]["player2"]["cardsPlayed"];
        if (cardsPlayed.length === 0) {
            emptyPins.push(pin);
        } else if (cardsPlayed.length < 3) {
            unfinishedPins.push(pin);
        }
    }

    if (emptyPins.length > 0) {
        // Return a random pin from the emptyPins array
        // Could consider an alternative to choosing a random empty pin;
        // Choose based on the quality of the opponent's hand / likely hand;
        // Should there be a function for tracking the values of the opponent's hand?
        const randomIndex = Math.floor(Math.random() * emptyPins.length);
        return emptyPins[randomIndex];
    } else if (unfinishedPins.length > 0) {
        const randomIndex = Math.floor(Math.random() * unfinishedPins.length);
        return unfinishedPins[randomIndex]; // Corrected this line to use unfinishedPins
    } else {
        console.log("Computer found no pin to play on.")
        return null;
    }
};

const cardPotentialScores = (data) => {
    const remainingCards = findRemainingCards(data["used"]);
    const hand = data["player2Hand"];

    for (const card of hand) {
        if (card[0] !== 't') remainingCards.delete(card);
    }

    const scores = {};
    const numberTally = {};

    for (const card of hand) {
        if (card[0] === 't') continue;
        const color = card[0];
        const number = parseInt(card.slice(1));

        if (numberTally[number]) numberTally[number]++;
        else numberTally[number] = 1;

        const adjacents = [
            color + (number - 2),
            color + (number - 1),
            color + (number + 1),
            color + (number + 2)
        ];

        const inHand = [];
        const inRemaining = [];

        for (let i = 0; i < 4; i++) {
            inHand[i] = hand.has(adjacents[i]);
            inRemaining[i] = remainingCards.has(adjacents[i]);
        }

        let score = 0;

        for (let i = 0; i < 3; i++) {
            if (inHand[i] && inHand[i + 1]) {
                score += 36;
            } else if (inHand[i] && inRemaining[i + 1]) {
                score += 18;
            } else if (inRemaining[i] && inHand[i + 1]) {
                score += 18;
            } else if (inRemaining[i] && inRemaining[i + 1]) {
                score += 6;
            }
        }

        scores[card] = score;
    }

    for (const card of hand) {
        if (card[0] === 't') continue;
        const number = parseInt(card.slice(1));
        scores[card] += number * numberTally[number];
    }

    return scores;
};

const idealCard = (data) => {
    const scores = cardPotentialScores(data);

    let max_score = 0;
    let card;

    for (const potentialCard in scores) {
        if (scores[potentialCard] > max_score) {
            card = potentialCard;
            max_score = scores[potentialCard];
        }
    }

    const pin = idealPin(data);

    if (!pin) {
        console.error("No pin to play on.")
        return null;
    };

    if (max_score > 0) return { card, pin };
    // I do not think this next line will ever execute.
    else return randomComputerMove(data);
};

const tryForStraight = (data) => {
    const remainingCards = findRemainingCards(data.used);
    if (remainingCards.size > 20) return idealCard(data);

    const hand = data["player2Hand"];

    const cardsByNumber = {
        1: [],
        2: [],
        3: [],
        4: [],
        5: [],
        6: [],
        7: [],
        8: [],
        9: [],
        10: []
    }

    for (const card of hand) {
        if (card[0] === 't') continue;
        const number = parseInt(card.slice(1));
        cardsByNumber[number].push(card);
    }

    for (let i = 1; i <= 9; i++) {
        const pin = "pin" + i;

        const cardsPlayed = data[pin]["player2"]["cardsPlayed"];
        const length = cardsPlayed.length;

        const mud = data[pin].tacticsPlayed.includes("Mud");

        if (data.claimed.pin || (length === 3 && !mud) || (length === 4 && mud)) continue;

        if (length > 1) {
            const numbers = cardsPlayed.map(card => parseInt(card.slice(1))).sort((a, b) => a - b);

            const isConsecutive = numbers.every((number, index) => {
                if (index === 0) {
                    return true; // Skip the first number, as there's no previous number to compare to
                }
                return number === numbers[index - 1] + 1; // Check if the current number is one more than the previous number
            });

            if (isConsecutive) {
                const oneMore = numbers[numbers.length - 1];
                const oneLess = numbers[0] - 1;
                if (cardsByNumber[oneMore] && cardsByNumber[oneMore].length > 0) {
                    const card = cardsByNumber[oneMore][0];
                    return { card, pin };
                } else if (cardsByNumber[oneLess] && cardsByNumber[oneLess].length > 0) {
                    const card = cardsByNumber[oneLess][0];
                    return { card, pin };
                }
            };
        }
    }
    return idealCard(data);
};

const tryForFlush = (data) => {
    const remainingCards = findRemainingCards(data.used);
    if (remainingCards.size > 30) return idealCard(data);

    const hand = data["player2Hand"];

    const maxNumberOfEachColorInHand = {
        'r' : 0,
        'o' : 0,
        'y' : 0,
        'g' : 0,
        'b' : 0,
        'v' : 0
    }

    for (const card of hand) {
        if (card[0] === 't') continue;
        const color = card[0];
        const number = parseInt(card.slice(1));
        const currentMax = maxNumberOfEachColorInHand[color];
        maxNumberOfEachColorInHand[color] = Math.max(currentMax, number);
    }

    for (let i = 1; i <= 9; i++) {
        const pin = "pin" + i;

        if (data[pin].claimed) continue;

        const cardsPlayed = data[pin]["player2"]["cardsPlayed"];
        const length = cardsPlayed.length;

        const mud = data[pin].tacticsPlayed.includes("Mud");

        if (length === 2 || (length === 3 && mud)) {
            const color1 = cardsPlayed[0][0];
            const color2 = cardsPlayed[1][0];

            if (color1 !== color2) continue;

            const numbers = cardsPlayed.map(card => parseInt(card.slice(1))).sort((a, b) => a - b);

            if (numbers[0] + 2 === numbers[1]) {
                const missingCard = color1 + (numbers[0] + 1);
                if (!remainingCards.has(missingCard)) {
                    if (maxNumberOfEachColorInHand[color1] > 0) {
                        const card = color1 + maxNumberOfEachColorInHand[color1];
                        return { card, pin };
                    }
                }
            } else if (numbers[0] + 1 === numbers[1]) {
                const oneMore = color1 + (numbers[1] + 1);
                const oneLess = color1 + (numbers[0] - 1);
                if (!remainingCards.has(oneMore) && !remainingCards.has(oneLess)) {
                    if (maxNumberOfEachColorInHand[color1] > 0) {
                        const card = color1 + maxNumberOfEachColorInHand[color1];
                        return { card, pin };
                    }
                };
            }
        }
    }
    return tryForStraight(data);
};

// eslint-disable-next-line
const tryTactic = (data) => {
    const hand = Array.from(data["player2Hand"]);
    const tactics = hand.filter(card => card[0] === 't');

    if (tactics.length < 1 || data.tacticsPlayed.player2.size > data.tacticsPlayed.player1.size) return handlePlayer2PlayCard2(data);

    const wantedObject = cardsComputerWants(data);

    const wantedSet = new Set();
    for (const valueSet of Object.values(wantedObject)) {
        for (const item of valueSet) {
            wantedSet.add(item);
        }
    };

    for (const tactic of tactics) {
        const tacticName = TACTICS[tactic].name;
        if (TACTIC_TYPES.playCard.has(tacticName)) {
            const possibleColors = new Set(TACTICS[tactic].possibleColors);
            const possibleNumbers = new Set(TACTICS[tactic].possibleNumbers);

            for (const pin in wantedObject) {
                for (const card of wantedObject[pin]) {
                    if (possibleColors.has(card[0]) && possibleNumbers.has(parseInt(card.slice(1)))) return updateNextAction(playCard("player2", pin, tactic, data));
                }
            }

        } else if (tacticName === "Mud") {
            const mudObject = flagToMud(data);
            const pin = mudObject.pin;
            console.log(`This is the pin the computer put a tactic on ${pin}`);
            if (mudObject.pin) return updateNextAction(handleMud("player2", pin, tactic, data));
        } else if (tacticName === "Fog") {
            const fogObject = flagToFog(data);
            if (fogObject.pin) return updateNextAction(handleFog("player2", fogObject.pin, tactic, data));
        } else if (tacticName === "Scout") {

        } else if (tacticName === "Redeploy") {

        } else if (tacticName === "Traitor") {
            if (wantedSet.size > 0) {
                const cardToTraitorObject = cardToTraitor(wantedSet, data);
                if (cardToTraitorObject.card) {
                    const card = cardToTraitorObject.card;
                    const pin = cardToTraitorObject.pin;
                    const cardTraitorData = { card: card, pin: pin, player: "player1", tactic: tacticName };
                    for (const wantedPin in wantedObject) {
                        if (wantedObject[wantedPin].has(card)) return updateNextAction(handleTraitor("player2", tactic, cardTraitorData, wantedPin, data));
                    }
                }
            }
        } else if (tacticName === "Deserter") {
            const cardToDesertObject = cardToDesert(data);
            if (cardToDesertObject.card) {
                const card = cardToDesertObject.card;
                const pin = cardToDesertObject.pin;
                const cardDiscardedData = { card: card, pin: pin, tactic: tacticName, player: "player1" }
                return updateNextAction(handleDiscard("player2", tactic, cardDiscardedData, data));
            }
        }
    }
    return handlePlayer2PlayCard2(data);
};

const tryForTrips = (data) => {
    const hand = data["player2Hand"];

    const tripsPossibleOnePlayed = [];

    for (let i = 1; i <= 9; i++) {
        const pin = "pin" + i;

        const cardsPlayed = data[pin]["player2"]["cardsPlayed"];
        const length = cardsPlayed.length;

        const mud = data[pin].tacticsPlayed.includes("Mud");

        if (length === 0 || data["claimed"][pin] || (length === 3 && !mud) || (length === 4 && mud)) continue;
        else if (length === 1) tripsPossibleOnePlayed.push(pin);
        else if (length === 2 || (length === 3 && mud)) {
            const cardNumbers = cardsPlayed.map(card => parseInt(card.slice(1)));
            const tripsPossible = cardNumbers.every(number => number === cardNumbers[0]);
            if (tripsPossible) {
                for (const card of hand) {
                    if (card[0] === 't') continue;
                    const cardNumber = parseInt(card.slice(1));
                    if (cardNumber === cardNumbers[0]) return { card, pin };
                }
            };
        }
    }

    for (const pin of tripsPossibleOnePlayed) {
        const tripsNumber = parseInt(data[pin]["player2"]["cardsPlayed"][0].slice(1));
        for (const card of hand) {
            if (card[0] === 't') continue;
            const cardNumber = parseInt(card.slice(1));
            if (cardNumber === tripsNumber) return { card, pin };
        }
    }

    // See if it is worth trying to play a tactic card here...
    if (data.used.size > 15) return { card: null, pin: null };
    else return tryForFlush(data);
};

const tryForWedge = (data) => {
    const hand = data["player2Hand"];

    for (let i = 1; i <= 9; i++) {
        const pin = "pin" + i;

        const cardsPlayed = data[pin]["player2"]["cardsPlayed"];
        const length = cardsPlayed.length;

        const mud = data[pin].tacticsPlayed.includes("Mud");

        if (length === 0 || data["claimed"][pin] || (length === 3 && !mud)) continue;
        else if (length === 1) {
            const playedCard = cardsPlayed[0];
            const color = playedCard[0];
            const number = parseInt(playedCard.slice(1));

            const twoLess = color + (number - 2);
            const oneLess = color + (number - 1);
            const oneMore = color + (number + 1);
            const twoMore = color + (number + 2);

            if (hand.has(oneMore)) {
                const card = oneMore;
                return {card, pin};
            } else if (hand.has(oneLess)) {
                const card = oneLess;
                return {card, pin};
            } else if (hand.has(twoMore)) {
                const card = twoMore;
                return {card, pin};
            } else if (hand.has(twoLess)) {
                const card = twoLess;
                return {card, pin};
            }
        } else if (length === 2) {
            const color1 = cardsPlayed[0][0];
            const color2 = cardsPlayed[1][0];

            if (color1 !== color2) continue;

            const numbers = cardsPlayed.map(card => parseInt(card.slice(1))).sort((a, b) => a - b);

            if (numbers[0] + 2 === numbers[1]) {
                const card = color1 + (numbers[0] + 1);
                if (hand.has(card)) return {card, pin};
            } else if (numbers[0] + 1 === numbers[1]) {
                const oneMore = color1 + (numbers[1] + 1);
                const oneLess = color1 + (numbers[0] - 1);
                if (hand.has(oneMore)) {
                    const card = oneMore;
                    return {card, pin};
                } else if (hand.has(oneLess)) {
                    const card = oneLess;
                    return {card, pin};
                };
            } else if (length === 3 && mud) {
                // Add logic
            }
        }
    }

    return tryForTrips(data);
};

// eslint-disable-next-line
const evaluateHandsOfOpponent = (data) => {

};

// eslint-disable-next-line
const wantedCards1 = (card) => {
    const wanted = new Set();
    const color = card[0];
    const number = parseInt(card.slice(1));

    const oneMore = color + (number + 1);
    const oneLess = color + (number - 1);

    if (number + 1 <= 10) wanted.add(oneMore);
    if (number - 1 >= 1) wanted.add(oneLess);

    return wanted;
};

// eslint-disable-next-line
const wantedCards2 = (cards) => {
    const wanted = new Set();
    const colors = cards.map(card => card[0]);
    const numbers = cards.map(card => parseInt(card.slice(1))).sort((a, b) => a - b);

    const trips = numbers[0] === numbers[1];
    const flush = colors[0] === colors[1];
    const gutStraight = numbers[0] + 2 === numbers[1];
    const openStraight = numbers[0] + 1 === numbers[1];

    if (flush && openStraight) {
        const oneMore = colors[0] + (numbers[1] + 1);
        const oneLess = colors[0] + (numbers[0] - 1);
        if (numbers[1] + 1 <= 10) wanted.add(oneMore);
        if (numbers[0] - 1 >= 1) wanted.add(oneLess);
    } else if (flush && gutStraight) {
        const missing = colors[0] + (numbers[0] + 1);
        wanted.add(missing);
    } else if (trips) {
        for (const color of COLORS_SET) {
            const card = color + numbers[0];
            wanted.add(card);
        }
    }
    return wanted;
};

// eslint-disable-next-line
const cardsComputerWants = (data) => {
    const wantedObject = {};
    for (let i = 1; i <= 9; i++) {
        const pin = 'pin' + i;
        if (data[pin].claimed) continue;
        const pinCards = data[pin].player2.cardsPlayed;
        let new_wanted = new Set();
        if (pinCards.length < 1) continue;
        else if (pinCards.length === 1) {
            new_wanted = wantedCards1(pinCards[0]);
        } else if (pinCards.length === 2) {
            new_wanted = wantedCards2(pinCards);
        }
        if (new_wanted.size > 0) wantedObject[pin] = new_wanted;
    }
    return wantedObject;
};

// eslint-disable-next-line
const cardToTraitor = (wantedSet, data) => {
    for (let i = 1; i <= 9; i++) {
        const pin = 'pin' + i;
        if (data[pin].claimed) continue;
        const otherHand = data[pin].player1.cardsPlayed;
        if (otherHand.length < 1) continue;
        else {
            for (const card of otherHand) {
                if (wantedSet.has(card)) return { pin: pin, card: card };
            }
        }
    }
    return { pin: null, card: null };
};

// eslint-disable-next-line
const cardToDesert = (data) => {
    let cardToDesertObject = { card: null, pin: null };
    for (let i = 1; i <= 9; i++) {
        const pin = 'pin' + i;
        if (data[pin].claimed) continue;
        const opponentHand = data[pin].player1.cardsPlayed;
        if (opponentHand.length < 1) continue;

        for (const card of opponentHand) {
            if (card[0] === 't') return { card: card, pin: pin };
        };

        if (opponentHand.length === 3) {
            const colorValues = opponentHand.map(card => card[0]);
            const numberValues = opponentHand.map(card => parseInt(card.slice(1))).sort((a, b) => a - b);

            const trips = numberValues.every(value => value === numberValues[0]);
            const flush = colorValues.every(value => value === colorValues[0]);
            const straight = numberValues.every((value, i) => i === 0 || value === numberValues[i - 1] + 1);

            if (flush && straight) {
                const card = `${colorValues[0]}${numberValues[1]}`
                return { card: card, pin: pin };
            } else if (trips) {
                cardToDesertObject = { card: opponentHand[0], pin: pin };
            }
        }

    }
    return cardToDesertObject;
};

// eslint-disable-next-line
const flagToMud = (data) => {
    let idealFlag = { pin: null, score: 0 };
    for (let i = 1; i <= 9; i++) {
        const pin = 'pin' + i;
        if (data[pin].claimed) continue;
        return { pin: pin, score: 1 };
    }
    return idealFlag;
};

const sumHand = (arr) => {
    let sum = 0;
    for (const card of arr) {
        sum += parseInt(card.slice(1));
    }
    return sum;
};

// eslint-disable-next-line
const flagToFog = (data) => {
    let idealFlag = { pin: null, score: 0 };
    for (let i = 1; i <= 9; i++) {
        const pin = 'pin' + i;
        if (data[pin].claimed) continue;
        
        let score = 0;

        const computerHand = data[pin].player2.cardsPlayed;
        const computerSum = sumHand(computerHand);
        const computerAverage = computerHand.length === 0 ? 7 : Math.floor(computerSum / computerHand.length);

        const opponentHand = data[pin].player1.cardsPlayed;
        const opponentSum = sumHand(opponentHand);
        const opponentAverage = opponentHand.length === 0 ? 10 : Math.floor(opponentSum / opponentHand.length);
        
        score = (opponentHand.length >= computerHand.length && computerAverage > opponentAverage) ? (computerAverage - opponentAverage) * (opponentHand.length - computerHand.length + 1) : 0;

        if (score > idealFlag.score) idealFlag = { pin: pin, score: score };
        
    }
    return idealFlag;
};

export const handlePlayer2ClaimPins = (data) => {
    const newData = { ...data }
    const claimablePins = [];
    for (let i = 1; i <= 9; i++) {
        const pin = "pin" + i
        if (data[pin]["player2"]["claimable"] && !data[pin].claimed) claimablePins.push(pin);
    }
    for (const pin of claimablePins) {
        newData["claimed"][pin] = "player2";
        newData[pin]["claimed"] = true;

        const nextEventMessage = { description: `player2 claimed Pin ${pin[3]}.` };
        newData["events"].push(nextEventMessage);
    }

    const winner = checkGameOver(newData);

    if (winner) {
        newData["gameOver"] = winner;
        newData["nextAction"] = "gameOver";
        newData["events"].push(`The game is over. ${winner} wins!`);
    }

    return newData;
};

export const handlePlayer2PlayCard = (data) => {
    const newMoveData = tryForWedge(data);
    console.log(`player2 card: ${newMoveData.card}`);
    const cardToPlay = newMoveData.card;
    const pinToPlayOn = newMoveData.pin;
    if (!cardToPlay) return tryTactic(data);
    return updateNextAction(playCard("player2", pinToPlayOn, cardToPlay, data));
};

export const handlePlayer2PlayCard2 = (data) => {
    const newMoveData = tryForFlush(data);
    if (newMoveData === null) {
        console.log("The computer has nowhere to play.");
        const newData = { ...data };
        newData["nextAction"] = "player1Play";
        return newData;
    }
    console.log(`player2 card: ${newMoveData.card}`);
    const cardToPlay = newMoveData.card;
    const pinToPlayOn = newMoveData.pin;
    return updateNextAction(playCard("player2", pinToPlayOn, cardToPlay, data));
};

export const handlePlayer2DrawCard = (data) => {
    let tacticsInHand = 0
    for (const card of data.player2Hand) {
        if (card[0] === 't') tacticsInHand++;
    }
    const cardsUsed = data.used.size;
    const tacticPlayable = data.tacticsPlayed.player2.size <= data.tacticsPlayed.player1.size;
    if ((cardsUsed % 15 === 0 || cardsUsed % 24 === 0) && tacticsInHand < 2 && tacticPlayable) return updateNextAction(selectTacticCard('player2', false, data));
    else return updateNextAction(selectTroopCard('player2', false, data));
};

// I need to manage the computer's decision to select and play tactic cards.

// Select a Tactic card:
// Is my best remaining potential score is below a critical value?
// Do I have a wedge in trouble, that could benefit from Da, Al, CC or SB?

// Deserter: For each opponent card: Is it critical to the hand? 
// Traitor: For each opponent card: Is it critical to the hand? Could I use it?

// Scout: It is later in the game, and I have two worthless cards.
// Redeploy: It is later in the game, and...
    // I can free up a flag for a set I have in my hand.
    // Another flag needs my card.

// Darius & Alexander: Is the card that is needed no longer available?
// Campaign Cavalry: Is the card that is needed no longer available? Can a formation with 8 work?
// Shield Bearer: Is a low wedge plausible?

// Mud: Is the opponent about to win a hand, that I could win, if I were to play Mud?
// Fog: The opponent has a low sum wedge that I cannot beat.


// Types of Bots:
// The best we have
// Mr. Do Not Play Tactics
// Mr. Wedge or Flush or bust
// Mr. Trips or bust