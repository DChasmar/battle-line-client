import { COLORS_SET, COLOR_REFERENCE, TACTICS } from '../constants'

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
    };

    // Remove the card from the cardsPlayed array using filter
    newData[pin][playerDiscarded]["cardsPlayed"] = cardsPlayed.filter((playedCard) => playedCard !== card);
    newData["discardedCards"].push(card);
    newData["tacticsPlayed"][player].add(TACTICS[tacticUsed].name);
    newData["used"].add(tacticUsed);
    newData[`${player}Hand`].delete(tacticUsed);

    const color = COLORS_SET.has(card[0]) ? COLOR_REFERENCE[card[0]] : card[0] === 't' ? TACTICS[card].name : "Error finding card value";
    const cardName = COLORS_SET.has(card[0]) ? `${parseInt(card.slice(1))} ${color}` : color;

    const nextEventMessage = { description: `Player ${player.slice(-1)} used Tactic ${TACTICS[tacticUsed].name} to discard ${cardName} from Flag ${pin[3]}.` }

    newData["events"].push(nextEventMessage);

    return newData;
};

const findKeyByTacticName = (tacticsObject, tacticName) => {
    for (const key in tacticsObject) {
        if (tacticsObject[key].name === tacticName) {
            return key;
        }
    }
    // Return null if tacticName is not found
    return null;
};

export const handleRemoveChangePinTactic = (player, pin, tacticUsed, tacticNameToRemove, data) => {
    const newData = { ...data };

    if (!player || !pin || !tacticUsed || !tacticNameToRemove) {
        console.log(player, pin, tacticUsed);
        console.log("Error in handleRemoveChangePinTactic");
        return;
    };

    // Remove the card from the cardsPlayed array using filter
    newData[pin]["tacticsPlayed"] = newData[pin]["tacticsPlayed"].filter(tactic => tactic !== tacticNameToRemove);
    const tacticCard = findKeyByTacticName(TACTICS, tacticNameToRemove);
    newData["discardedCards"].push(tacticCard);
    newData["tacticsPlayed"][player].add(TACTICS[tacticUsed].name);
    newData["used"].add(tacticUsed); // Should I not add tactics to used?
    newData[`${player}Hand`].delete(tacticUsed);

    const nextEventMessage = { description: `Player ${player.slice(-1)} used Tactic ${TACTICS[tacticUsed].name} to discard ${tacticNameToRemove} from Flag ${pin[3]}.` }

    newData["events"].push(nextEventMessage);

    return newData;
};

export const handleRedeploy = (player, tacticUsed, cardRedeployData, destinationPin, data) => {
    const newData = { ...data };

    if (!cardRedeployData.card || !cardRedeployData.pin) {
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
    newData["tacticsPlayed"][player].add(TACTICS[tacticUsed].name);
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
    newData["tacticsPlayed"][player].add(TACTICS[tacticUsed].name);
    newData["used"].add(tacticUsed);
    newData[`${player}Hand`].delete(tacticUsed);

    const color = COLORS_SET.has(card[0]) ? COLOR_REFERENCE[card[0]] : card[0] === 't' ? TACTICS[card].name : "Error finding card value";
    const cardName = COLORS_SET.has(card[0]) ? `${parseInt(card.slice(1))} ${color}` : color;

    const nextEventMessage = { description: `Player ${player.slice(-1)} used Tactic ${TACTICS[tacticUsed].name} to steal ${cardName} from Flag ${pin[3]} and add it to Flag ${destinationPin[3]}.` }

    newData["events"].push(nextEventMessage);

    return newData;
};

export const handleReturnCardToTopOfDeck = (player, card, data) => {
    const newData = { ...data };
    
    const tactic = card[0] === "t";

    if (tactic) newData["tacticDeckTop"].push(card);
    else newData["troopDeckTop"].push(card);
    newData[`${player}Hand`].delete(card);

    const nextEventMessage = { description: `Player ${player.slice(-1)} returned a ${tactic ? "Tactic" : "Troop"} Card to the top of the deck.` };

    newData["events"] = [...data["events"], nextEventMessage];

    return newData;
};

export const handleRemoveScoutFromHand = (player, card, data) => {
    data[`${player}Hand`].delete(card);
    data['used'].add(card);
    data["tacticsPlayed"][player].add("Scout");

    return data;
};

export const handleMud = (player, pin, card, data) => {
    const newData = { ...data };
    newData[pin]["tacticsPlayed"].push("Mud");

    data[`${player}Hand`].delete(card);
    data['used'].add(card);
    newData["tacticsPlayed"][player].add("Mud");

    const nextEventMessage = { description: `Player ${player.slice(-1)} played Mud on Flag ${pin[3]}.` };

    newData["events"] = [...data["events"], nextEventMessage];

    return newData
};

export const handleFog = (player, pin, card, data) => {
    const newData = { ...data };
    newData[pin]["tacticsPlayed"].push("Fog");

    data[`${player}Hand`].delete(card);
    data['used'].add(card);
    newData["tacticsPlayed"][player].add("Fog");

    const nextEventMessage = { description: `Player ${player.slice(-1)} played Fog on Flag ${pin[3]}.` };

    newData["events"] = [...data["events"], nextEventMessage];

    return newData
};