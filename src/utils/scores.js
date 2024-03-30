import { COLORS_ARRAY, NUMBERS_SET, NUMBERS_ARRAY, WEDGE_VALUE, TRIPS_VALUE, FLUSH_VALUE, STRAIGHT_VALUE, TACTICS, COLORS_SET } from '../constants'
import { findRemainingCards } from './gamedata'

const countTactics = (arr) => {
    const tacticArray = arr.filter(str => str.startsWith('t'));
    return tacticArray.length;
};

const onlyTroops = (player, pin, data) => {
    const cardsPlayed = data[pin][player]["cardsPlayed"];
    const colorValues = cardsPlayed.map(card => card[0]);
    const numberValues = cardsPlayed.map(card => parseInt(card.slice(1))).sort((a, b) => a - b);

    const trips = numberValues.every(value => value === numberValues[0]);
    const flush = colorValues.every(value => value === colorValues[0]);
    const straight = numberValues.every((value, i) => i === 0 || value === numberValues[i - 1] + 1);

    if (flush && straight) return WEDGE_VALUE + numberValues[numberValues.length - 1];
    else if (trips) return TRIPS_VALUE + numberValues[numberValues.length - 1];
    else if (flush) return FLUSH_VALUE + numberValues.reduce((acc, value) => acc + value, 0);
    else if (straight) return STRAIGHT_VALUE + numberValues[numberValues.length - 1];
    else return numberValues.reduce((acc, value) => acc + value, 0);
};

const fogScore = (player, pin, data) => {
    const cardsPlayed = data[pin][player]["cardsPlayed"];
    let total = 0;
    for (const card of cardsPlayed) {
        if (card[0] !== 't') total += parseInt(card.slice(1));
        else if (card[0] === 't') total += TACTICS[card] && TACTICS[card].possibleNumbers[0];
    }
    return total;
};

const twoTroopsTwoTactics = (player, pin, data) => {
    const cardsPlayed = data[pin][player]["cardsPlayed"];

    const troopsArray = cardsPlayed.filter(card => card[0] !== 't');
    const troopColors = troopsArray.map(card => card[0]);
    const troopNumbers = troopsArray.map(card => parseInt(card.slice(1))).sort((a, b) => a - b);
    const troopSum = troopNumbers.reduce((sum, number) => sum + number, 0);

    const tacticArray = cardsPlayed.filter(card => card[0] === 't');

    const possibleNumbersArray1 = TACTICS[tacticArray[0]].possibleNumbers;
    const possibleNumbersSet1 = new Set(possibleNumbersArray1);
    const possibleColors1 = new Set(TACTICS[tacticArray[0]].possibleColors);

    const possibleNumbersArray2 = TACTICS[tacticArray[1]].possibleNumbers;
    const possibleNumbersSet2 = new Set(possibleNumbersArray2);
    const possibleColors2 = new Set(TACTICS[tacticArray[1]].possibleColors);

    const trips = troopNumbers.every(number => number === troopNumbers[0]) && possibleNumbersSet1.has(troopNumbers[0]) && possibleNumbersSet2.has(troopNumbers[0]);
    const flush = troopColors.every(color => color === troopColors[0]) && possibleColors1.has(troopColors[0]) && possibleColors2.has(troopColors[0]);
    
    const gapBetweenNumbers = troopNumbers[1] - troopNumbers[0];
    // Constant below returns array of integers or false;
    const missingNumbersForStraightArray = gapBetweenNumbers <= 3 && gapBetweenNumbers > 0 && findMissingNumbersForStraight(2, troopNumbers);

    const hasFlushColor = flush && possibleColors1.has(troopColors[0]) && possibleColors2.has(troopColors[0]);

    if (flush && hasFlushColor && missingNumbersForStraightArray) {
        for (let i = missingNumbersForStraightArray.length - 1; i >= 1; i--) {
            if (twoSetsHaveBothValues(possibleNumbersSet1, possibleNumbersSet2, missingNumbersForStraightArray[i - 1], missingNumbersForStraightArray[i])) {
                return WEDGE_VALUE + Math.max(troopNumbers[1], missingNumbersForStraightArray[i]);
            };
        }
    } else if (trips) return TRIPS_VALUE + troopNumbers[0];

    if (flush) return FLUSH_VALUE + troopSum + possibleNumbersArray1[0] + possibleNumbersArray2[0];
    if (missingNumbersForStraightArray) {
        for (let i = missingNumbersForStraightArray.length - 1; i >= 1; i--) {
            if (twoSetsHaveBothValues(possibleNumbersSet1, possibleNumbersSet2, missingNumbersForStraightArray[i - 1], missingNumbersForStraightArray[i])) {
                return STRAIGHT_VALUE + Math.max(troopNumbers[1], missingNumbersForStraightArray[i]);
            };
        }
    }
    return troopSum + possibleNumbersArray1[0] + possibleNumbersArray2[0];
};

const mudScore = (player, pin, data) => {
    if (data[pin]["tacticsPlayed"].includes("Fog")) return fogScore(player, pin, data);
    const cardsPlayed = data[pin][player]["cardsPlayed"];
    const tacticCount = countTactics(cardsPlayed);
    if (tacticCount === 0) return onlyTroops(player, pin, data);
    else if (tacticCount === 1) return oneTacticRestTroops(player, pin, data);
    else if (tacticCount === 2) return twoTroopsTwoTactics(player, pin, data);
    else if (tacticCount === 3) {
        const nonTacticCardNumber = parseInt(cardsPlayed.find(card => card[0] !== 't').slice(1));
        return FLUSH_VALUE + 21 + nonTacticCardNumber; // Change this when new Tactics are added
    }
    else {
        console.error("Error in mudScore function. What is the tacticCount?");
        return 0;
    }
};

export const calculateScore = (player, pin, data) => {
    const cardsPlayed = data[pin][player]["cardsPlayed"];
    const numberOfCards = data[pin]["tacticsPlayed"].includes("Mud") ? 4 : 3;
    if (cardsPlayed.length < numberOfCards) {
        console.error("Not enough cards to calculateScore.");
        return 0;
    };

    if (numberOfCards === 4) return mudScore(player, pin, data);
    if (data[pin]["tacticsPlayed"].includes("Fog")) return fogScore(player, pin, data);

    const tacticCount = countTactics(cardsPlayed);
    if (tacticCount === 0) return onlyTroops(player, pin, data);
    else if (tacticCount === 1) return oneTacticRestTroops(player, pin, data);
    else if (tacticCount === 2) return oneTroopTwoTactics(player, pin, data);
    else if (tacticCount === 3) return FLUSH_VALUE + 21; // Change this when new Tactics are added
};

