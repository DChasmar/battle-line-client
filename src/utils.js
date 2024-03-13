import { COLORS_ARRAY, COLORS_SET, NUMBERS_SET, COLOR_REFERENCE, CARDS_PER_COLOR, PINS, WEDGE_VALUE, TRIPS_VALUE, FLUSH_VALUE, STRAIGHT_VALUE, TACTICS } from './constants'

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

const disguiseOpponentHand = (hand) => {
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

        data[pin] = {"player1": player1, "player2": player2, "claimed": false, "firstToCompleteHand": false, "tacticPlayed": false};
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

const calculateScore = (player, pin, data) => {
    if (data[pin][player]["cardsPlayed"].length < 3) return;

    // This functions also works if Mud has been played.

    const colorValues = data[pin][player]["cardsPlayed"].map(card => card[0]);
    const numberValues = data[pin][player]["cardsPlayed"].map(card => parseInt(card.slice(1))).sort((a, b) => a - b);

    if (data[pin]["tacticPlayed"] === "Fog") return numberValues.reduce((acc, value) => acc + value, 0);

    const trips = numberValues.every(value => value === numberValues[0]);
    const flush = colorValues.every(value => value === colorValues[0]);
    const straight = numberValues.every((value, i) => i === 0 || value === numberValues[i - 1] + 1);

    if (flush && straight) return WEDGE_VALUE + numberValues[numberValues.length - 1];
    else if (trips) return TRIPS_VALUE + numberValues[numberValues.length - 1];
    else if (flush) return FLUSH_VALUE + numberValues.reduce((acc, value) => acc + value, 0);
    else if (straight) return STRAIGHT_VALUE + numberValues[numberValues.length - 1];
    else return numberValues.reduce((acc, value) => acc + value, 0);
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

const calculateMaxMudScore = (player, pin, otherScore, data) => {

};

const calculateMaxFogScore = (player, pin, otherScore, data) => {

};

const calculateMaxScore = (player, pin, otherScore, data) => {
    const mud = data[pin]["tacticPlayed"] === "Mud";
    if (mud) return calculateMaxMudScore(player, pin, otherScore, data);
    const fog = data[pin]["tacticPlayed"] === "Fog";
    if (fog) return calculateMaxFogScore(player, pin, otherScore, data);

    const remainingCards = findRemainingCards(data["used"]);

    const cardsPlayed = data[pin][player]["cardsPlayed"];

    if (cardsPlayed.length === 0) {
        return bestHandWithNoCardsPlayed(remainingCards, otherScore);
    } else if (cardsPlayed.length === 1) {
        if (cardsPlayed[0][0] === 't') return bestHandWithOneTacticPlayed(player, pin, remainingCards, otherScore, data);
        else return bestHandWithOneTroopPlayed(player, pin, remainingCards, otherScore, data);
    } else if (cardsPlayed.length === 2) {
        // Assign the data to a variable and use only part of it
        return bestHandWithTwoTroopsPlayed(player, pin, remainingCards, otherScore, data);
    } else if (cardsPlayed.length === 3) {

    }
};

const getRemainingByColor = (remainingCards) => {
    // Order the remaining cards by color
    const remainingByColor = {
        "r": [],
        "o": [],
        "y": [],
        "g": [],
        "b": [],
        "v": []
    };

    remainingCards.forEach(card => {
        remainingByColor[card[0]].push(parseInt(card.slice(1)));
    });

    // Sort numbers from least to greatest
    for (const color of remainingByColor) {
        remainingByColor[color].sort((a, b) => a - b);
    }

    return remainingByColor;
};

const canWedge0 = (remainingByColor) => {
    let maxWedge = WEDGE_VALUE;

    for (const color in remainingByColor) {
        if (remainingByColor[color].length < 3) continue;

        for (let i = 0; i < remainingByColor[color].length - 2; i++) {
            if (remainingByColor[color][i] + 1 === remainingByColor[color][i + 1] &&
                remainingByColor[color][i + 1] + 1 === remainingByColor[color][i + 2]) {
                maxWedge = Math.max(maxWedge, remainingByColor[color][i + 2]);
            }
        }
    }

    return maxWedge;
};

const canTrips0 = (remainingCards) => {
    const numberCount = {};

    for (const card of remainingCards) {
        const number = parseInt(card.slice(1));
        if (numberCount[number]) numberCount[number]++;
        else numberCount[number] = 1;
    }

    for (let i = 10; i >= 1; i--) {
        if (numberCount[i] >= 3) return TRIPS_VALUE + i;
    }
    return TRIPS_VALUE;
};

const canFlush0 = (remainingByColor) => {
    let maxFlush = FLUSH_VALUE;

    for (const color in remainingByColor) {
        if (remainingByColor[color].length >= 3) {
            maxFlush = Math.max(maxFlush, remainingByColor[color].slice(-3).reduce((acc, num) => acc + num, 0));
        }
    }
    return maxFlush;
};

const canStraight0 = (remainingCards) => {
    let maxStraight = STRAIGHT_VALUE;
    const numberSet = new Set();

    remainingCards.forEach(card => {
        const number = card.slice(1);
        numberSet.add(number);
    });

    const numberList = Array.from(numberSet).sort((a, b) => a - b);

    for (let i = 0; i < numberList.length - 2; i++) {
        if (numberList[i] + 1 === numberList[i + 1] && numberList[i + 1] + 1 === numberList[i + 2]) {
            maxStraight = numberList[i] + 2;
        }
    }

    return maxStraight;
};

const sum0 = (remainingByColor) => {
    // Extract all integers from the dictionary
    const allNumbers = Object.values(remainingByColor).flat();
    // Sort the integers in descending order
    const sortedNumbers = allNumbers.sort((a, b) => b - a);
    // Sum the three greatest integers
    const sumOfThreeGreatest = sortedNumbers.slice(0, 3).reduce((acc, num) => acc + num, 0);

    return sumOfThreeGreatest;
};

const bestHandWithNoCardsPlayed = (remainingCards, otherScore) => {
    if (remainingCards.size < 3) {
        return 0;
    }

    let score;

    const remainingByColor = getRemainingByColor(remainingCards);

    score = canWedge0(remainingByColor);
    if (score > WEDGE_VALUE) return score;
    if (otherScore > score) return 0;

    score = canTrips0(remainingCards);
    if (score > TRIPS_VALUE) return score;
    if (otherScore > score) return 0;

    score = canFlush0(remainingByColor);
    if (score > FLUSH_VALUE) return score;
    if (otherScore > score) return 0;
    
    score = canStraight0(remainingCards);
    if (score > STRAIGHT_VALUE) return score;
    if (otherScore > score) return 0;

    return sum0(remainingByColor);
};

// Mud
// Fog

// No cardsPlayed: bestHandWithNoCardsPlayed()
// One Troop: bestHandWithOneTroop()
// One Tactic: best hand with Tactic()
// Two Troops: bestHandWithTwoTroops()
// One Troop, One Tactic: start with the one troop card
// Two Tactics: can they be together with the same color?
// Three Troops: return calculateScore()
// Two Troops, One Tactic: start with the two troop values
// One Troop, Two Tactics: start with the one troop value
// Three Tactics: return FLUSH_VALUE + 21;

const filterRemainingForColorAndNumber = (color, remainingCards) => {
    const numbersOfColorRemaining = [];
    const numbersRemaining = new Set();
    const allNumbersRemaining = [];

    remainingCards.forEach(card => {
        const number = parseInt(card.slice(1));
        numbersRemaining.add(number);
        allNumbersRemaining.push(number);

        if (card[0] === color) {
            numbersOfColorRemaining.push(number);
        }
    });
    return { numbersOfColorRemaining, numbersRemaining, allNumbersRemaining };
};

const canWedge1 = (color, number, remainingCards) => {
    if (remainingCards.has(`${color}${number + 1}`) && remainingCards.has(`${color}${number + 2}`)) return WEDGE_VALUE + number + 2;
    else if (remainingCards.has(`${color}${number - 1}`) && remainingCards.has(`${color}${number + 1}`)) return WEDGE_VALUE + number + 1;
    else if (remainingCards.has(`${color}${number - 2}`) && remainingCards.has(`${color}${number - 1}`)) return WEDGE_VALUE + number;
    else return WEDGE_VALUE;
};

const canTrips1 = (number, remainingCards) => {
    const remainingArray = Array.from(remainingCards);
    const countOfNumber = remainingArray.filter(card => parseInt(card.slice(1)) === number).length;
    if (countOfNumber >= 2) return TRIPS_VALUE + number;
    else return TRIPS_VALUE;
};

const canFlush1 = (number, numbersOfColorRemaining) => {
    if (numbersOfColorRemaining.length >= 2) {
        return FLUSH_VALUE + number + numbersOfColorRemaining.slice(-2).reduce((sum, num) => sum + num, 0);
    } else return FLUSH_VALUE;
};

const canStraight1 = (number, numbersRemaining) => {
    const twoMore = numbersRemaining[number + 2];
    const oneMore = numbersRemaining[number + 1];
    const oneLess = numbersRemaining[number - 1];
    const twoLess = numbersRemaining[number - 2];

    if (oneMore && twoMore) return STRAIGHT_VALUE + number + 2;
    else if (oneLess && oneMore) return STRAIGHT_VALUE + number + 1;
    else if (twoLess && oneLess) return STRAIGHT_VALUE + number;

    return STRAIGHT_VALUE;
};

const sum1 = (number, allNumbersRemaining) => {
    const sortedNumbers = allNumbersRemaining.sort((a, b) => a - b);
    return number + sortedNumbers.slice(-2).reduce((sum, num) => sum + num, 0);
}

const bestHandWithOneTroopPlayed = (player, pin, remainingCards, otherScore, data) => {
    let score;
    const color = data[pin][player]["cardsPlayed"][0][0];
    const number = parseInt(data[pin][player]["cardsPlayed"][0].slice(1));

    score = canWedge1(color, number, remainingCards);
    // We return WEDGE_VALUE without any increment if there is not potential WEDGE
    if (score > WEDGE_VALUE) return score;
    if (otherScore > score) return 0;
    
    score = canTrips1(number, remainingCards);
    if (score > TRIPS_VALUE) return score;
    if (otherScore > score) return 0;

    const flushAndStraightData = filterRemainingForColorAndNumber(color, remainingCards);

    score = canFlush1(number, flushAndStraightData.numbersOfColorRemaining);
    if (score > FLUSH_VALUE) return score;
    if (otherScore > score) return 0;

    score = canStraight1(number, flushAndStraightData.numbersRemaining);
    if (score > STRAIGHT_VALUE) return score;
    if (otherScore > score) return 0;
    
    // Just total sum;
    return sum1(number, flushAndStraightData.allNumbersRemaining);
};

const canWedge1Any = (colors, numberSet, remainingCards) => {
    const remainingByColor = getRemainingByColor(remainingCards);
    let max_value = WEDGE_VALUE;
    for (const color of colors) {
        if (remainingByColor[color] && remainingByColor[color].length > 1) {
            const numbersOfColorRemaining = remainingByColor[color];
            for (let i = numbersOfColorRemaining.length - 1; i >= 1; i--) {
                if (numbersOfColorRemaining[i] - numbersOfColorRemaining[i - 1] === 1) {
                    if (numberSet.has(numbersOfColorRemaining[i] + 1)) {
                        max_value = Math.max(max_value, WEDGE_VALUE + numbersOfColorRemaining[i] + 1);
                        continue;
                    } else if (numberSet.has(numbersOfColorRemaining[i])) {
                        max_value = Math.max(max_value, WEDGE_VALUE + numbersOfColorRemaining[i]);
                        continue;
                    }                    
                } else if (numbersOfColorRemaining[i] - numbersOfColorRemaining[i - 1] === 2 && numberSet.has(numbersOfColorRemaining[i] - 1)) {
                    max_value = Math.max(max_value, WEDGE_VALUE + numbersOfColorRemaining[i]);
                    continue
                };
            }
        }
    }
    return max_value;
};

const bestHandWithOneTacticPlayed = (player, pin, remainingCards, otherScore, data) => {
    const card = data[pin][player]["cardsPlayed"][0];
    const tacticName = TACTICS[card].name;
    let score;
    if (tacticName === "Alexander" || tacticName === "Darius") score = canWedge1Any(COLORS_ARRAY, NUMBERS_SET, remainingCards);
    else if (tacticName === "Campaign Cavalry") score = canWedge1Any(COLORS_ARRAY, new Set([8]), remainingCards);
    else if (tacticName === "Shield Bearer") score = canWedge1Any(COLORS_ARRAY, new Set([3, 2, 1]), remainingCards);

    if (score > WEDGE_VALUE) return score;
    if (otherScore > score) return 0;


};

// Need separate bestHandWith Two and Three CardsPlayed functions for when MUD is truthy

const bestHandWithTwoTroopsPlayed = (player, pin, remainingCards, otherScore, data) => {
    const colorValues = data[pin][player]["cardsPlayed"].map(card => card[0]);
    const numberValues = data[pin][player]["cardsPlayed"].map(card => parseInt(card.slice(1)));
    const sortedNumberValues = numberValues.slice().sort((a, b) => a - b);

    const trips = sortedNumberValues[0] === sortedNumberValues[1];
    const flush = colorValues[0] === colorValues[1];
    const gutStraight = sortedNumberValues[0] + 2 === sortedNumberValues[1];
    const openStraight = sortedNumberValues[0] + 1 === sortedNumberValues[1];

    if (flush && openStraight) {
        const high = `${colorValues[0]}${sortedNumberValues[1] + 1}`;
        if (remainingCards.has(high)) return WEDGE_VALUE + sortedNumberValues[1] + 1;

        const low = `${colorValues[0]}${sortedNumberValues[0] - 1}`;
        if (remainingCards.has(low)) return WEDGE_VALUE + sortedNumberValues[1];
    } else if (flush && gutStraight) {
        const mid = `${colorValues[0]}${sortedNumberValues[0] + 1}`;
        if (remainingCards.has(mid)) return WEDGE_VALUE + sortedNumberValues[1];
    }

    const remainingArray = Array.from(remainingCards);
    
    if (trips) {
        const suffixToCheck = sortedNumberValues[0].toString();
        const matchingCard = remainingArray.find(card => card.endsWith(suffixToCheck));
    
        if (matchingCard) {
            // Handle the case when a matching card is found
            return TRIPS_VALUE + sortedNumberValues[0];
        }
    }

    if (flush) {
        if (remainingArray.some(card => card[0] === colorValues[0])) {
            let maxNumberRemaining = 1;

            for (const card of remainingArray) {
                if (card[0] === colorValues[0]) {
                    maxNumberRemaining = Math.max(maxNumberRemaining, parseInt(card.slice(1)));
                }
            }

            return FLUSH_VALUE + sortedNumberValues.reduce((acc, num) => acc + num, 0) + maxNumberRemaining;
        }
    }

    if (openStraight) {
        // Check for card value one higher
        if (remainingArray.some(card => parseInt(card.slice(1)) === sortedNumberValues[1] + 1)) {
            return STRAIGHT_VALUE + sortedNumberValues[1] + 1;
        }

        // Check for card value one lower
        if (remainingArray.some(card => parseInt(card.slice(1)) === sortedNumberValues[0] - 1)) {
            return STRAIGHT_VALUE + sortedNumberValues[1];
        }
    }

    if (gutStraight) {
        // Check for card value in the middle of the two you already have
        if (remainingArray.some(card => parseInt(card.slice(1)) === sortedNumberValues[0] + 1)) {
            return STRAIGHT_VALUE + sortedNumberValues[1];
        }
    }

    // If none of the conditions above are met, check for highest possible total
    let maxNumberRemaining = 1;

    for (const card of remainingArray) {
        maxNumberRemaining = Math.max(maxNumberRemaining, parseInt(card.slice(1)));
        if (maxNumberRemaining === 10) break;
    }

    return sortedNumberValues.reduce((acc, num) => acc + num, 0) + maxNumberRemaining;
};

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
        const cardsPlayed = data[pin]["player2"]["cardsPlayed"];
        if (cardsPlayed.length === 0 && !data[pin]["claimed"]) {
            emptyPins.push(pin);
        } else if (cardsPlayed.length < 3 && !data[pin]["claimed"]) {
            unfinishedPins.push(pin);
        }
    }
    if (emptyPins.length > 0) {
        // Return a random pin from the emptyPins array
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

    const scores = {};
    const numberTally = {};

    for (const card of hand) {
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
    if (!pin) return null;
    if (max_score > 0) return { card, pin }
    // I do not think this next line will ever execute.
    else return randomComputerMove(data);
};

const tryForTrips = (data) => {
    for (const card of data["player2Hand"]) {
        for (let i = 1; i <= 9; i++) {
            const pin = "pin" + i;
            const length = data[pin]["player2"]["cardsPlayed"].length;

            if (length === 0 || data["claimed"][pin] || length === 3) {
                continue;
            } else if (length === 1) {
                const cardPlayed = data[pin]["player2"]["cardsPlayed"][0];

                if (cardPlayed.slice(1) === card.slice(1)) {
                    return { card, pin };
                }
            } else if (length === 2) {
                const cardsPlayed = data[pin]["player2"]["cardsPlayed"];

                if (cardsPlayed[0].slice(1) === cardsPlayed[1].slice(1) && cardsPlayed[0].slice(1) === card.slice(1)) {
                    return { card, pin };
                }
            }
        }
    }

    return idealCard(data);
};

const tryForWedge = (data) => {
    const hand = data["player2Hand"];

    for (let i = 1; i <= 9; i++) {
        const pin = "pin" + i;

        const length = data[pin]["player2"]["cardsPlayed"].length;
        const cardsPlayed = data[pin]["player2"]["cardsPlayed"];

        if (length === 0 || data["claimed"][pin] || length === 3) {
            continue;
        } else if (length === 1) {
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

            if (color1 !== color2) {
                continue;
            }

            const numbers = [parseInt(cardsPlayed[0].slice(1)), parseInt(cardsPlayed[1].slice(1))].sort((a, b) => a - b);
            if (numbers[1] - 2 === numbers[0]) {
                const card = color1 + (numbers[0] + 1);
                if (hand.has(card)) return {card, pin};
            } else if (numbers[1] - 1 === numbers[0]) {
                const oneMore = color1 + (numbers[0] + 1);
                const oneLess = color1 + (numbers[0] - 1);
                if (hand.has(oneMore)) {
                    const card = oneMore;
                    return {card, pin};
                } else if (hand.has(oneLess)) {
                    const card = oneLess;
                    return {card, pin};
                };
            }
        }
    }

    return tryForTrips(data);
};

const findRemainingCards = (usedCards) => {
    const remainingCards = buildTroopDeck();
    for (const card of usedCards) {
        remainingCards.delete(card);
    }
    return remainingCards;
};

export const handlePlayer2ClaimPins = (data) => {
    const newData = { ...data }
    const claimablePins = [];
    for (let i = 1; i <= 9; i++) {
        const pin = "pin" + i
        if (data[pin]["player2"]["claimable"]) claimablePins.push(pin);
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
    if (newMoveData === null) {
        console.log("The computer has nowhere to play.");
        const newData = { ...data };
        newData["nextAction"] = "player1Play";
        return newData;
    }
    console.log(`player2 move: ${newMoveData.card}`);
    const cardToPlay = newMoveData.card;
    const pinToPlayOn = newMoveData.pin;
    return updateNextAction(playCard("player2", pinToPlayOn, cardToPlay, data));
};

export const handlePlayer2DrawCard = (data) => {
    return updateNextAction(selectTroopCard('player2', false, data));
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

const hasConsecutivePins = (pins) => {
    // Check if there are three consecutive pins
    for (let i = 0; i < pins.length - 2; i++) {
        if (pins[i] === pins[i + 1] - 1 && pins[i] === pins[i + 2] - 2) {
            return true;
        }
    }

    return false;
};

export const resetGame = (winner, setGameData) => {
    console.log("Resetting game for winner:", winner);
    const newGameData = initializeGameData();
    setGameData(newGameData);
};

// Create a function to handle checks that occur in all or multiple tactic functions:
// Checking if the object exists.
// Adding an event.

export const handleDiscard = (player, tacticUsed, cardDiscardedData, data) => {
    const newData = { ...data };

    if (!cardDiscardedData.card || !cardDiscardedData.pin || !cardDiscardedData.player || !cardDiscardedData.tactic) {
        console.log(cardDiscardedData);
        console.log("Error in handleDiscard");
        return;
    };
    const card = cardDiscardedData.card;
    const pin = cardDiscardedData.pin;
    const playerDiscarded = cardDiscardedData.player;

    // Check if the card exists in the cardsPlayed array
    const cardsPlayed = newData[pin]?.[playerDiscarded]?.["cardsPlayed"];
    if (!cardsPlayed) {
        console.log("Card not found in cardsPlayed array");
        return;
    }

    // Remove the card from the cardsPlayed array using filter
    newData[pin][playerDiscarded]["cardsPlayed"] = cardsPlayed.filter((playedCard) => playedCard !== card);
    newData["discardedCards"].push(card);
    newData["tacticsPlayed"][player].add(tacticUsed);
    newData["used"].add(tacticUsed);
    newData[`${player}Hand`].delete(tacticUsed);

    const color = COLORS_SET.has(card[0]) ? COLOR_REFERENCE[card[0]] : card[0] === 't' ? TACTICS[card].name : "Error finding card value";
    const cardName = COLORS_SET.has(card[0]) ? `${parseInt(card.slice(1))} ${color}` : color;

    const nextEventMessage = { description: `${player} used Tactic ${TACTICS[tacticUsed].name} to discard ${cardName} from Flag ${pin[3]}.` }

    newData["events"].push(nextEventMessage);

    return newData;
};

export const handleRedeploy = (player, tacticUsed, cardRedeployData, destinationPin, data) => {
    const newData = { ...data };

    if (!cardRedeployData.card || !cardRedeployData.pin || !cardRedeployData.tactic) {
        console.log(cardRedeployData);
        console.log("Error in handleRedeploy");
        return;
    };
    const card = cardRedeployData.card;
    const pin = cardRedeployData.pin;

    // Check if the card exists in the cardsPlayed array
    const cardsPlayed = newData[pin]?.[player]?.["cardsPlayed"];
    if (!cardsPlayed) {
         console.log("Card not found in cardsPlayed array");
         return;
    }

    newData[pin][player]["cardsPlayed"] = cardsPlayed.filter((playedCard) => playedCard !== card);
    newData[destinationPin][player]["cardsPlayed"].push(card);
    newData["tacticsPlayed"][player].add(tacticUsed);
    newData["used"].add(tacticUsed);
    newData[`${player}Hand`].delete(tacticUsed);

    const color = COLORS_SET.has(card[0]) ? COLOR_REFERENCE[card[0]] : card[0] === 't' ? TACTICS[card].name : "Error finding card value";
    const cardName = COLORS_SET.has(card[0]) ? `${parseInt(card.slice(1))} ${color}` : color;

    const nextEventMessage = { description: `${player} used Tactic ${TACTICS[tacticUsed].name} to move ${cardName} from Flag ${pin[3]} to Flag ${destinationPin[3]}.` }

    newData["events"].push(nextEventMessage);

    return newData;
};

export const handleTraitor = (player, tacticUsed, cardTraitorData, destinationPin, data) => {
    const newData = { ...data };

    if (!cardTraitorData.card || !cardTraitorData.pin || !cardTraitorData.tactic) {
        console.log(cardTraitorData);
        console.log("Error in handleTraitor");
        return;
    };
    const card = cardTraitorData.card;
    const pin = cardTraitorData.pin;
    const playerTraitored = cardTraitorData.player;

    // Check if the card exists in the cardsPlayed array
    const cardsPlayed = newData[pin]?.[playerTraitored]?.["cardsPlayed"];
    if (!cardsPlayed) {
         console.log("Card not found in cardsPlayed array");
         return;
    }

    newData[pin][playerTraitored]["cardsPlayed"] = cardsPlayed.filter((playedCard) => playedCard !== card);
    newData[destinationPin][player]["cardsPlayed"].push(card);
    newData["tacticsPlayed"][player].add(tacticUsed);
    newData["used"].add(tacticUsed);
    newData[`${player}Hand`].delete(tacticUsed);

    const color = COLORS_SET.has(card[0]) ? COLOR_REFERENCE[card[0]] : card[0] === 't' ? TACTICS[card].name : "Error finding card value";
    const cardName = COLORS_SET.has(card[0]) ? `${parseInt(card.slice(1))} ${color}` : color;

    const nextEventMessage = { description: `${player} used Tactic ${TACTICS[tacticUsed].name} to steal ${cardName} from Flag ${pin[3]} and add it to Flag ${destinationPin[3]}.` }

    newData["events"].push(nextEventMessage);

    return newData;
};

export const handleReturnCardToTopOfDeck = (player, card, data) => {
    const newData = { ...data };
    
    const tactic = card[0] === "t";

    if (tactic) newData["tacticDeckTop"].push(card);
    else newData["troopDeckTop"].push(card);
    newData[`${player}Hand`].delete(card);

    const nextEventMessage = { description: `${player} returned a ${tactic ? "Tactic" : "Troop"} Card to the top of the deck.` };

    newData["events"] = [...data["events"], nextEventMessage];

    return newData;
};

export const handleRemoveScoutFromHand = (player, card, data) => {
    data[`${player}Hand`].delete(card);
    data['used'].add(card);

    const otherPlayer = player === "player1" ? "player2" : "player1";

    data["nextAction"] = `${otherPlayer}Play`
    return data;
};

export const handleMud = (player, pin, card, data) => {
    const newData = { ...data };
    newData[pin]["tacticPlayed"] = "Mud";

    data[`${player}Hand`].delete(card);
    data['used'].add(card);

    return newData
};

export const handleFog = (player, pin, card, data) => {
    const newData = { ...data };
    newData[pin]["tacticPlayed"] = "Fog";

    data[`${player}Hand`].delete(card);
    data['used'].add(card);

    return newData
};