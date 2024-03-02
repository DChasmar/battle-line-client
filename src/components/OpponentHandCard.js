import React, { useContext } from 'react';
import { AppContext } from "../App";
import { CARD_COLORS } from '../constants'

function OpponentHandCard({ cardValue }) {
    const { gameData, cardToPlay } = useContext(AppContext);

    if (!gameData || !Object.keys(gameData).length) {
      console.log("No game data for the OpponentHandCard.");
      return null; // or return a loading indicator or an empty div
    }

    // Extract color and number from the cardValue
    const color = cardValue[0] || "";

    // Dynamically assign styles
    const readyToSteal = cardToPlay["tacticSteal"] && color === 'T';

    let styles = {
        backgroundColor: CARD_COLORS[color],
        cursor: (readyToSteal && color === 't') ? 'pointer' : 'default',
    }

    const handleClick = () => {
      if (gameData["nextAction"] !== 'player1Play') return;
      if (readyToSteal && color === 't') {
        // Logic for stealing an opponent's troop card
      }
    };

    return (
        <div
          className='card'
          style={styles}
          onClick={handleClick}
        >
            {""}
        </div>
    );
}

export default OpponentHandCard;