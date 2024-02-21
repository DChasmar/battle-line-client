import { COLORS, CARDS_PER_COLOR, PINS, WEDGE_VALUE, TRIPS_VALUE, FLUSH_VALUE, STRAIGHT_VALUE } from './constants'

const buildTroopDeck = () => {
    let troopCards = new Set();

    for (const color of COLORS) {
        for (var i = 0; i < CARDS_PER_COLOR; i++) {
            var card = color + (i + 1);
            troopCards.add(card);
        }
    }
    return troopCards
}

export const initializeGameData = () => {
    let data = {};
    let troopCards = buildTroopDeck()

    for (let i = 0; i < PINS; i++) {
        const pin = "pin" + (i + 1);
        const player1 = {}, player2 = {};

    for (const player of [player1, player2]) {
            player["cardsPlayed"] = [];
            player["score"] = null;
            player["claimable"] = false;
        }

        data[pin] = {"player1": player1, "player2": player2, "claimed": false, "firstToCompleteHand": false};
    }

    const dealCardData = dealCards(troopCards);

    data["player1Hand"] = dealCardData.player1Hand;
    data["player2Hand"] = dealCardData.player2Hand;
    data["used"] = new Set();
    data["troopCards"] = dealCardData.newTroopCards;
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

    return data;
}

const getRandomSample = (array, size) => {
    // Utility function to get a random sample from an array
    const sample = [];
    for (let i = 0; i < size; i++) {
        const randomIndex = Math.floor(Math.random() * array.length);
        sample.push(array.splice(randomIndex, 1)[0]);
    }
    return sample;
}

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
}

export const sortHand = (arr) => {
    return arr.sort((a, b) => {
        const colorA = a.charAt(0);
        const colorB = b.charAt(0);
        
        const numberA = parseInt(a.substring(1));
        const numberB = parseInt(b.substring(1));

        const colorIndexA = COLORS.indexOf(colorA);
        const colorIndexB = COLORS.indexOf(colorB);

        // First, sort based on the color index
        if (colorIndexA !== colorIndexB) {
            return colorIndexA - colorIndexB
        };

        // If colors are the same, sort based on the number
        return numberA - numberB;
    });
};

const checkFirstToCompletePinHand = (pin, player, data) => {
    const otherPlayer = player === "player1" ? "player2" : "player1";
    if (data[pin][otherPlayer]["cardsPlayed"].length === 3) {
        return otherPlayer;
    } else return player;
}

export const playCard = (player, pin, card, data) => {
    if (data[pin][player]["cardsPlayed"].length === 3 || data[pin]["claimed"]) return;
    const newData = { ...data };
    
    newData[pin][player]["cardsPlayed"].push(card);
    newData["used"].add(card);
    newData[`${player}Hand`].delete(card);

    if (newData[pin][player]["cardsPlayed"].length === 3) {
        newData[pin]["firstToCompleteHand"] = checkFirstToCompletePinHand(pin, player, newData);
        newData[pin][player]["score"] = calculateScore(pin, player, newData);
    }
    return newData
}

const calculateScore = (pin, player, data) => {
    if (data[pin][player]["cardsPlayed"].length < 3) return;

    const colorValues = data[pin][player]["cardsPlayed"].map(card => card[0]);
    const numberValues = data[pin][player]["cardsPlayed"].map(card => parseInt(card.slice(1))).sort();

    const trips = numberValues.every(value => value === numberValues[0]);
    const flush = colorValues.every(value => value === colorValues[0]);
    const straight = numberValues.every((value, i) => i === 0 || value === numberValues[i - 1] + 1);

    if (flush && straight) return WEDGE_VALUE + numberValues[numberValues.length - 1];
    else if (trips) return TRIPS_VALUE + numberValues[numberValues.length - 1];
    else if (flush) return FLUSH_VALUE + numberValues.reduce((acc, value) => acc + value, 0);
    else if (straight) return STRAIGHT_VALUE + numberValues[numberValues.length - 1];
    else return numberValues.reduce((acc, value) => acc + value, 0);
}

export const selectTroopCard = (player, data) => {
    if (data[`${player}Hand`].size > 6) return;

    const troopCardsList = Array.from(data["troopCards"]);
    const drawnCard = troopCardsList[Math.floor(Math.random() * troopCardsList.length)];

    const newData = {
        ...data,
        [`${player}Hand`]: new Set([...data[`${player}Hand`], drawnCard]),
        "troopCards": new Set([...data["troopCards"]].filter(card => card !== drawnCard)),
    };

    return newData;
}

export const updateNextAction = (data) => {
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

    return findClaimable(newData);
};