const mudOneTroopTwoTactics = (player, pin, remainingCards, otherScore, data) => {
    const cardsPlayed = data[pin][player]["cardsPlayed"];
    const tacticsArray = cardsPlayed.filter(card => card[0] === 't');

    const troopArray = cardsPlayed.filter(card => card[0] !== 't');
    const troop = troopArray[0];

    const color = troop[0];
    const number = parseInt(troop.slice(1));

    const numberOfCards = 4;

    const mudConsecArray = [number - 3, number - 2, number - 1, number + 1, number + 2, number + 3];

    const possibleNumbersArray1 = TACTICS[tacticsArray[0]].possibleNumbers;
    const possibleNumbersSet1 = new Set(possibleNumbersArray1);
    const possibleColors1 = new Set(TACTICS[tacticsArray[0]].possibleColors);

    const possibleNumbersArray2 = TACTICS[tacticsArray[1]].possibleNumbers;
    const possibleNumbersSet2 = new Set(possibleNumbersArray2);
    const possibleColors2 = new Set(TACTICS[tacticsArray[1]].possibleColors);

    const flush = possibleColors1.has(color) && possibleColors2.has(color);

    const numbersOfColorRemainingArray = flush && getRemainingOfOneColor(color, remainingCards);
    const numbersOfColorRemainingSet = flush && new Set(numbersOfColorRemainingArray);

    if (flush) {
        const straightScore = consecutiveTwoTacticsWithBounds(numbersOfColorRemainingSet, possibleNumbersSet1, possibleNumbersSet2, numberOfCards, mudConsecArray);
        if (straightScore > 0) return WEDGE_VALUE + Math.max(number, straightScore);
    }

    if (otherScore > WEDGE_VALUE) return 0;

    const numbersRemainingObject = getRemainingNumbersObject(remainingCards);

    if (possibleNumbersSet1.has(number) && possibleNumbersSet2.has(number) && numbersRemainingObject[number] >= 1) return TRIPS_VALUE + number;

    if (otherScore > TRIPS_VALUE) return 0;

    if (flush && numbersOfColorRemainingArray.length >= 1) return FLUSH_VALUE + addValuesAtEndOfArray(number + possibleNumbersArray1[0] + possibleNumbersArray2[0], numberOfCards - 3, numbersOfColorRemainingArray);

    if (otherScore > FLUSH_VALUE) return 0;

    const numbersRemainingSet = new Set(Object.keys(numbersRemainingObject).filter(key => numbersRemainingObject[key] >= 1));

    const straightScore = consecutiveTwoTacticsWithBounds(numbersRemainingSet, possibleNumbersSet1, possibleNumbersSet2, numberOfCards, mudConsecArray);
    if (straightScore > 0) return WEDGE_VALUE + Math.max(number, straightScore);

    if (otherScore > STRAIGHT_VALUE) return 0;

    return maxSum(number + possibleNumbersArray1[0] + possibleNumbersArray2[0], numberOfCards - 3, numbersRemainingObject);
};

const mudTwoTroopsOneTactic = (player, pin, remainingCards, otherScore, data) => {
    const cardsPlayed = data[pin][player]["cardsPlayed"];
    const troopsArray = cardsPlayed.filter(card => card[0] !== 't');
    const troopColors = troopsArray.map(card => card[0]);
    const troopNumbers = troopsArray.map(card => parseInt(card.slice(1))).sort((a, b) => a - b);
    const troopSum = troopNumbers.reduce((sum, number) => sum + number, 0);

    const tacticArray = cardsPlayed.filter(card => card[0] === 't');
    const tactic = tacticArray[0];

    const mudStraightArray = 
        troopNumbers[0] + 1 === troopNumbers[1] ? [troopNumbers[0] - 2, troopNumbers[0] - 1, troopNumbers[1] + 1, troopNumbers[1] + 2] :
        troopNumbers[0] + 2 === troopNumbers[1] ? [troopNumbers[0] - 1, troopNumbers[0] + 1, troopNumbers[1] + 1] :
        troopNumbers[0] + 3 === troopNumbers[1] ? [troopNumbers[0] + 1, troopNumbers[1] - 1] :
        null;

    const possibleNumbersArray = TACTICS[tactic].possibleNumbers;
    const possibleNumbersSet = new Set(possibleNumbersArray);
    const possibleColors = new Set(TACTICS[tactic].possibleColors);

    const numbersOfColorRemainingArray = getRemainingOfOneColor(troopColors[0], remainingCards);
    const numbersOfColorRemainingSet = new Set(numbersOfColorRemainingArray);

    const quads = troopNumbers.every(number => number === troopNumbers[0]) && possibleNumbersSet.has(troopNumbers[0]);
    const flush = troopColors.every(color => color === troopColors[0]) && possibleColors.has(troopColors[0]);

    if (flush && mudStraightArray) {
        for (let i = mudStraightArray.length - 1; i >= 1; i--) {
            if (twoSetsHaveBothValues(numbersOfColorRemainingSet, possibleNumbersSet, mudStraightArray[i - 1], mudStraightArray[i])) return WEDGE_VALUE + Math.max(mudStraightArray[i], troopNumbers[1]);
        }
    }

    if (otherScore > WEDGE_VALUE) return 0;

    const numbersRemainingObject = getRemainingNumbersObject(remainingCards);

    if (quads && numbersRemainingObject[troopNumbers[0]] >= 1) return TRIPS_VALUE + troopNumbers[0];

    if (otherScore > TRIPS_VALUE) return 0;

    if (flush) return FLUSH_VALUE + addValuesAtEndOfArray(troopSum + possibleNumbersArray[0], 1, numbersOfColorRemainingArray);

    if (otherScore > FLUSH_VALUE) return 0;

    const numbersRemainingSet = new Set(Object.keys(numbersRemainingObject).filter(key => numbersRemainingObject[key] >= 1));

    for (let i = mudStraightArray.length - 1; i >= 1; i--) {
        if (twoSetsHaveBothValues(numbersRemainingSet, possibleNumbersSet, mudStraightArray[i - 1], mudStraightArray[i])) return WEDGE_VALUE + Math.max(mudStraightArray[i], troopNumbers[1]);
    }

    if (otherScore > STRAIGHT_VALUE) return 0;

    return maxSum(troopSum + possibleNumbersArray[0], 1, numbersRemainingObject);
};

