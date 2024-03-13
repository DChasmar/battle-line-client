import { findRemainingCards } from './gamedata'
import { updateNextAction, selectTroopCard, playCard, checkGameOver } from './gamelogic'

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