const findClaimable = (data) => {
    for (let i = 1; i <= 9; i++) {
        const pin = "pin" + i
        if (data[pin]["claimed"]) continue
        const p1HandComplete = data[pin]["player1"]["cardsPlayed"].length === 3;
        const p2HandComplete = data[pin]["player2"]["cardsPlayed"].length === 3;

        if (p1HandComplete && p2HandComplete) {
            const scorePlayer1 = calculateScore(pin, "player1", data);
            const scorePlayer2 = calculateScore(pin, "player2", data);

            data[pin]["player1"]["claimable"] = scorePlayer1 > scorePlayer2;
            data[pin]["player2"]["claimable"] = scorePlayer1 < scorePlayer2;
            if (!data[pin]["player1"]["claimable"] && !data[pin]["player2"]["claimable"]) {
                console.log("The hands are the same.")
                data[pin]["player1"]["claimable"] = data[pin]["firstToCompleteHand"] === "player1"
                data[pin]["player2"]["claimable"] = data[pin]["firstToCompleteHand"] === "player2"
            }
        } else if (p1HandComplete) {
            data[pin]["player1"]["claimable"] = calculateScore(pin, "player1", data) >= calculateMaxScore(pin, "player2", data);
        } else if (p2HandComplete) {
            data[pin]["player2"]["claimable"] = calculateScore(pin, "player2", data) >= calculateMaxScore(pin, "player1", data);
        }
    }
    return data
}

const calculateMaxScore = (pin, player, data) => {
    const remainingCards = findRemainingCards(data["used"])

    if (data[pin][player]["cardsPlayed"].length === 0) {
        return bestHandWithNoCardsPlayed(remainingCards);
    } else if (data[pin][player]["cardsPlayed"].length === 1) {
        // Assign the data to a variable and use only part of it
        return bestHandWithOneCardPlayed(pin, player, remainingCards, data);
    } else if (data[pin][player]["cardsPlayed"].length === 2) {
        // Assign the data to a variable and use only part of it
        return bestHandWithTwoCardsPlayed(pin, player, remainingCards, data);
    }
}

const bestHandWithNoCardsPlayed = (remainingCards) => {
    // Are there 3 cards remaining?
    if (remainingCards.size < 3) {
        return 0;
    }

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

    // Check if there is a possible wedge
    let maxWedge = 0;

    for (const color in remainingByColor) {
        if (remainingByColor[color].length < 3) continue;

        remainingByColor[color].sort((a, b) => a - b);

        for (let i = 0; i < remainingByColor[color].length - 2; i++) {
            if (remainingByColor[color][i] + 1 === remainingByColor[color][i + 1] &&
                remainingByColor[color][i + 1] + 1 === remainingByColor[color][i + 2]) {
                maxWedge = Math.max(maxWedge, remainingByColor[color][i + 2]);
            }
        }
    }

    if (maxWedge > 0) {
        return WEDGE_VALUE + maxWedge;
    }

    // Check if trips are possible
    for (let i = 10; i > 0; i--) {
        let count = 0;

        for (const color in remainingByColor) {
            if (remainingByColor[color].includes(i)) {
                count++;
            }
        }

        if (count >= 3) {
            return TRIPS_VALUE + i;
        }
    }

    // Check if a flush is possible
    let maxFlush = 0;

    for (const color in remainingByColor) {
        if (remainingByColor[color].length > 0) {
            maxFlush = remainingByColor[color].slice(-3).reduce((acc, num) => acc + num, 0);
        }
    }

    if (maxFlush > 0) {
        return FLUSH_VALUE + maxFlush;
    }

    // Is a straight possible?
    let maxStraight = 0;
    const numberSet = new Set();

    for (const color in remainingByColor) {
        remainingByColor[color].forEach(number => {
            numberSet.add(number);
        });
    }

    const numberList = Array.from(numberSet).sort((a, b) => a - b);

    for (let i = 0; i < numberList.length - 2; i++) {
        if (numberList[i] + 1 === numberList[i + 1] && numberList[i + 1] + 1 === numberList[i + 2]) {
            maxStraight = numberList[i + 2]; // or numberList[i] + 2
        }
    }

    if (maxStraight > 0) {
        return STRAIGHT_VALUE + maxStraight;
    }

    // Return the highest total card value

    // Extract all integers from the dictionary
    const allNumbers = Object.values(remainingByColor).flat();
    // Sort the integers in descending order
    const sortedNumbers = allNumbers.sort((a, b) => b - a);
    // Sum the three greatest integers
    const sumOfThreeGreatest = sortedNumbers.slice(0, 3).reduce((acc, num) => acc + num, 0);

    return sumOfThreeGreatest;
}

