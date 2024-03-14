import { COLORS_ARRAY, NUMBERS_ARRAY, WEDGE_VALUE, TRIPS_VALUE, FLUSH_VALUE, STRAIGHT_VALUE, TACTICS } from '../constants'
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

const maxMudScore = (player, pin, remainingCards, otherScore, data) => {
    const fog = data[pin]["tacticsPlayed"].includes("Fog");
    if (fog) return maxFogScore(player, pin, otherScore, data);
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

    if (cardsPlayed.length === 0) {
        return noCardsPlayed(remainingCards, otherScore);
    } else if (cardsPlayed.length === 1) {
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
        remainingByColorArrays[card[0]].push(parseInt(card.slice(1)));
    });

    // Sort numbers from least to greatest
    for (const color of remainingByColorArrays) {
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

const getRemainingNumbersObject = (remainingCards) => {
    const numbersRemaining = {};
    remainingCards.forEach(card => {
        const number = parseInt(card.slice(1));
        if (numbersRemaining[number]) numbersRemaining[number]++;
        else numbersRemaining[number] = 1;
    });

    return numbersRemaining;
};

const canWedge0 = (remainingByColorSets) => {
    for (let number = 10; number >= 3; number--) {
        for (const color of COLORS_ARRAY) {
            if (remainingByColorSets[color].has(number) &&
            remainingByColorSets[color].has(number - 1) &&
            remainingByColorSets[color].has(number - 2)) {
                return WEDGE_VALUE + number;
            }
        }
    }

    return WEDGE_VALUE;
};

const canTrips0 = (numbersRemainingObject) => {
    for (let number = 10; number >= 1; number--) {
        if (numbersRemainingObject[number] >= 3) return TRIPS_VALUE + number;
    }
    return TRIPS_VALUE;
};

const canFlush0 = (remainingByColorArrays) => {
    let maxFlush = FLUSH_VALUE;

    for (const color in remainingByColorArrays) {
        if (remainingByColorArrays[color].length >= 3) {
            maxFlush = Math.max(maxFlush, remainingByColorArrays[color].slice(-3).reduce((acc, num) => acc + num, 0));
        }
    }
    return maxFlush;
};

const canStraight0 = (numbersRemainingObject) => {
    for (let number = 10; number >= 3; number--) {
        if (numbersRemainingObject[number] && numbersRemainingObject[number - 1] && numbersRemainingObject[number - 2]) {
            return STRAIGHT_VALUE + number;
        }
    }

    return STRAIGHT_VALUE;
};

const noCardsPlayed = (remainingCards, otherScore) => {
    if (remainingCards.size < 3) {
        return 0;
    }

    let score;

    const remainingByColorSets = getRemainingByColorSets(remainingCards);

    score = canWedge0(remainingByColorSets);
    if (score > WEDGE_VALUE) return score;
    if (otherScore > score) return 0;

    const numbersRemainingObject = getRemainingNumbersObject(remainingCards);

    score = canTrips0(numbersRemainingObject);
    if (score > TRIPS_VALUE) return score;
    if (otherScore > score) return 0;

    const remainingByColorArrays = getRemainingByColorArrays(remainingCards);

    score = canFlush0(remainingByColorArrays);
    if (score > FLUSH_VALUE) return score;
    if (otherScore > score) return 0;
    
    score = canStraight0(numbersRemainingObject);
    if (score > STRAIGHT_VALUE) return score;
    if (otherScore > score) return 0;

    return maxSum(0, 3, numbersRemainingObject);
};

// Mud
// Fog

const canWedge1 = (color, number, remainingCards) => {
    if (remainingCards.has(`${color}${number + 1}`) && remainingCards.has(`${color}${number + 2}`)) return WEDGE_VALUE + number + 2;
    else if (remainingCards.has(`${color}${number - 1}`) && remainingCards.has(`${color}${number + 1}`)) return WEDGE_VALUE + number + 1;
    else if (remainingCards.has(`${color}${number - 2}`) && remainingCards.has(`${color}${number - 1}`)) return WEDGE_VALUE + number;
    else return WEDGE_VALUE;
};

const canTrips1 = (number, remainingNumbersObject) => {
    if (remainingNumbersObject[number] && remainingNumbersObject[number] >= 2) return TRIPS_VALUE + number;
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

const maxSum = (currentSum, numbersToAdd, numbersRemainingObject) => {
    let max_sum = currentSum;
    for (const number of NUMBERS_ARRAY) {
        const occurrences = Math.min(numbersRemainingObject[number] || 0, numbersToAdd);
        currentSum += occurrences * number;
        numbersRemainingObject[number] -= occurrences;
        numbersToAdd -= occurrences;

        if (numbersToAdd <= 0) break;
    }
    return max_sum;
};

const oneTroopPlayed = (player, pin, remainingCards, otherScore, data) => {
    let score;
    const color = data[pin][player]["cardsPlayed"][0][0];
    const number = parseInt(data[pin][player]["cardsPlayed"][0].slice(1));

    score = canWedge1(color, number, remainingCards);
    // We return WEDGE_VALUE without any increment if there is not potential WEDGE
    if (score > WEDGE_VALUE) return score;
    if (otherScore > score) return 0;

    const numbersRemainingObject = getRemainingNumbersObject(remainingCards);
    
    score = canTrips1(number, numbersRemainingObject);
    if (score > TRIPS_VALUE) return score;
    if (otherScore > score) return 0;

    const numbersOfColorRemaining = getRemainingOfOneColor(color, remainingCards);

    score = canFlush1(number, numbersOfColorRemaining);
    if (score > FLUSH_VALUE) return score;
    if (otherScore > score) return 0;

    score = canStraight1(number, numbersRemainingObject);
    if (score > STRAIGHT_VALUE) return score;
    if (otherScore > score) return 0;
    
    // Just total sum;
    return maxSum(number, 2, numbersRemainingObject);
};

const canWedge1Any = (colorsArray, numbersSet, remainingByColorArrays) => { 
    let max_value = WEDGE_VALUE;
    for (const color of colorsArray) {
        if (remainingByColorArrays[color] && remainingByColorArrays[color].length >= 2) {
            const numbersOfColorRemaining = remainingByColorArrays[color];
            for (let i = numbersOfColorRemaining.length - 1; i >= 1; i--) {
                if (numbersOfColorRemaining[i] - numbersOfColorRemaining[i - 1] === 1) {
                    if (numbersSet.has(numbersOfColorRemaining[i] + 1)) {
                        max_value = Math.max(max_value, WEDGE_VALUE + numbersOfColorRemaining[i] + 1);
                        continue;
                    } else if (numbersSet.has(numbersOfColorRemaining[i])) {
                        max_value = Math.max(max_value, WEDGE_VALUE + numbersOfColorRemaining[i]);
                        continue;
                    }                    
                } else if (numbersOfColorRemaining[i] - numbersOfColorRemaining[i - 1] === 2 && numbersSet.has(numbersOfColorRemaining[i] - 1)) {
                    max_value = Math.max(max_value, WEDGE_VALUE + numbersOfColorRemaining[i]);
                    continue
                };
            }
        }
    }
    return max_value;
};

const canTrips1Any = (numbersArray, numbersRemainingObject) => {
    for (const number of numbersArray) {
        if (numbersRemainingObject >= 2) return TRIPS_VALUE + number;
    }
    return TRIPS_VALUE;
};

const canFlush1Any = (number, colorsArray, remainingByColorArrays) => {
    let max_flush = FLUSH_VALUE;
    for (const color of colorsArray) {
        if (remainingByColorArrays[color] >= 2) {
            max_flush = Math.max(max_flush, FLUSH_VALUE + number + remainingByColorArrays[color].slice(-2).reduce((sum, num) => sum + num, 0));
        };
    }
    return max_flush;
};

const canStraight1Any = (numbersArray, numbersRemainingObject) => {
    for (const number of numbersArray) {
        if (numbersRemainingObject[number + 1] && numbersRemainingObject[number + 2]) return STRAIGHT_VALUE + number + 2;
        else if (numbersRemainingObject[number - 1] && numbersRemainingObject[number + 1]) return STRAIGHT_VALUE + number + 1;
        else if (numbersRemainingObject[number - 2] && numbersRemainingObject[number - 1]) return STRAIGHT_VALUE + number;
    }
    return STRAIGHT_VALUE;
};

const oneTacticPlayed = (player, pin, remainingCards, otherScore, data) => {
    const card = data[pin][player]["cardsPlayed"][0];
    
    const possibleNumbersArray = TACTICS[card].possibleNumbers;
    const possibleNumbersSet = new Set(possibleNumbersArray);
    const possibleColors = new Set(TACTICS[card].possibleColors);

    let score;

    const remainingByColorArrays = getRemainingByColorArrays(remainingCards);

    score = canWedge1Any(possibleColors, possibleNumbersSet, remainingByColorArrays);

    if (score > WEDGE_VALUE) return score;
    if (otherScore > score) return 0;

    const numbersRemainingObject = getRemainingNumbersObject(remainingCards);

    score = canTrips1Any(possibleNumbersArray, numbersRemainingObject);

    if (score > TRIPS_VALUE) return score;
    if (otherScore > score) return 0;

    score = canFlush1Any(possibleNumbersArray[0], COLORS_ARRAY, remainingByColorArrays);

    if (score > FLUSH_VALUE) return score;
    if (otherScore > score) return 0;

    score = canStraight1Any(possibleNumbersSet, numbersRemainingObject);

    if (score > STRAIGHT_VALUE) return score;
    if (otherScore > score) return 0;

    return maxSum(possibleNumbersArray[0], 2, numbersRemainingObject);
};

const twoTroopsPlayed = (player, pin, remainingCards, otherScore, data) => {
    const cardsPlayed = data[pin][player]["cardsPlayed"];
    const colors = cardsPlayed.map(card => card[0]);
    const numbers = cardsPlayed.map(card => parseInt(card.slice(1))).sort((a, b) => a - b);
    const numberSum = numbers[0] + numbers[1];

    const trips = numbers[0] === numbers[1];
    const flush = colors[0] === colors[1];
    const gutStraight = numbers[0] + 2 === numbers[1];
    const openStraight = numbers[0] + 1 === numbers[1];

    if (flush && openStraight) {
        if (remainingCards.has(`${colors[0]}${numbers[1] + 1}`)) return WEDGE_VALUE + numbers[1] + 1;
        else if (remainingCards.has(`${colors[0]}${numbers[0] - 1}`)) return WEDGE_VALUE + numbers[1];
    } else if (flush && gutStraight) {
        if (remainingCards.has(`${colors[0]}${numbers[0] + 1}`)) return WEDGE_VALUE + numbers[1];
    }

    if (otherScore > WEDGE_VALUE) return 0;
    
    const numbersRemainingObject = getRemainingNumbersObject(remainingCards);

    if (trips) {
        if (numbersRemainingObject[numbers[0]] && numbersRemainingObject[numbers[0]] >= 1) return TRIPS_VALUE + numbers[0];
    }

    if (otherScore > TRIPS_VALUE) return 0;

    if (flush) {
        const colorArray = getRemainingOfOneColor(colors[0], remainingCards);
        if (colorArray.length >= 1) return FLUSH_VALUE + numberSum + colorArray[colorArray.length - 1];
    }

    if (otherScore > FLUSH_VALUE) return 0;

    if (openStraight) {
        if (numbersRemainingObject[numbers[1] + 1]) return STRAIGHT_VALUE + numbers[1] + 1;
        else if (numbersRemainingObject[numbers[1] - 1]) return STRAIGHT_VALUE + numbers[1];
    }

    if (gutStraight) {
        if (numbersRemainingObject[numbers[0] + 1]) return STRAIGHT_VALUE + numbers[1];
    }

    if (otherScore > STRAIGHT_VALUE) return 0;

    return maxSum(numberSum, 1, numbersRemainingObject);
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
}

const oneTroopOneTacticPlayed = (player, pin, remainingCards, otherScore, data) => {
    const cardsPlayed = data[pin][player]["cardsPlayed"];
    const tactic = cardsPlayed[0][0] === 't' ? cardsPlayed[0] : cardsPlayed[1];
    const troop = cardsPlayed[0][0] !== 't' ? cardsPlayed[0] : cardsPlayed[1];

    const color = troop[0];
    const number = parseInt(troop.slice(1));

    const possibleNumbersArray = TACTICS[tactic].possibleNumbers;
    const possibleNumbersSet = new Set(possibleNumbersArray);
    const possibleColors = new Set(TACTICS[tactic].possibleColors);

    const numbersOfColorRemainingArray = getRemainingOfOneColor(color, remainingCards);
    const numbersOfColorRemainingSet = new Set(numbersOfColorRemainingArray);

    if (possibleColors.has(color)) {
        if (twoSetsHaveBothValues(numbersOfColorRemainingSet, possibleNumbersSet, number + 1, number + 2)) return WEDGE_VALUE + number + 2;
        else if (twoSetsHaveBothValues(numbersOfColorRemainingSet, possibleNumbersSet, number - 1, number + 1)) return WEDGE_VALUE + number + 1;
        else if (twoSetsHaveBothValues(numbersOfColorRemainingSet, possibleNumbersSet, number - 2, number - 1)) return WEDGE_VALUE + number;
    }

    if (otherScore > WEDGE_VALUE) return 0;

    const numbersRemainingObject = getRemainingNumbersObject(remainingCards);

    if (possibleNumbersSet.has(number)) {
        if (numbersRemainingObject[number] && numbersRemainingObject[number] >= 1) return TRIPS_VALUE + number;
    }

    if (otherScore > TRIPS_VALUE) return 0;

    if (possibleColors.has(color)) {
        if (numbersOfColorRemainingArray.length >= 1) return FLUSH_VALUE + possibleNumbersArray[0] + numbersOfColorRemainingArray[numbersOfColorRemainingArray.length - 1];
    }

    if (otherScore > FLUSH_VALUE) return 0;

    const numbersRemainingSet = new Set(Object.keys(numbersRemainingObject).filter(key => numbersRemainingObject[key] >= 1));

    if (twoSetsHaveBothValues(numbersRemainingSet, possibleNumbersSet, number + 1, number + 2)) return STRAIGHT_VALUE + number + 2;
    else if (twoSetsHaveBothValues(numbersRemainingSet, possibleNumbersSet, number - 1, number + 1)) return STRAIGHT_VALUE + number + 1;
    else if (twoSetsHaveBothValues(numbersRemainingSet, possibleNumbersSet, number - 2, number - 1)) return STRAIGHT_VALUE + number;

    if (otherScore > STRAIGHT_VALUE) return 0;

    return maxSum(number + possibleNumbersArray[0], 1, numbersRemainingObject);
};

const canWedge2Any = (colorsSet1, numbersSet1, colorsSet2, numbersSet2, remainingByColorArrays) => { 
    let max_value = WEDGE_VALUE;
    for (const color of colorsSet1) {
        if (!colorsSet2.has(color)) continue;
        if (remainingByColorArrays[color] && remainingByColorArrays[color].length >= 1) {
            const numbersOfColorRemaining = remainingByColorArrays[color];
            for (let i = numbersOfColorRemaining.length - 1; i >= 0; i--) {
                if (twoSetsHaveBothValues(numbersSet1, numbersSet2, numbersOfColorRemaining[i] + 1, numbersOfColorRemaining[i] + 2)) {
                    max_value = Math.max(max_value, WEDGE_VALUE + numbersOfColorRemaining[i] + 2);
                    continue;
                } else if (twoSetsHaveBothValues(numbersSet1, numbersSet2, numbersOfColorRemaining[i] - 1, numbersOfColorRemaining[i] + 1)) {
                    max_value = Math.max(max_value, WEDGE_VALUE + numbersOfColorRemaining[i] + 1);
                    continue;
                } else if (twoSetsHaveBothValues(numbersSet1, numbersSet2, numbersOfColorRemaining[i] - 2, numbersOfColorRemaining[i] - 1)) {
                    max_value = Math.max(max_value, WEDGE_VALUE + numbersOfColorRemaining[i]);
                    continue;
                };
            }
        }
    }
    return max_value;
};

const canTrips2Any = (numbersSet1, numbersSet2, numbersRemainingObject) => {
    for (let number = 10; number >= 1; number--) {
        if (numbersSet1.has(number) && numbersSet2.has(number) && numbersRemainingObject[number] && numbersRemainingObject[number] >= 1) return TRIPS_VALUE + number;
    }
    return TRIPS_VALUE;
};

const canFlush2Any = (number1, colorSet1, number2, colorSet2, remainingByColorArrays) => {
    let max_flush = FLUSH_VALUE;
    for (const color of colorSet1) {
        if (!colorSet2.has(color) || !remainingByColorArrays[color] || remainingByColorArrays[color].length < 1) continue;
        const maxValueOfColorArray = remainingByColorArrays[color][remainingByColorArrays[color].length - 1];
        max_flush = Math.max(max_flush, FLUSH_VALUE + number1 + number2 + maxValueOfColorArray);
    }
    return max_flush;
};

const canStraight2Any = (numbersSet1, numbersSet2, numbersRemainingObject) => {
    for (let number = 10; number >= 1; number--) {
        if (!numbersRemainingObject[number] || numbersRemainingObject[number] < 1) continue;
        if (twoSetsHaveBothValues(numbersSet1, numbersSet2, number + 1, number + 2)) return STRAIGHT_VALUE + number + 2;
        else if (twoSetsHaveBothValues(numbersSet1, numbersSet2, number - 1, number + 1)) return STRAIGHT_VALUE + number + 1;
        else if (twoSetsHaveBothValues(numbersSet1, numbersSet2, number - 2, number - 1)) return STRAIGHT_VALUE + number;
    }
    return STRAIGHT_VALUE;
};

const twoTacticsPlayed = (player, pin, remainingCards, otherScore, data) => {
    const cardsPlayed = data[pin][player]["cardsPlayed"];
    const tactic1 = cardsPlayed[0];
    const tactic2 = cardsPlayed[1];

    const possibleNumbersArray1 = TACTICS[tactic1].possibleNumbers;
    const possibleNumbersSet1 = new Set(possibleNumbersArray1);
    const possibleColors1 = new Set(TACTICS[tactic1].possibleColors);

    const possibleNumbersArray2 = TACTICS[tactic2].possibleNumbers;
    const possibleNumbersSet2 = new Set(possibleNumbersArray2);
    const possibleColors2 = new Set(TACTICS[tactic2].possibleColors);

    const remainingByColorArrays = getRemainingByColorArrays(remainingCards);

    let score;
    
    score = canWedge2Any(possibleColors1, possibleNumbersSet1, possibleColors2, possibleNumbersSet2, remainingByColorArrays);

    if (score > WEDGE_VALUE) return score;
    if (otherScore > score) return 0;

    const numbersRemainingObject = getRemainingNumbersObject(remainingCards);

    score = canTrips2Any(possibleNumbersSet1, possibleNumbersSet2, numbersRemainingObject);

    if (score > TRIPS_VALUE) return score;
    if (otherScore > score) return 0;

    score = canFlush2Any(possibleNumbersArray1[0], possibleColors1, possibleNumbersArray2[0], possibleColors1, remainingByColorArrays);

    if (score > FLUSH_VALUE) return score;
    if (otherScore > score) return 0;

    score = canStraight2Any(possibleNumbersSet1, possibleNumbersSet2, numbersRemainingObject);

    if (score > STRAIGHT_VALUE) return score;
    if (otherScore > score) return 0;

    return maxSum(possibleNumbersArray1[0] + possibleNumbersArray2[0], 1, numbersRemainingObject);
};

const findMissingNumbersForStraight = (numbersMissing, arr) => {
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