const mudThreeTroops = (player, pin, remainingCards, otherScore, data) => {
    const cardsPlayed = data[pin][player]["cardsPlayed"];
    const colors = cardsPlayed.map(card => card[0]);
    const numbers = cardsPlayed.map(card => parseInt(card.slice(1))).sort((a, b) => a - b);
    const numberSum = numbers.reduce((acc, curr) => acc + curr, 0);

    const quads = numbers.every(num => num === numbers[0]);
    const flush = colors.every(color => color === colors[0]);

    const uniqueNumbers = new Set(numbers).size === numbers.length;
    
    const openStraight = uniqueNumbers && numbers[0] + 2 === numbers[2];
    const gutStraightNumberMissing = uniqueNumbers && numbers[0] + 3 === numbers[2] && findMissingNumbersForStraight(1, numbers);

    const colorArray = flush && getRemainingOfOneColor(colors[0], remainingCards);

    if (colorArray) {
        if (openStraight) {
            if (remainingCards.has(`${colors[0]}${numbers[2] + 1}`)) return WEDGE_VALUE + numbers[2] + 1;
            else if (remainingCards.has(`${colors[0]}${numbers[0] - 1}`)) return WEDGE_VALUE + numbers[2];
        } else if (gutStraightNumberMissing) {
            if (remainingCards.has(`${colors[0]}${gutStraightNumberMissing}`)) return WEDGE_VALUE + numbers[2];
        }
    }

    if (otherScore > WEDGE_VALUE) return 0;
    
    const numbersRemainingObject = getRemainingNumbersObject(remainingCards);

    if (quads && numbersRemainingObject[numbers[0]] >= 1) return TRIPS_VALUE + numbers[0];

    if (otherScore > TRIPS_VALUE) return 0;

    if (colorArray && colorArray.length >= 1) return FLUSH_VALUE + numberSum + colorArray[colorArray.length - 1];

    if (otherScore > FLUSH_VALUE) return 0;

    if (openStraight) {
        if (numbersRemainingObject[numbers[2] + 1] >= 1) return STRAIGHT_VALUE + numbers[2] + 1;
        else if (numbersRemainingObject[numbers[0] - 1] >= 1) return STRAIGHT_VALUE + numbers[2];
    } else if (gutStraightNumberMissing) {
        if (numbersRemainingObject[gutStraightNumberMissing] >= 1) return STRAIGHT_VALUE + numbers[2];
    }
    
    if (otherScore > STRAIGHT_VALUE) return 0;

    return maxSum(numberSum, 1, numbersRemainingObject);
};

const maxMudScore = (player, pin, remainingCards, otherScore, data) => {
    const fog = data[pin]["tacticsPlayed"].includes("Fog");
    if (fog) return maxFogScore(player, pin, remainingCards, data);

    const cardsPlayed = data[pin][player]["cardsPlayed"];
    const tacticCount = countTactics(cardsPlayed);

    const numberOfCards = 4;

    if (cardsPlayed.length === 0) return noCardsPlayed(numberOfCards, remainingCards, otherScore);
    else if (cardsPlayed.length === 1) {
        if (tacticCount === 0) return oneTroopPlayed(player, pin, remainingCards, otherScore, data);
        else if (tacticCount === 1) return oneTacticPlayed(player, pin, remainingCards, otherScore, data);
        else {
            console.error("Error in maxMudScore. Length 1.");
            return 0;
        }
    } else if (cardsPlayed.length === 2) {
        if (tacticCount === 0) return twoTroopsPlayed(player, pin, remainingCards, otherScore, data);
        else if (tacticCount === 1) return oneTroopOneTacticPlayed(player, pin, remainingCards, otherScore, data);
        else if (tacticCount === 2) return twoTacticsPlayed(player, pin, remainingCards, otherScore, data);
        else {
            console.error("Error in maxMudScore. Length 2.");
            return 0;
        }
    } else if (cardsPlayed.length === 3) {
        if (tacticCount === 0) return mudThreeTroops(player, pin, remainingCards, otherScore, data);
        else if (tacticCount === 1) return mudTwoTroopsOneTactic(player, pin, remainingCards, otherScore, data);
        else if (tacticCount === 2) return mudOneTroopTwoTactics(player, pin, remainingCards, otherScore, data);
        else if (tacticCount === 3) return FLUSH_VALUE + maxSum(21, 1, getRemainingNumbersObject(remainingCards));
        else {
            console.error("Error in maxMudScore. Length 3.");
            return 0;
        }
    } else {
        console.error("Error in maxMudScore.");
        return 0;
    }
};

const maxFogScore = (player, pin, remainingCards, data) => {
    const cardsPlayed = data[pin][player]["cardsPlayed"];
    const numberOfCards = data[pin]["tacticsPlayed"].includes("Mud") ? 4 : 3;

    let total = 0;
    
    for (const card of cardsPlayed) {
        if (card[0] !== 't') total += parseInt(card.slice(1));
        else if (card[0] === 't') total += TACTICS[card] && TACTICS[card].possibleNumbers[0];
    };

    const numbersRemainingObject = getRemainingNumbersObject(remainingCards);

    return maxSum(total, numberOfCards - cardsPlayed.length, numbersRemainingObject);
};

export const calculateMaxScore = (player, pin, otherScore, data) => {
    const remainingCards = findRemainingCards(data["used"]);
    const mud = data[pin]["tacticsPlayed"].includes("Mud");
    if (mud) return maxMudScore(player, pin, remainingCards, otherScore, data);
    const fog = data[pin]["tacticsPlayed"].includes("Fog");
    if (fog) return maxFogScore(player, pin, remainingCards, data);

    const cardsPlayed = data[pin][player]["cardsPlayed"];
    const tacticCount = countTactics(cardsPlayed);
    const numberOfCards = 3;

    if (cardsPlayed.length === 0) return noCardsPlayed(numberOfCards, remainingCards, otherScore);
    else if (cardsPlayed.length === 1) {
        if (tacticCount === 1) return oneTacticPlayed(player, pin, remainingCards, otherScore, data);
        else return oneTroopPlayed(player, pin, remainingCards, otherScore, data);
    } else if (cardsPlayed.length === 2) {
        // Assign the data to a variable and use only part of it
        if (tacticCount === 0) return twoTroopsPlayed(player, pin, remainingCards, otherScore, data);
        else if (tacticCount === 1) return oneTroopOneTacticPlayed(player, pin, remainingCards, otherScore, data);
        else if (tacticCount === 2) return twoTacticsPlayed(player, pin, remainingCards, otherScore, data);
    } else if (cardsPlayed.length === 3) {
        // This is for Mud. Is it necessary?
    } else {
        console.error("Error calculating maxScore");
        return 0;
    }
};

