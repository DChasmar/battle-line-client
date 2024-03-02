import React, { useContext } from 'react';
import { AppContext } from "../App";
import { CARD_COLORS, COLORS_SET, TACTICS } from '../constants'
import { playCard, updateNextAction } from '../utils';

function PlayerPinCard({ cardValue, pin }) {
    const { gameData, setGameData, cardToPlay, setCardToPlay, cardToTactic, setCardToTactic } = useContext(AppContext);

    if (!gameData || !Object.keys(gameData).length) {
      console.log("No game data for the PlayerPinCard.")
      return null; // or return a loading indicator or an empty div
    }

    // Extract color and number from the cardValue
    const color = cardValue[0] || "";
    let number = parseInt(cardValue.slice(1)) || "";

    const placementPlayable = cardToPlay && COLORS_SET.has(cardToPlay[0]) && !cardValue && gameData["player1PinsPlayable"]['troop'].has(pin);
    const redeployable = cardToPlay && cardToPlay in TACTICS && TACTICS[cardToPlay].name === "Redeploy" && cardValue && !gameData[pin]["claimed"];
    const actingTraitorous = cardToPlay && cardToPlay in TACTICS && TACTICS[cardToPlay].name === "Traitor" && !cardValue && !gameData[pin]["claimed"];

    // Redeploy:
    // Determine which cards can be redeployed.
    // Once cardToRedploy is selected, provide option to discard, or a new placement for the card

    const handleClick = () => {
      if (gameData["nextAction"] !== 'player1Play') return;

      if (placementPlayable) {
        const newData = updateNextAction(playCard("player1", pin, cardToPlay, gameData));
        setGameData(newData);
        setCardToPlay("");
      } else if (redeployable) {
        setCardToTactic(cardValue);
      } else if (actingTraitorous && cardToTactic) {

      }
    };

    if (cardValue in TACTICS) {
      number = TACTICS[cardValue].symbol;
    }

    return (
        <div
          className='card'
          style={{ 
            backgroundColor: CARD_COLORS[color], 
            cursor: (placementPlayable || redeployable || actingTraitorous) ? 'pointer' : 'default' 
          }}
          onClick={handleClick}
        >
            {number}
        </div>
    );
}

export default PlayerPinCard;