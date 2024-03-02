import React, { useContext } from 'react';
import { AppContext } from "../App";
import { CARD_COLORS, COLORS_SET, TACTICS } from '../constants'

function PlayerHandCard({ cardValue }) {
    const { gameData, cardToPlay, setCardToPlay, cardToTactic, setCardToTactic } = useContext(AppContext);

    if (!gameData || !Object.keys(gameData).length) {
      console.log("No game data for the PlayerHandCard.")
      return null; // or return a loading indicator or an empty div
    }

    // Extract color and number from the cardValue
    const color = cardValue[0] || "";
    let number = parseInt(cardValue.slice(1)) || "";

    const troop = COLORS_SET.has(color);
    const tactic = color === 't';
    // Add condition for Darius and Alexander

    const canPlayTactic = gameData["tacticsPlayed"].player1.size <= gameData["tacticsPlayed"].player2.size;
    const selected = cardValue === cardToPlay;

    const handleClick = () => {
      if (gameData["nextAction"] !== 'player1Play') return;
      if (!canPlayTactic && tactic) return;
      setCardToPlay(cardValue);
      if (cardToTactic) setCardToTactic({});
    };

    if (cardValue in TACTICS) {
      number = TACTICS[cardValue].symbol;
    }

    return (
        <div
          className= {`card ${selected ? 'card-selected' : ''}`} 
          style={{ 
            backgroundColor: CARD_COLORS[color], 
            cursor: gameData["nextAction"] === 'player1Play' && (troop || (tactic && canPlayTactic)) ? 'pointer' : 'default'
          }}
          onClick={handleClick}
        >
          {number}
        </div>
    );
}

export default PlayerHandCard;