const getRemainingByColorArrays = (remainingCards) => {
    const remainingByColorArrays = {
        "r": [],
        "o": [],
        "y": [],
        "g": [],
        "b": [],
        "v": []
    };

    remainingCards.forEach(card => {
        const color = card[0];
        const number = parseInt(card.slice(1));
        remainingByColorArrays[color].push(number);
    });

    // Sort numbers from least to greatest
    for (const color in remainingByColorArrays) {
        remainingByColorArrays[color].sort((a, b) => a - b);
    }

    return remainingByColorArrays;
};

const getRemainingByColorSets = (remainingCards) => {
    const remainingByColorSets = {
        "r": new Set(),
        "o": new Set(),
        "y": new Set(),
        "g": new Set(),
        "b": new Set(),
        "v": new Set()
    };

    remainingCards.forEach(card => {
        remainingByColorSets[card[0]].add(parseInt(card.slice(1)));
    });


    return remainingByColorSets;
};

const getRemainingOfOneColor = (color, remainingCards) => {
    const numbersOfColorRemaining = [];

    remainingCards.forEach(card => {
        if (card[0] === color) {
            const number = parseInt(card.slice(1));
            numbersOfColorRemaining.push(number);
        }
    });

    numbersOfColorRemaining.sort((a, b) => a - b);

    return numbersOfColorRemaining;
};

export const getRemainingNumbersObject = (remainingCards) => {
    const numbersRemaining = {
        1: 0,
        2: 0,
        3: 0,
        4: 0,
        5: 0,
        6: 0,
        7: 0,
        8: 0,
        9: 0,
        10: 0
    };
    remainingCards.forEach(card => {
        const number = parseInt(card.slice(1));
        if (numbersRemaining[number] !== undefined) numbersRemaining[number]++;
        else {
            console.error("Error in getRemainingNumbersObject");
            console.log(number);
            console.log(remainingCards);
        };
    });

    return numbersRemaining;
};

const canTrips = (numbersSet, cardsNeeded, numbersRemainingObject) => {
    for (let number = 10; number >= 1; number--) {
        if (numbersSet.has(number) && numbersRemainingObject[number] >= cardsNeeded) return TRIPS_VALUE + number;
    }
    return 0;
}

const canWedge0 = (numberOfCards, remainingByColorArrays) => {
    let max_wedge = 0;
    for (const color of COLORS_ARRAY) {
        const arr = remainingByColorArrays[color];
        for (let i = arr.length - 1; i >= numberOfCards - 1; i--) {
            if (arr[i] - (numberOfCards - 1) === arr[i - (numberOfCards - 1)]) max_wedge = Math.max(max_wedge, WEDGE_VALUE + arr[i]);
        }
    }
    return max_wedge;
};

const canStraight0 = (numberOfCards, numbersRemainingObject) => {
    let sequence = 0;
    for (let number = 10; number >= 1; number--) {
        if (numbersRemainingObject[number] && numbersRemainingObject[number] >= 1) sequence++;
        else sequence = 0;
        if (sequence === numberOfCards) return STRAIGHT_VALUE + number + numberOfCards - 1;
    }

    return 0;
};

const noCardsPlayed = (numberOfCards, remainingCards, otherScore) => {
    if (remainingCards.size < numberOfCards) {
        console.log("There are not enough cards remaining to form a full hand.");
        return 0;
    }

    let score = 0;

    const remainingByColorArrays = getRemainingByColorArrays(remainingCards);

    score = canWedge0(numberOfCards, remainingByColorArrays);

    if (score > WEDGE_VALUE) return score;
    if (otherScore > WEDGE_VALUE) return 0;

    const numbersRemainingObject = getRemainingNumbersObject(remainingCards);

    score = canTrips(NUMBERS_SET, numberOfCards, numbersRemainingObject);
    if (score > TRIPS_VALUE) return score;
    if (otherScore > TRIPS_VALUE) return 0;

    for (const color of COLORS_SET) {
        score = Math.max(score, canFlush(0, numberOfCards, remainingByColorArrays[color]));
    }

    if (score > FLUSH_VALUE) return score;
    if (otherScore > FLUSH_VALUE) return 0;
    
    score = canStraight0(numberOfCards, numbersRemainingObject);
    if (score > STRAIGHT_VALUE) return score;
    if (otherScore > STRAIGHT_VALUE) return 0;

    return maxSum(0, numberOfCards, numbersRemainingObject);
};

const canWedge1 = (color, number, numberOfCards, remainingCards) => {
    const offsetArrays = {
        3: [-2, -1, 1, 2],
        4: [-3, -2, -1, 1, 2, 3]
    }

    const offsets = offsetArrays[numberOfCards];
    let sequence = 0;

    for (let i = offsets.length - 1; i >= 0; i--) {
        const card = `${color}${number + offsets[i]}`
        if (remainingCards.has(card)) {
            sequence++;
            if (sequence === numberOfCards - 1) return WEDGE_VALUE + number + Math.max(0, offsets[i + numberOfCards - 2]);
        } else sequence = 0;
        
    }
    return 0;
};

const canFlush = (currentSum, cardsNeeded, arr) => {
    if (arr.length >= cardsNeeded) {
        return FLUSH_VALUE + addValuesAtEndOfArray(currentSum, cardsNeeded, arr);
    } else return 0;
};

const canStraight1 = (number, numberOfCards, numbersRemainingObject) => {
    const offsetArrays = {
        3: [-2, -1, 1, 2],
        4: [-3, -2, -1, 1, 2, 3]
    }

    const offsets = offsetArrays[numberOfCards];
    let sequence = 0;

    for (let i = offsets.length - 1; i >= 0; i--) {
        const currentNumber = number + offsets[i];
        if (numbersRemainingObject[currentNumber] && numbersRemainingObject[currentNumber] >= 1) {
            sequence++;
            if (sequence === numberOfCards - 1) return STRAIGHT_VALUE + Math.max(number, currentNumber);
        } else sequence = 0;
    }

    return STRAIGHT_VALUE;
};

const maxSum = (currentSum, numbersToAdd, numbersRemainingObject) => {
    let bestSum = currentSum;
    for (const number of NUMBERS_ARRAY) {
        const occurrences = Math.min(numbersRemainingObject[number], numbersToAdd);
        bestSum += occurrences * number;
        numbersRemainingObject[number] -= occurrences;
        numbersToAdd -= occurrences;

        if (numbersToAdd <= 0) break;
    }
    return bestSum;
};

