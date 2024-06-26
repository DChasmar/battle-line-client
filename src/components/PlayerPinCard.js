import React, { useContext } from 'react';
import { AppContext } from "../App";
import { CARD_COLORS, COLORS_SET, TACTICS, TACTIC_TYPES } from '../constants'
import { playCard, updateNextAction } from '../utils/gamelogic';
import { handleTraitor, handleRedeploy } from '../utils/tacticlogic';

function PlayerPinCard({ cardValue, pin }) {
    const { gameData, setGameData, cardToPlay, setCardToPlay, cardToTactic, setCardToTactic } = useContext(AppContext);

    if (!gameData || !Object.keys(gameData).length) {
      console.log("No game data for the PlayerPinCard.")
      return null; // or return a loading indicator or an empty div
    }

    const mudded = gameData[pin]["tacticsPlayed"].includes("Mud");

    // Extract color and number from the cardValue
    const color = cardValue[0] || "";
    let number = parseInt(cardValue.slice(1)) || "";

    const placementPlayable = cardToPlay && (COLORS_SET.has(cardToPlay[0]) || TACTIC_TYPES.playCard.has(TACTICS[cardToPlay].name)) && !cardValue && gameData["player1PinsPlayable"].has(pin) && !gameData[pin]['claimed'];
    const redeployable = cardToPlay && cardToPlay in TACTICS && TACTICS[cardToPlay].name === "Redeploy" && cardValue && !gameData[pin]["claimed"] && cardToTactic === null;
    const redeployPlacement = cardToPlay && cardToPlay in TACTICS && TACTICS[cardToPlay].name === "Redeploy" && !cardValue && !gameData[pin]["claimed"] && cardToTactic !== null && cardToTactic.pin !== pin;
    const actingTraitorous = cardToPlay && cardToPlay in TACTICS && TACTICS[cardToPlay].name === "Traitor" && cardToTactic !== null && !cardValue && !gameData[pin]["claimed"];

    const handleClick = () => {
      if (gameData["nextAction"] !== 'player1Play') return;

      if (placementPlayable) {
        const newData = updateNextAction(playCard("player1", pin, cardToPlay, gameData));
        setGameData(newData);
        setCardToPlay("");
        setCardToTactic(null);
      } else if (redeployable && cardToPlay && TACTICS[cardToPlay].name === "Redeploy") {
        setCardToTactic({ card: cardValue, pin: pin, player: "player1", tactic: "Redeploy" });
      } else if (actingTraitorous && cardToTactic.tactic === "Traitor") {
        const destinationPin = pin;
        const newData = updateNextAction(handleTraitor("player1", cardToPlay, cardToTactic, destinationPin, gameData));
        setGameData(newData);
        setCardToPlay("");
        setCardToTactic(null);
      } else if (redeployPlacement && cardToTactic.tactic === "Redeploy") {
        const destinationPin = pin;
        const newData = updateNextAction(handleRedeploy("player1", cardToPlay, cardToTactic, destinationPin, gameData));
        setGameData(newData);
        setCardToPlay("");
        setCardToTactic(null);
      }
    };

    if (cardValue in TACTICS) {
      number = TACTICS[cardValue].symbol;
    }

    // IF MUD, SHRINK THE HEIGHT OF EACH CARD

    return (
        <div
          className='card'
          style={{ 
            backgroundColor: CARD_COLORS[color],
            color: (cardToTactic && cardToTactic.card === cardValue) ? 'white' : 'black', 
            cursor: (placementPlayable || redeployable || redeployPlacement || actingTraitorous) ? 'pointer' : 'default',
            height: mudded ? '35px' : '50px'
          }}
          onClick={handleClick}
        >
            {number}
        </div>
    );
}

export default PlayerPinCard;