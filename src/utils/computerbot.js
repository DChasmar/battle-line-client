import { COLORS_SET, TACTICS, TACTIC_TYPES } from '../constants';
import { findRemainingCards } from './gamedata'
import { updateNextAction, updateNextAction2, selectTroopCard, selectTacticCard, playCard, checkGameOver } from './gamelogic'
import { handleDiscard, handleMud, handleFog, handleTraitor, handleRedeploy, handleRemoveScoutFromHand, handleReturnCardToTopOfDeck } from './tacticlogic';
import { findMissingNumbersForStraight, getRemainingNumbersObject } from './scores'

const randomComputerMove = (data) => {
    const handAsArray = Array.from(data.player2Hand);
    const card = handAsArray[Math.floor(Math.random() * handAsArray.length)];

    const remainingPins = [];

    for (let i = 1; i <= 9; i++) {
        const pin = "pin" + i;
        const numberOfCards = data[pin].tacticsPlayed.includes("Mud") ? 4 : 3;
        if (!data.claimed[pin] && data[pin].player2.cardsPlayed.length < numberOfCards) {
            remainingPins.push(pin);
        }
    }

    const pin = remainingPins[Math.floor(Math.random() * remainingPins.length)];

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

const cardPotentialScores = (data, remainingCards) => {
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

const idealCard = (data, remainingCards) => {
    const scores = cardPotentialScores(data, remainingCards);

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
        return null;
    };

    if (max_score > 0) return { card, pin };
    // This next line only executes when there are no Wedge or Trips or Flush or Straight formations possible,
    // and there are no empty flags left.
    else return randomComputerMove(data);
};

const tryForStraight = (data, remainingCards) => {
    if (remainingCards.size > 20) return idealCard(data, remainingCards);

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

        if (data[pin].claimed || (length === 3 && !mud) || (length === 4 && mud)) continue;

        if (length > 1) {
            const numbers = cardsPlayed.map(card => parseInt(card.slice(1))).sort((a, b) => a - b);

            const isConsecutive = numbers.every((number, index) => {
                if (index === 0) {
                    return true; // Skip the first number, as there's no previous number to compare to
                }
                return number === numbers[index - 1] + 1; // Check if the current number is one more than the previous number
            });

            if (isConsecutive) {
                const oneMore = numbers[numbers.length - 1] + 1;
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
    return idealCard(data, remainingCards);
};

const tryForFlush = (data, remainingCards) => {
    if (remainingCards.size > 30) return idealCard(data, remainingCards);

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

        const numberOfCards = data[pin].tacticsPlayed.includes("Mud") ? 4 : 3;

        if (length === 2 || length + 1 === numberOfCards) {
            // This is not handling the mud scenario well
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
    return tryForStraight(data, remainingCards);
};

const tryTactic = (data, remainingCards) => {
    const hand = Array.from(data.player2Hand);
    const tactics = hand.filter(card => card[0] === 't');

    const player1TacticsPlayed = data.tacticsPlayed.player1;
    const player2TacticsPlayed = data.tacticsPlayed.player2;

    const playedDariusOrAlexander = player2TacticsPlayed.has("Darius") || player2TacticsPlayed.has("Alexander");
    
    if (tactics.length < 1 || player2TacticsPlayed.size > player1TacticsPlayed.size) return handlePlayer2PlayCard2(data, remainingCards);

    const wantedObject = cardsPlayerWants("player2", data, remainingCards);

    const wantedSet = new Set();
    for (const valueSet of Object.values(wantedObject)) {
        for (const item of valueSet) {
            wantedSet.add(item);
        }
    };

    for (const tactic of tactics) {
        const tacticName = TACTICS[tactic].name;
        if ((tacticName === "Darius" || tacticName === "Alexander") && playedDariusOrAlexander) continue;
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
            if (data.used.size > 30 && data.troopCards.size >= 3) {
                const cardOpponentWantsObject = cardsPlayerWants("player1", data, remainingCards);
                const cardOpponentWantsSet = new Set();
                for (const valueSet of Object.values(cardOpponentWantsObject)) {
                    for (const item of valueSet) {
                        cardOpponentWantsSet.add(item);
                    };
                };
                const troops = hand.filter(card => card[0] !== 't');
                const cardsToReturnToDeck = []
                for (const card of troops) {
                    if (!cardOpponentWantsSet.has(card) && parseInt(card.slice(1)) < 7) {
                        cardsToReturnToDeck.push(card);
                    }
                }
                if (cardsToReturnToDeck.length >= 2) {
                    // Do not use updateNextAction because handleComputerScouting updates nextAction
                    return updateNextAction2("player1Play", handleComputerScouting(cardsToReturnToDeck.slice(-2), tactic, data));
                }
            }
        } else if (tacticName === "Redeploy") {
            if (data.used.size > 30) {
                const redeployObject = cardToRedeploy(wantedSet, wantedObject, data);
                if (redeployObject.card && redeployObject.takeFromPin && redeployObject.destinationPin) {
                    const cardRedeployData = { card: redeployObject.card, pin: redeployObject.takeFromPin };
                    return updateNextAction(handleRedeploy("player2", tactic, cardRedeployData, redeployObject.destinationPin, data));
                }
            }
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
    return handlePlayer2PlayCard2(data, remainingCards);
};

const tryForTrips = (data, remainingCards) => {
    const hand = data["player2Hand"];

    const tripsPossibleOnePlayed = [];

    for (let i = 1; i <= 9; i++) {
        const pin = "pin" + i;

        const cardsPlayed = data[pin]["player2"]["cardsPlayed"];
        const length = cardsPlayed.length;

        const numberOfCards = data[pin].tacticsPlayed.includes("Mud") ? 4 : 3;

        if (length === 0 || data["claimed"][pin] || length === numberOfCards) continue;
        else if (length === 1) tripsPossibleOnePlayed.push(pin);
        else if (length === 2 || length + 1 === numberOfCards) {
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

    const numbersRemainingObject = getRemainingNumbersObject(remainingCards);

    for (const pin of tripsPossibleOnePlayed) {
        const cardsPlayed = data[pin]["player2"]["cardsPlayed"];
        const tripsNumber = parseInt(cardsPlayed[0].slice(1));
        for (const card of hand) {
            if (card[0] === 't') continue;
            const cardNumber = parseInt(card.slice(1));
            if (cardNumber === tripsNumber && numbersRemainingObject[tripsNumber] >= 2) return { card, pin };
        }
    }

    // See if it is worth trying to play a tactic card here...
    if (data.used.size > 15) return { card: null, pin: null };
    else return tryForFlush(data, remainingCards);
};

const tryWithTactic = (hand, cardsPlayed) => {
    const troop = cardsPlayed[0][0] !== 't' ? cardsPlayed[0] : cardsPlayed[1];
    const color = troop[0];
    const number = parseInt(troop.slice(1));

    const tactic = cardsPlayed[0][0] === 't' ? cardsPlayed[0] : cardsPlayed[1];
    const possibleColors = TACTICS[tactic].possibleColors;

    if (!possibleColors.includes(color)) return false;

    const possibleNumbers = new Set(TACTICS[tactic].possibleNumbers);
    
    const twoMore = color + (number + 2);
    const oneMore = color + (number + 1);
    const oneLess = color + (number - 1);
    const twoLess = color + (number - 2);

    if (possibleNumbers.has(number + 2)) {
        if (hand.has(oneMore)) return oneMore;
    }
    if (possibleNumbers.has(number + 1)) {
        if (hand.has(twoMore)) return twoMore;
        if (hand.has(oneLess)) return oneLess;
    }
    if (possibleNumbers.has(number - 1)) {
        if (hand.has(oneMore)) return oneMore;
        if (hand.has(twoLess)) return twoLess;
    }
    if (possibleNumbers.has(number - 2)) {
        if (hand.has(oneLess)) return oneLess;
    }
    
    return false
};

const tryForWedge = (data, remainingCards) => {
    const hand = data["player2Hand"];

    for (let i = 1; i <= 9; i++) {
        const pin = "pin" + i;

        const cardsPlayed = data[pin]["player2"]["cardsPlayed"];
        const length = cardsPlayed.length;

        const numberOfCards = data[pin].tacticsPlayed.includes("Mud") ? 4 : 3;

        if (length === 0 || data["claimed"][pin] || length === numberOfCards) continue;
        else if (length === 1) {
            const playedCard = cardsPlayed[0];
            const color = playedCard[0];
            const number = parseInt(playedCard.slice(1));

            const twoLess = color + (number - 2);
            const oneLess = color + (number - 1);
            const oneMore = color + (number + 1);
            const twoMore = color + (number + 2);

            if (hand.has(oneMore) && (remainingCards.has(twoMore) || remainingCards.has(oneLess))) {
                const card = oneMore;
                return {card, pin};
            } else if (hand.has(oneLess) && (remainingCards.has(oneMore) || remainingCards.has(twoLess))) {
                const card = oneLess;
                return {card, pin};
            } else if (hand.has(twoMore) && remainingCards.has(oneMore)) {
                const card = twoMore;
                return {card, pin};
            } else if (hand.has(twoLess) && remainingCards.has(twoLess)) {
                const card = twoLess;
                return {card, pin};
            }
        } else if (length === 2) {
            const color1 = cardsPlayed[0][0];
            const color2 = cardsPlayed[1][0];

            if ((color1 === 't' || color2 === 't') && !(color1 === 't' && color2 === 't')) {
                const result = tryWithTactic(hand, cardsPlayed);
                if (result) {
                    const card = result;
                    return {card, pin};
                }
            }

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
            } else if (length === 3 && length < numberOfCards) {
                if (numbers[0] + 2 === numbers[2]) {
                    const oneMore = color1 + (numbers[2] + 1);
                    const oneLess = color1 + (numbers[0] - 1);
                    if (hand.has(oneMore)) {
                        const card = oneMore;
                        return {card, pin};
                    } else if (hand.has(oneLess)) {
                        const card = oneLess;
                        return {card, pin};
                    };
                } else if (numbers[0] + 3 === numbers[2]) {
                    const missingNumber = findMissingNumbersForStraight(1, numbers);
                    const card = color1 + missingNumber;
                    if (hand.has(card)) {
                        return {card, pin};
                    };
                }
            }
        }
    }

    return tryForTrips(data, remainingCards);
};

// eslint-disable-next-line
const evaluateHandsOfOpponent = (data) => {

};

const wantedCards1 = (card, remainingCards) => {
    const wanted = new Set();
    const color = card[0];
    const number = parseInt(card.slice(1));

    const twoMore = color + (number + 2);
    const oneMore = color + (number + 1);
    const oneLess = color + (number - 1);
    const twoLess = color + (number - 2);

    if (number + 1 <= 10 && (remainingCards.has(twoMore) || remainingCards.has(oneLess))) wanted.add(oneMore);
    if (number - 1 >= 1 && (remainingCards.has(oneMore) || remainingCards.has(twoLess))) wanted.add(oneLess);

    return wanted;
};

const wantedCards2 = (cards, numbersRemainingObject) => {
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
    } else if (trips && numbersRemainingObject[numbers[0]] <= 1) {
        for (const color of COLORS_SET) {
            const card = color + numbers[0];
            if (!cards.includes(card)) wanted.add(card);
        }
    }
    return wanted;
};

const cardsPlayerWants = (player, data, remainingCards) => {
    const numbersRemainingObject = getRemainingNumbersObject(remainingCards);
    const wantedObject = {};
    for (let i = 1; i <= 9; i++) {
        const pin = 'pin' + i;
        if (data[pin].claimed) continue;
        const pinCards = data[pin][player].cardsPlayed;
        let new_wanted = new Set();
        if (pinCards.length < 1) continue;
        else if (pinCards.length === 1) {
            new_wanted = wantedCards1(pinCards[0], remainingCards);
        } else if (pinCards.length === 2) {
            new_wanted = wantedCards2(pinCards, numbersRemainingObject);
        }
        if (new_wanted.size > 0) wantedObject[pin] = new_wanted;
    }
    return wantedObject;
};

const cardToRedeploy = (wantedSet, wantedObject, data) => {
    for (let i = 1; i <= 9; i++) {
        const pin = 'pin' + i;
        const cardsPlayed = data[pin].player2.cardsPlayed;
        for (const card of cardsPlayed) {
            if (wantedSet.has(card) && cardsPlayed.length <= 2) {
                for (const key in wantedObject) {
                    if (wantedObject[key] instanceof Set && wantedObject[key].has(card)) return { card: card, takeFromPin: pin, destinationPin: key };
                }
            }
        }
    };
    return { card: null, takeFromPin: null, destinationPin: null }
};

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

const flagToMud = (data) => {
    let idealFlag = { pin: null, score: 0 };
    for (let i = 1; i <= 9; i++) {
        const pin = 'pin' + i;
        if (data[pin].claimed) continue;
        if (data[pin].player1.cardsPlayed.length > data[pin].player2.cardsPlayed.length) return { pin: pin, score: 1 };
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

const handleComputerScouting = (cardsToReturnToDeck, tacticCard, data) => {
    let newData
    for (let i = 1; i <= 3; i++) {
        newData = selectTroopCard("player2", true, data);
        data = newData;
    }
    for (const card of cardsToReturnToDeck) {
        newData = handleReturnCardToTopOfDeck("player2", card, data);
        data = newData;
    }
    return handleRemoveScoutFromHand("player2", tacticCard, newData);
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

        const nextEventMessage = { description: `Player 2 claimed Pin ${pin[3]}.` };
        newData["events"].push(nextEventMessage);
    }

    const winner = checkGameOver(newData);

    if (winner) {
        newData["gameOver"] = winner;
        newData["nextAction"] = "gameOver";
        newData["events"].push({ description: `The game is over. ${winner} wins!` });
    }

    return newData;
};

export const handlePlayer2PlayCard = (data) => {
    const remainingCards = findRemainingCards(data.used);
    const newMoveData = tryForWedge(data, remainingCards);
    // console.log(`player2 card: ${newMoveData.card}`);
    const cardToPlay = newMoveData.card;
    const pinToPlayOn = newMoveData.pin;
    if (!cardToPlay) return tryTactic(data, remainingCards);
    return updateNextAction(playCard("player2", pinToPlayOn, cardToPlay, data));
};

export const handlePlayer2PlayCard2 = (data, remainingCards) => {
    const newMoveData = tryForFlush(data, remainingCards);
    if (newMoveData === null) {
        const newData = { ...data }
        newData['events'].push({ description: "The computer is not able to play." });
        const newNextAction = "player1Play";
        return updateNextAction2(newNextAction, newData);
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
    let tacticsInOpponentHand = 0
    for (const card of data.player1Hand) {
        if (card[0] === 't') tacticsInOpponentHand++;
    }
    const cardsUsed = data.used.size;
    const tacticPlayable = data.tacticsPlayed.player2.size <= data.tacticsPlayed.player1.size;
    if ((data.tacticCards.size > 0 || data.tacticDeckTop.length > 0)  && tacticsInHand < 2 && ((tacticsInOpponentHand > tacticsInHand && tacticPlayable) || (cardsUsed > 30 && data.tacticsPlayed.player2.size === 0))) return updateNextAction(selectTacticCard('player2', false, data));
    else if (data.troopCards.size > 0 || data.troopDeckTop.length > 0) return updateNextAction(selectTroopCard('player2', false, data));
    else if (data.tacticCards.size > 0 || data.tacticDeckTop.length > 0) return updateNextAction(selectTacticCard('player2', false, data));
};

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

// Notes on making a Better Bot:
// When the computer has played fog, it should try to get the highest total on that flag
// If there is a flag the opponent has 3 cards on, and I have two cards played, is there a card I can play to win the hand immediately?
// Maybe if it is time to play a random card, I can play a card the opponent wants.
// Can I track the last card the opponent played for the sake of the computer?
// The bot needs to be able to process a one troop and one tactic hand