const oneTroopPlayed = (player, pin, remainingCards, otherScore, data) => {
    const color = data[pin][player]["cardsPlayed"][0][0];
    const number = parseInt(data[pin][player]["cardsPlayed"][0].slice(1));

    const numberOfCards = data[pin]["tacticsPlayed"].includes("Mud") ? 4 : 3;

    let score = 0;

    score = canWedge1(color, number, numberOfCards, remainingCards);

    if (score > WEDGE_VALUE) return score;
    if (otherScore > WEDGE_VALUE) return 0;

    const numbersRemainingObject = getRemainingNumbersObject(remainingCards);
    
    score = canTrips(new Set([number]), numberOfCards - 1, numbersRemainingObject);

    if (score > TRIPS_VALUE) return score;
    if (otherScore > TRIPS_VALUE) return 0;

    const numbersOfColorRemaining = getRemainingOfOneColor(color, remainingCards);

    score = canFlush(number, numberOfCards - 1, numbersOfColorRemaining);

    if (score > FLUSH_VALUE) return score;
    if (otherScore > FLUSH_VALUE) return 0;

    score = canStraight1(number, numberOfCards, numbersRemainingObject);
    if (score > STRAIGHT_VALUE) return score;
    if (otherScore > STRAIGHT_VALUE) return 0;
    
    // Just total sum;
    return maxSum(number, numberOfCards - 1, numbersRemainingObject);
};

const oneTacticPlayed = (player, pin, remainingCards, otherScore, data) => {
    const card = data[pin][player]["cardsPlayed"][0];

    const numberOfCards = data[pin]["tacticsPlayed"].includes("Mud") ? 4 : 3;
    
    const possibleNumbersArray = TACTICS[card].possibleNumbers;
    const possibleNumbersSet = new Set(possibleNumbersArray);
    const possibleColors = new Set(TACTICS[card].possibleColors);

    let score = 0;

    const remainingByColorSets = getRemainingByColorSets(remainingCards);

    for (const color of possibleColors) {
        score = Math.max(score, WEDGE_VALUE + consecutiveOneTacticNoTroops(remainingByColorSets[color], possibleNumbersSet, numberOfCards));
    }

    if (score > WEDGE_VALUE) return score;
    if (otherScore > WEDGE_VALUE) return 0;

    const numbersRemainingObject = getRemainingNumbersObject(remainingCards);

    score = canTrips(possibleNumbersSet, numberOfCards - 1, numbersRemainingObject);

    if (score > TRIPS_VALUE) return score;
    if (otherScore > TRIPS_VALUE) return 0;

    const remainingByColorArrays = getRemainingByColorArrays(remainingCards);

    for (const color of possibleColors) {
        score = Math.max(score, canFlush(possibleNumbersArray[0], numberOfCards - 1, remainingByColorArrays[color]));
    }

    if (score > FLUSH_VALUE) return score;
    if (otherScore > FLUSH_VALUE) return 0;

    const troopNumbersRemainingSet = getTroopNumbersRemaining(numbersRemainingObject);

    score = STRAIGHT_VALUE + consecutiveOneTacticNoTroops(troopNumbersRemainingSet, possibleNumbersSet, numberOfCards);

    if (score > STRAIGHT_VALUE) return score;
    if (otherScore > STRAIGHT_VALUE) return 0;

    return maxSum(possibleNumbersArray[0], numberOfCards - 1, numbersRemainingObject);
};

const straightTwoNeeded = (largestNumber, numArr, remainingNumberSet) => {
    for (let i = numArr.length - 1; i >= 1; i--) {
        if (remainingNumberSet.has(numArr[i]) && remainingNumberSet.has(numArr[i - 1])) return Math.max(largestNumber, numArr[i]);
    }
    return 0;
};

const twoTroopsPlayed = (player, pin, remainingCards, otherScore, data) => {
    const cardsPlayed = data[pin][player]["cardsPlayed"];
    const colors = cardsPlayed.map(card => card[0]);
    const numbers = cardsPlayed.map(card => parseInt(card.slice(1))).sort((a, b) => a - b);
    const numberSum = numbers[0] + numbers[1];

    const numberOfCards = data[pin]["tacticsPlayed"].includes("Mud") ? 4 : 3;

    const trips = numbers[0] === numbers[1];
    const flush = colors[0] === colors[1];
    const gutStraight = numbers[0] + 2 === numbers[1];
    const openStraight = numbers[0] + 1 === numbers[1];

    const mudStraightArray = numberOfCards === 4 && (
        openStraight ? [numbers[0] - 2, numbers[0] - 1, numbers[1] + 1, numbers[1] + 2] :
        gutStraight ? [numbers[0] - 1, numbers[0] + 1, numbers[1] + 1] :
        numbers[0] + 3 === numbers[1] ? [numbers[0] + 1, numbers[1] - 1] :
        null);

    const colorArray = getRemainingOfOneColor(colors[0], remainingCards);

    if (numberOfCards === 3) {
        if (flush && openStraight) {
            if (remainingCards.has(`${colors[0]}${numbers[1] + 1}`)) return WEDGE_VALUE + numbers[1] + 1;
            else if (remainingCards.has(`${colors[0]}${numbers[0] - 1}`)) return WEDGE_VALUE + numbers[1];
        } else if (flush && gutStraight) {
            if (remainingCards.has(`${colors[0]}${numbers[0] + 1}`)) return WEDGE_VALUE + numbers[1];
        }
    } else if (mudStraightArray) {
        const colorSet = new Set(colorArray);
        const score = WEDGE_VALUE + straightTwoNeeded(numbers[1], mudStraightArray, colorSet);
        if (score > WEDGE_VALUE) return score;
    }

    if (otherScore > WEDGE_VALUE) return 0;
    
    const numbersRemainingObject = getRemainingNumbersObject(remainingCards);

    if (trips) {
        if (numbersRemainingObject[numbers[0]] && numbersRemainingObject[numbers[0]] >= numberOfCards - 2) return TRIPS_VALUE + numbers[0];
    }

    if (otherScore > TRIPS_VALUE) return 0;

    if (flush) {
        if (colorArray.length >= numberOfCards - 2) return FLUSH_VALUE + addValuesAtEndOfArray(numberSum, numberOfCards - 2, colorArray);
    }

    if (otherScore > FLUSH_VALUE) return 0;

    if (numberOfCards === 3) {
        if (openStraight) {
            if (numbersRemainingObject[numbers[1] + 1] >= 1) return STRAIGHT_VALUE + numbers[1] + 1;
            else if (numbersRemainingObject[numbers[1] - 1] >= 1) return STRAIGHT_VALUE + numbers[1];
        } else if (gutStraight) {
            if (numbersRemainingObject[numbers[0] + 1] >= 1) return STRAIGHT_VALUE + numbers[1];
        }
    } else if (mudStraightArray) {
        const numbersRemainingSet = new Set(Object.keys(numbersRemainingObject).filter(key => numbersRemainingObject[key] >= 1));
        const score = STRAIGHT_VALUE + straightTwoNeeded(numbers[1], mudStraightArray, numbersRemainingSet);
        if (score > STRAIGHT_VALUE) return score;
    };
    
    if (otherScore > STRAIGHT_VALUE) return 0;

    return maxSum(numberSum, numberOfCards - 2, numbersRemainingObject);
};

