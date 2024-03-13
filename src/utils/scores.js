import { COLORS_ARRAY, NUMBERS_ARRAY, NUMBERS_SET, WEDGE_VALUE, TRIPS_VALUE, FLUSH_VALUE, STRAIGHT_VALUE, TACTICS } from '../constants'
import { findRemainingCards } from './gamedata'

export const calculateScore = (player, pin, data) => {
    if (data[pin][player]["cardsPlayed"].length < 3) return;

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

const maxMudScore = (player, pin, otherScore, data) => {

};

const maxFogScore = (player, pin, otherScore, data) => {

};

export const calculateMaxScore = (player, pin, otherScore, data) => {
    const mud = data[pin]["tacticPlayed"] === "Mud";
    if (mud) return maxMudScore(player, pin, otherScore, data);
    const fog = data[pin]["tacticPlayed"] === "Fog";
    if (fog) return maxFogScore(player, pin, otherScore, data);

    const remainingCards = findRemainingCards(data["used"]);

    const cardsPlayed = data[pin][player]["cardsPlayed"];

    if (cardsPlayed.length === 0) {
        return noCardsPlayed(remainingCards, otherScore);
    } else if (cardsPlayed.length === 1) {
        if (cardsPlayed[0][0] === 't') return oneTacticPlayed(player, pin, remainingCards, otherScore, data);
        else return oneTroopPlayed(player, pin, remainingCards, otherScore, data);
    } else if (cardsPlayed.length === 2) {
        // Assign the data to a variable and use only part of it
        if (cardsPlayed[0][0] !== 't' && cardsPlayed[1][0] !== 't') return twoTroopsPlayed(player, pin, remainingCards, otherScore, data);
        else if (cardsPlayed[0][0] === 't' || cardsPlayed[1][0] === 't') return oneTroopOneTacticPlayed(player, pin, remainingCards, otherScore, data);
        else if (cardsPlayed[0][0] === 't' && cardsPlayed[1][0] === 't') return twoTacticsPlayed(player, pin, remainingCards, otherScore, data);
    } else if (cardsPlayed.length === 3) {

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

// No cardsPlayed: noCardsPlayed() √
// One Troop: oneTroop() √
// One Tactic: best hand with Tactic() √
// Two Troops: bestHandWithTwoTroops() √
// One Troop, One Tactic: start with the one troop card √
// Two Tactics: can they be together with the same color?
// Three Troops: calculateScore() 

    // Should create new functions: threeTroop, twoTroopOneTactic, oneTroopTwoTactic, threeTactics

// Two Troops, One Tactic: start with the two troop values
// One Troop, Two Tactics: start with the one troop value
// Three Tactics: return FLUSH_VALUE + 21;

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
        if (remainingByColorArrays[color] && remainingByColorArrays[color].length > 1) {
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
    const tacticName = TACTICS[card].name;

    let score;

    const remainingByColorArrays = getRemainingByColorArrays(remainingCards);

    if (tacticName === "Alexander" || tacticName === "Darius") score = canWedge1Any(COLORS_ARRAY, NUMBERS_ARRAY, remainingByColorArrays);
    else if (tacticName === "Campaign Cavalry") score = canWedge1Any(COLORS_ARRAY, [8], remainingByColorArrays);
    else if (tacticName === "Shield Bearer") score = canWedge1Any(COLORS_ARRAY, [3, 2, 1], remainingByColorArrays);

    if (score > WEDGE_VALUE) return score;
    if (otherScore > score) return 0;

    const numbersRemainingObject = getRemainingNumbersObject(remainingCards);

    if (tacticName === "Alexander" || tacticName === "Darius") score = canTrips1Any(NUMBERS_ARRAY, numbersRemainingObject);
    else if (tacticName === "Campaign Cavalry") score = canTrips1Any([8], numbersRemainingObject);
    else if (tacticName === "Shield Bearer") score = canTrips1Any([3, 2, 1], numbersRemainingObject);

    if (score > TRIPS_VALUE) return score;
    if (otherScore > score) return 0;

    if (tacticName === "Alexander" || tacticName === "Darius") score = canFlush1Any(10, COLORS_ARRAY, remainingByColorArrays);
    else if (tacticName === "Campaign Cavalry") score = canFlush1Any(8, COLORS_ARRAY, remainingByColorArrays);
    else if (tacticName === "Shield Bearer") score = canFlush1Any(3, COLORS_ARRAY, remainingByColorArrays);

    if (score > FLUSH_VALUE) return score;
    if (otherScore > score) return 0;

    if (tacticName === "Alexander" || tacticName === "Darius") score = canStraight1Any(NUMBERS_SET, numbersRemainingObject);
    else if (tacticName === "Campaign Cavalry") score = canStraight1Any(new Set([8]), numbersRemainingObject);
    else if (tacticName === "Shield Bearer") score = canStraight1Any(new Set([3, 2, 1]), numbersRemainingObject);

    if (score > STRAIGHT_VALUE) return score;
    if (otherScore > score) return 0;

    if (tacticName === "Alexander" || tacticName === "Darius") return maxSum(10, 2, numbersRemainingObject);
    else if (tacticName === "Campaign Cavalry") return maxSum(8, 2, numbersRemainingObject);
    else if (tacticName === "Shield Bearer") return maxSum(3, 2, numbersRemainingObject);
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
        const numbersOfColorRemaining = getRemainingOfOneColor(colors[0], remainingCards);
        const colorArray = numbersOfColorRemaining[colors[0]];
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

const twoTacticsPlayed = (player, pin, remainingCards, otherScore, data) => {
    // const cardsPlayed = data[pin][player]["cardsPlayed"];
    // const tactic1 = cardsPlayed[0];
    // const tactic2 = cardsPlayed[1];

    // const tacticName1 = TACTICS[tactic1].name;
    // const tacticName2 = TACTICS[tactic2].name;

    
};