import React, { useContext } from 'react';
import { AppContext } from "../App";
import { CARD_COLORS, COLORS_SET, TACTICS } from '../constants'

function OpponentPinCard({ cardValue, pin }) {
    const { gameData, cardToPlay, cardToTactic, setCardToTactic } = useContext(AppContext);

    if (!gameData || !Object.keys(gameData).length) {
      console.log("No game data for the OpponentPinCard.")
      return null; // or return a loading indicator or an empty div
    }

    // Extract color and number from the cardValue
    const color = cardValue[0] || "";
    let number = parseInt(cardValue.slice(1)) || "";

    const canSteal = cardToPlay && cardToPlay in TACTICS && TACTICS[cardToPlay].name === "Traitor" && cardValue && COLORS_SET.has(color);
    const canDesert = cardToPlay && cardToPlay in TACTICS && TACTICS[cardToPlay].name === "Deserter" && cardValue;

    const handleClick = () => {
      if (gameData["nextAction"] !== 'player1Play') return;
      if ((canSteal && cardToPlay && TACTICS[cardToPlay].name === "Traitor") || (canDesert && cardToPlay && TACTICS[cardToPlay].name === "Deserter")) {
        setCardToTactic({ card: cardValue, pin: pin, player: "player2", tactic: TACTICS[cardToPlay].name });
      }
    };

    // IF MUD, SHRINK THE HEIGHT OF EACH CARD
    
    return (
        <div
          className='card'
          style={{ 
            backgroundColor: CARD_COLORS[color],
            color: (cardToTactic && cardToTactic.card === cardValue) ? 'white' : 'black',
            cursor: (canSteal || canDesert) ? 'pointer' : 'default' 
          }}
          onClick={handleClick}
        >
            {number !== 0 ? number : ""}
        </div>
    );
}

export default OpponentPinCard;