const twoSetsHaveBothValues = (set1, set2, value1, value2) => {
    const hasValue1Set1 = set1.has(value1);
    const hasValue2Set1 = set1.has(value2);
    
    const hasValue1Set2 = set2.has(value1);
    const hasValue2Set2 = set2.has(value2);

    return (
        (hasValue1Set1 && hasValue2Set2) ||
        (hasValue2Set1 && hasValue1Set2)
    );
};

const oneTroopOneTacticPlayed = (player, pin, remainingCards, otherScore, data) => {
    const cardsPlayed = data[pin][player]["cardsPlayed"];
    const tactic = cardsPlayed[0][0] === 't' ? cardsPlayed[0] : cardsPlayed[1];
    const troop = cardsPlayed[0][0] !== 't' ? cardsPlayed[0] : cardsPlayed[1];

    const color = troop[0];
    const number = parseInt(troop.slice(1));

    const numberOfCards = data[pin]["tacticsPlayed"].includes("Mud") ? 4 : 3;

    const mudConsecArray = numberOfCards === 4 && [number - 3, number - 2, number - 1, number + 1, number + 2, number + 3];

    const possibleNumbersArray = TACTICS[tactic].possibleNumbers;
    const possibleNumbersSet = new Set(possibleNumbersArray);
    const possibleColors = new Set(TACTICS[tactic].possibleColors);

    const numbersOfColorRemainingArray = getRemainingOfOneColor(color, remainingCards);
    const numbersOfColorRemainingSet = new Set(numbersOfColorRemainingArray);

    if (numberOfCards === 3 && possibleColors.has(color)) {
        if (twoSetsHaveBothValues(numbersOfColorRemainingSet, possibleNumbersSet, number + 1, number + 2)) return WEDGE_VALUE + number + 2;
        else if (twoSetsHaveBothValues(numbersOfColorRemainingSet, possibleNumbersSet, number - 1, number + 1)) return WEDGE_VALUE + number + 1;
        else if (twoSetsHaveBothValues(numbersOfColorRemainingSet, possibleNumbersSet, number - 2, number - 1)) return WEDGE_VALUE + number;
    } else if (mudConsecArray && possibleColors.has(color)) {
        const straightScore = consecutiveOneTacticWithBounds(numbersOfColorRemainingSet, possibleNumbersSet, numberOfCards, mudConsecArray);
        if (straightScore > 0) return WEDGE_VALUE + Math.max(number, straightScore);
    }

    if (otherScore > WEDGE_VALUE) return 0;

    const numbersRemainingObject = getRemainingNumbersObject(remainingCards);

    if (possibleNumbersSet.has(number)) {
        if (numbersRemainingObject[number] && numbersRemainingObject[number] >= numberOfCards - 2) return TRIPS_VALUE + number;
    }

    if (otherScore > TRIPS_VALUE) return 0;

    if (possibleColors.has(color)) {
        if (numbersOfColorRemainingArray.length >= numberOfCards - 2) return FLUSH_VALUE + addValuesAtEndOfArray(number + possibleNumbersArray[0], numberOfCards - 2, numbersOfColorRemainingArray);
    }

    if (otherScore > FLUSH_VALUE) return 0;

    const numbersRemainingSet = new Set(Object.keys(numbersRemainingObject).filter(key => numbersRemainingObject[key] >= 1));

    if (numberOfCards === 3) {
        if (twoSetsHaveBothValues(numbersRemainingSet, possibleNumbersSet, number + 1, number + 2)) return STRAIGHT_VALUE + number + 2;
        else if (twoSetsHaveBothValues(numbersRemainingSet, possibleNumbersSet, number - 1, number + 1)) return STRAIGHT_VALUE + number + 1;
        else if (twoSetsHaveBothValues(numbersRemainingSet, possibleNumbersSet, number - 2, number - 1)) return STRAIGHT_VALUE + number;
    } else if (mudConsecArray) {
        const straightScore = consecutiveOneTacticWithBounds(numbersRemainingSet, possibleNumbersSet, numberOfCards, mudConsecArray);
        if (straightScore > 0) return STRAIGHT_VALUE + Math.max(number, straightScore);
    }

    if (otherScore > STRAIGHT_VALUE) return 0;

    return maxSum(number + possibleNumbersArray[0], numberOfCards - 2, numbersRemainingObject);
};