const bestHandWithOneCardPlayed = (pin, player, remainingCards, data) => {
    const color = data[pin][player]["cardsPlayed"][0][0];
    const number = parseInt(data[pin][player]["cardsPlayed"][0].slice(1));

    // console.log(color, number, `${color}${number + 1}`, pin, player, remainingCards, data);

    if (remainingCards.has(`${color}${number + 1}`) && remainingCards.has(`${color}${number + 2}`)) {
        return WEDGE_VALUE + number + 2;
    } else if (remainingCards.has(`${color}${number - 1}`) && remainingCards.has(`${color}${number + 1}`)) {
        return WEDGE_VALUE + number + 1;
    } else if (remainingCards.has(`${color}${number - 2}`) && remainingCards.has(`${color}${number - 1}`)) {
        return WEDGE_VALUE + number;
    }

    const remainingArray = Array.from(remainingCards);

    const countOfNumber = remainingArray.filter(card => parseInt(card.slice(1)) === number).length;

    if (countOfNumber >= 2) {
        return TRIPS_VALUE + number;
    }

    const numbersOfColorRemaining = [];
    const numbersRemaining = [];

    remainingCards.forEach(card => {
        numbersRemaining.push(parseInt(card.slice(1)));

        if (card[0] === color) {
            numbersOfColorRemaining.push(parseInt(card.slice(1)));
        }
    });

    if (numbersOfColorRemaining.length >= 2) {
        numbersOfColorRemaining.sort((a, b) => a - b);
        return FLUSH_VALUE + number + numbersOfColorRemaining[numbersOfColorRemaining.length - 2] + numbersOfColorRemaining[numbersOfColorRemaining.length - 1];
    }

    const twoMore = numbersRemaining.includes(number + 2);
    const oneMore = numbersRemaining.includes(number + 1);
    const oneLess = numbersRemaining.includes(number - 1);
    const twoLess = numbersRemaining.includes(number - 2);

    if (oneMore && twoMore) return STRAIGHT_VALUE + number + 2;
    else if (oneLess && oneMore) return STRAIGHT_VALUE + number + 1;
    else if (twoLess && oneLess) return STRAIGHT_VALUE + number;
    else {
        numbersRemaining.sort((a, b) => a - b);
        return number + numbersRemaining[numbersRemaining.length - 1] + numbersRemaining[numbersRemaining.length - 2];
    }
}

const bestHandWithTwoCardsPlayed = (pin, player, remainingCards, data) => {
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
}

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
}

const tryForTrips = (data) => {
    for (const card of data["player2Hand"]) {
        for (let i = 1; i <= 9; i++) {
            const pin = "pin" + i;
            const length = data[pin]["player2"]["cardsPlayed"].length;

            if (length === 0 || data["claimed"][pin] || length === 3) {
                continue;
            }

            const cardPlayed = data[pin]["player2"]["cardsPlayed"][0];

            if (cardPlayed.slice(1) === card.slice(1)) {
                return { card, pin };
            }
        }
    }

    return randomComputerMove(data);
}

const tryForWedge = (data) => {
    const hand = data["player2Hand"];

    for (let i = 1; i <= 9; i++) {
        const pin = "pin" + i;

        const length = data[pin]["player2"]["cardsPlayed"].length;

        if (length === 0 || data["claimed"][pin] || length === 3) {
            continue;
        } else if (length === 1) {
            const playedCard = data[pin]["player2"]["cardsPlayed"][0];
            const color = playedCard[0];
            const number = parseInt(playedCard.slice(1));

            const oneLess = color + (number - 1);
            const oneMore = color + (number + 1);

            if (hand.has(oneLess)) {
                const card = oneLess
                return {card, pin};
            } else if (hand.has(oneMore)) {
                const card = oneMore
                return {card, pin};
            }
        } else if (length === 2) {
            const sortedHand = Array.from(hand).sort();
            const color1 = sortedHand[0][0];
            const color2 = sortedHand[1][0];

            if (color1 !== color2) {
                continue;
            }

            const number1 = parseInt(sortedHand[0].slice(1));
            const oneLess = color1 + (number1 - 1);
            const oneMore = color1 + (number1 + 2);

            if (hand.has(oneLess)) {
                const card = oneLess
                return {card, pin};
            } else if (hand.has(oneMore)) {
                const card = oneMore
                return {card, pin};
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
// eslint-disable-next-line
const wedgePotential = (hand, usedCards) => {
    const remainingCards = findRemainingCards(usedCards)

    const scores = {};

    for (const card of hand) {
        const color = card[0];
        const number = parseInt(card.slice(1));
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
                score += 12;
            } else if (inHand[i] && inRemaining[i + 1]) {
                score += 4;
            } else if (inRemaining[i] && inHand[i + 1]) {
                score += 4;
            } else if (inRemaining[i] && inRemaining[i + 1]) {
                score += 1;
            }
        }

        scores[card] = score;
    }

    return scores;
};

export const handlePlayer2ClaimPins = (data) => {
    let newData = { ...data }
    const claimablePins = [];
    for (let i = 1; i <= 9; i++) {
        const pin = "pin" + i
        if (data[pin]["player2"]["claimable"]) claimablePins.push(pin);
    }
    for (const pin of claimablePins) {
        newData["claimed"][pin] = "player2";
        newData[pin]["claimed"] = true;
    }
    return newData;
};

export const handlePlayer2PlayCard = (data) => {
    const newMoveData = tryForWedge(data);
    const cardToPlay = newMoveData.card
    const pinToPlayOn = newMoveData.pin
    return updateNextAction(playCard("player2", pinToPlayOn, cardToPlay, data));
};

export const handlePlayer2DrawCard = (data) => {
    return updateNextAction(selectTroopCard('player2', data));
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
    alert(`${winner} wins!`);
    const newGameData = initializeGameData();
    setGameData(newGameData);
};