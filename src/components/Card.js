import React, { useContext } from 'react';
import { AppContext } from "../App";
import { CARD_COLORS, TACTICS } from '../constants'

function Card({ cardValue }) {
    const { gameData } = useContext(AppContext);

    if (!gameData || !Object.keys(gameData).length) {
      console.log("No game data for the Card.")
      return null; // or return a loading indicator or an empty div
    }

    // Extract color and number from the cardValue
    const color = cardValue[0] || "";
    let number = parseInt(cardValue.slice(1)) || "";

    if (cardValue in TACTICS) {
      number = TACTICS[cardValue].symbol;
    }

    return (
        <div
          className='card'
          style={{ 
            backgroundColor: CARD_COLORS[color]
          }}
        >
            {number !== 0 ? number : ""}
        </div>
    );
}

export default Card;