const twoTacticsPlayed = (player, pin, remainingCards, otherScore, data) => {
    const cardsPlayed = data[pin][player]["cardsPlayed"];
    const tactic1 = cardsPlayed[0];
    const tactic2 = cardsPlayed[1];

    const numberOfCards = data[pin]["tacticsPlayed"].includes("Mud") ? 4 : 3;

    const possibleNumbersArray1 = TACTICS[tactic1].possibleNumbers;
    const possibleNumbersSet1 = new Set(possibleNumbersArray1);
    const possibleColors1 = new Set(TACTICS[tactic1].possibleColors);

    const possibleNumbersArray2 = TACTICS[tactic2].possibleNumbers;
    const possibleNumbersSet2 = new Set(possibleNumbersArray2);
    const possibleColors2 = new Set(TACTICS[tactic2].possibleColors);

    const commonColors = new Set();
    possibleColors1.forEach(color => {
        if (possibleColors2.has(color)) {
            commonColors.add(color);
        }
    });

    const remainingByColorSets = getRemainingByColorSets(remainingCards);

    let score = 0;

    for (const color of commonColors) {
        score = Math.max(score, WEDGE_VALUE + consecutiveTwoTacticsNoTroops(remainingByColorSets[color], possibleNumbersSet1, possibleNumbersSet2, numberOfCards));
    }

    if (score > WEDGE_VALUE) return score;
    if (otherScore > WEDGE_VALUE) return 0;

    const numbersRemainingObject = getRemainingNumbersObject(remainingCards);

    const commonNumbers = new Set();
    possibleNumbersSet1.forEach(number => {
        if (possibleNumbersSet2.has(number)) {
            commonNumbers.add(number);
        }
    });

    score = canTrips(commonNumbers, numberOfCards - 2, numbersRemainingObject);

    if (score > TRIPS_VALUE) return score;
    if (otherScore > TRIPS_VALUE) return 0;

    const remainingByColorArrays = getRemainingByColorArrays(remainingCards);

    for (const color of commonColors) {
        score = Math.max(score, canFlush(possibleNumbersArray1[0] + possibleNumbersArray2[0], numberOfCards - 2, remainingByColorArrays[color]));
    }

    if (score > FLUSH_VALUE) return score;
    if (otherScore > FLUSH_VALUE) return 0;

    const numbersRemainingSet = new Set(Object.keys(numbersRemainingObject).filter(key => numbersRemainingObject[key] >= 1));

    score = STRAIGHT_VALUE + consecutiveTwoTacticsNoTroops(numbersRemainingSet, possibleNumbersSet1, possibleNumbersSet2, numberOfCards);

    if (score > STRAIGHT_VALUE) return score;
    if (otherScore > STRAIGHT_VALUE) return 0;

    return maxSum(possibleNumbersArray1[0] + possibleNumbersArray2[0], numberOfCards - 2, numbersRemainingObject);
};

export const findMissingNumbersForStraight = (numbersMissing, arr) => {
    if (numbersMissing === 1) {
        for (let i = 0; i < arr.length; i++) {
            if (arr[i] + 1 !== arr[i + 1]) return arr[i] + 1; // returns an integer
        };
        console.error("Problem finding missing number for straight.")
        return false;
    } else if (numbersMissing === 2) {
        // This is intended to work for Mud, not a regular 3-card hand;
        const gapBetweenNumbers = arr[1] - arr[0];
        if (gapBetweenNumbers === 3) return [arr[0] + 1, arr[0] + 2]; // returns an array
        else if (gapBetweenNumbers === 2) return [arr[0] - 1, arr[0] + 1, arr[0] + 3];
        else if (gapBetweenNumbers === 1) return [arr[0] - 2, arr[0] - 1, arr[1] + 1, arr[1] + 2];
        else {
            console.error("Problem finding missing number for straight.")
            return false;
        }
    }
};

const oneTacticRestTroops = (player, pin, data) => {
    // This function is designed to work for any number of cards three or greater in cardPlayed;
    // i.e. it works for 3 or 4 cards, which accounts for Mud.
    const cardsPlayed = data[pin][player]["cardsPlayed"];

    const troopsArray = cardsPlayed.filter(card => card[0] !== 't');
    const troopColors = troopsArray.map(card => card[0]);
    const troopNumbers = troopsArray.map(card => parseInt(card.slice(1))).sort((a, b) => a - b);
    const troopSum = troopNumbers.reduce((sum, number) => sum + number, 0);

    const tacticArray = cardsPlayed.filter(card => card[0] === 't');
    const tactic = tacticArray[0];

    const possibleNumbersArray = TACTICS[tactic].possibleNumbers;
    const possibleNumbersSet = new Set(possibleNumbersArray);
    const possibleColors = new Set(TACTICS[tactic].possibleColors);

    const trips = troopNumbers.every(number => number === troopNumbers[0]);
    const flush = troopColors.every(color => color === troopColors[0]);
    
    const openStraight = troopNumbers.every((number, index) => index === 0 || number === troopNumbers[index - 1] + 1);
    const possibleGutStraight = troopNumbers[troopNumbers.length - 1] - troopNumbers[0] === troopNumbers.length;
    const uniqueNumbers = new Set(troopNumbers).size === troopNumbers.length;
    const gutStraight = possibleGutStraight && uniqueNumbers;
    const missingNumberForStraight = gutStraight && findMissingNumbersForStraight(1, troopNumbers);
    
    const highestNumber = troopNumbers[troopNumbers.length - 1];
    const oneMore = possibleNumbersSet.has(highestNumber + 1) && highestNumber + 1; // integer or false
    const oneLess = possibleNumbersSet.has(troopNumbers[0] - 1); // boolean

    const hasFlushColor = flush && possibleColors.has(troopColors[0]);
    const hasMissingNumberForStraight = possibleNumbersSet.has(missingNumberForStraight);

    if (flush && openStraight && hasFlushColor) {
        if (oneMore) return WEDGE_VALUE + oneMore;
        else if (oneLess) return WEDGE_VALUE + highestNumber;
    }
    else if (flush && gutStraight && hasFlushColor && hasMissingNumberForStraight) return WEDGE_VALUE + highestNumber;
    else if (trips && possibleNumbersSet.has(troopNumbers[0])) return TRIPS_VALUE + troopNumbers[0];

    if (flush && hasFlushColor) return FLUSH_VALUE + troopSum + possibleNumbersArray[0];

    if (openStraight && oneMore) return STRAIGHT_VALUE + oneMore;
    else if (openStraight && oneLess) return STRAIGHT_VALUE + highestNumber;
    else if (gutStraight && hasMissingNumberForStraight) return STRAIGHT_VALUE + highestNumber;

    return troopSum + possibleNumbersArray[0];
};

const oneTroopTwoTactics = (player, pin, data) => {
    const cardsPlayed = data[pin][player]["cardsPlayed"];
    const troopArray = cardsPlayed.filter(card => card[0] !== 't');
    const color = troopArray[0][0];
    const number = parseInt(troopArray[0].slice(1));

    const tacticArray = cardsPlayed.filter(card => card[0] === 't');

    const possibleNumbersArray1 = TACTICS[tacticArray[0]].possibleNumbers;
    const possibleNumbersSet1 = new Set(possibleNumbersArray1);
    const possibleColors1 = new Set(TACTICS[tacticArray[0]].possibleColors);

    const possibleNumbersArray2 = TACTICS[tacticArray[1]].possibleNumbers;
    const possibleNumbersSet2 = new Set(possibleNumbersArray2);
    const possibleColors2 = new Set(TACTICS[tacticArray[1]].possibleColors);

    const flush = possibleColors1.has(color) && possibleColors2.has(color);
    const trips = possibleNumbersSet1.has(number) && possibleNumbersSet2.has(number);
    const straightPlus2 = twoSetsHaveBothValues(possibleNumbersSet1, possibleNumbersSet2, number + 1, number + 2);
    const straightPlus1 = twoSetsHaveBothValues(possibleNumbersSet1, possibleNumbersSet2, number - 1, number + 1);
    const straight = twoSetsHaveBothValues(possibleNumbersSet1, possibleNumbersSet2, number - 2, number - 1);

    if (flush && straightPlus2) return WEDGE_VALUE + number + 2;
    else if (flush && straightPlus1) return WEDGE_VALUE + number + 1;
    else if (flush && straight) return WEDGE_VALUE + number;
    else if (trips) return TRIPS_VALUE + number;
    else if (flush) return FLUSH_VALUE + number + possibleNumbersArray1[0] + possibleNumbersArray2[0];
    else if (straightPlus2) return STRAIGHT_VALUE + number + 2;
    else if (straightPlus1) return STRAIGHT_VALUE + number + 1;
    else if (straight) return STRAIGHT_VALUE + number;
    else return number + possibleNumbersArray1[0] + possibleNumbersArray2[0];
};

const consecutiveOneTacticNoTroops = (troopSet, tacticSet, numberOfCards) => {
    for (let currentNumber = 10; currentNumber >= numberOfCards; currentNumber--) {
        if (!troopSet.has(currentNumber) && !tacticSet.has(currentNumber)) continue;
        let tacticNeeded = false;
        let tacticUsed = false;
        for (let offset = 0; offset <= numberOfCards - 1; offset++) {
            const smallerNumber = currentNumber - offset;
            if (!troopSet.has(smallerNumber) && !tacticSet.has(smallerNumber)) break;
            else if (!troopSet.has(smallerNumber)) {
                if (tacticNeeded) break;
                else {
                    tacticNeeded = true;
                    tacticUsed = true;
                };
            } else if (tacticSet.has(smallerNumber)) tacticUsed = true;
            if (offset === numberOfCards - 1 && tacticUsed) return currentNumber;
        }
    }
    return 0;
};

const consecutiveOneTacticWithBounds = (troopSet, tacticSet, numberOfCards, consecArray) => {
    for (let i = consecArray.length - 1; i >= numberOfCards - 2; i--) {
        const currentNumber = consecArray[i];
        if (!troopSet.has(currentNumber) && !tacticSet.has(currentNumber)) continue;
        let tacticNeeded = false;
        let tacticUsed = false;
        for (let offset = 0; offset <= numberOfCards - 2; offset++) {
            const smallerNumber = currentNumber - offset;
            if (!troopSet.has(smallerNumber) && !tacticSet.has(smallerNumber)) break;
            else if (!troopSet.has(smallerNumber)) {
                if (tacticNeeded) break;
                else {
                    tacticNeeded = true;
                    tacticUsed = true;
                };
            } else if (tacticSet.has(smallerNumber)) tacticUsed = true;
            if (offset === numberOfCards - 2 && tacticUsed) return currentNumber;
        }
    }
    return 0;
};

const consecutiveTwoTacticsNoTroops = (troopSet, tacticSet1, tacticSet2, numberOfCards) => {
    for (let currentNumber = 10; currentNumber >= numberOfCards - 1; currentNumber--) {
        if (!troopSet.has(currentNumber) && !tacticSet1.has(currentNumber) && !tacticSet2.has(currentNumber)) continue;
        let tactic1Needed = false;
        let tactic1Used = false;
        let tactic2Needed = false;
        let tactic2Used = false;
        for (let offset = 0; offset <= numberOfCards - 1; offset++) {
            const smallerNumber = currentNumber - offset;
            if (!troopSet.has(smallerNumber) && !tacticSet1.has(smallerNumber) && !tacticSet2.has(smallerNumber)) break;
            else if (!troopSet.has(smallerNumber))
                if (!tacticSet1.has(smallerNumber)) {
                    if (tactic2Needed) break;
                    else {
                        tactic2Needed = true;
                        tactic2Used = true;
                    }
                } else if (!tacticSet2.has(smallerNumber)) {
                    if (tactic1Needed) break;
                    else {
                        tactic1Needed = true;
                        tactic1Used = true;
                };
            } 
            
            if (tacticSet1.has(smallerNumber)) tactic1Used = true;
            if (tacticSet2.has(smallerNumber)) tactic2Used = true;

            if (offset === numberOfCards - 1 && tactic1Used && tactic2Used) return currentNumber;
        }
    }
    return 0;
};

const consecutiveTwoTacticsWithBounds = (troopSet, tacticSet1, tacticSet2, numberOfCards, consecArray) => {
    for (let i = consecArray.length - 1; i >= numberOfCards - 2; i--) {
        const currentNumber = consecArray[i];
        if (!troopSet.has(currentNumber) && !tacticSet1.has(currentNumber) && !tacticSet2.has(currentNumber)) continue;
        let tactic1Needed = false;
        let tactic1Used = false;
        let tactic2Needed = false;
        let tactic2Used = false;
        for (let offset = 0; offset <= numberOfCards - 1; offset++) {
            const smallerNumber = currentNumber - offset;
            if (!troopSet.has(smallerNumber) && !tacticSet1.has(smallerNumber) && !tacticSet2.has(smallerNumber)) break;
            else if (!troopSet.has(smallerNumber))
                if (!tacticSet1.has(smallerNumber)) {
                    if (tactic2Needed) break;
                    else {
                        tactic2Needed = true;
                        tactic2Used = true;
                    }
                } else if (!tacticSet2.has(smallerNumber)) {
                    if (tactic1Needed) break;
                    else {
                        tactic1Needed = true;
                        tactic1Used = true;
                };
            } 
            
            if (tacticSet1.has(smallerNumber)) tactic1Used = true;
            if (tacticSet2.has(smallerNumber)) tactic2Used = true;

            if (offset === numberOfCards - 1 && tactic1Used && tactic2Used) return currentNumber;
        }
    }
    return 0;
};

const addValuesAtEndOfArray = (currentSum, numbersNeeded, arr) => {
    let sum = currentSum;
    for (let i = arr.length - numbersNeeded; i < arr.length; i++) {
        sum += arr[i];
    }
    return sum;
};

const getTroopNumbersRemaining = (numbersRemainingObject) => {
    const troopSet = new Set();

    for (const key of Object.keys(numbersRemainingObject)) {
        if (numbersRemainingObject[key] >= 1) {
            troopSet.add(key);
        }
    };

    return troopSet;
};