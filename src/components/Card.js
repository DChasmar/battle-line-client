// eslint-disable-next-line
import React, { useContext } from 'react';
import { AppContext } from "../App";
import { CARD_COLORS } from '../constants'
import { playCard, updateNextAction } from '../utils';

function Card({ cardValue, player1Hand, player, pin }) {
    const { gameData, setGameData, cardToPlay, setCardToPlay } = useContext(AppContext);
    // Extract color and number from the cardValue
    const color = cardValue.charAt(0) || "";
    const number = parseInt(cardValue.substring(1)) || "";

    // Dynamically assign styles
    const styles = {
      backgroundColor: CARD_COLORS[color],
      cursor: player1Hand || (cardToPlay && player === 'player1') ? 'pointer' : 'default',
      color: cardValue === cardToPlay ? 'white' : 'black'
    }

    const handleClick = () => {
      if (gameData["nextAction"] !== 'player1Play') return;
  
      if (player1Hand) {
          setCardToPlay(cardValue);
      } else if (cardToPlay && player === 'player1' && !gameData["claimed"][pin]) {
          const newData = updateNextAction(playCard(player, pin, cardToPlay, gameData));
          setGameData(newData);
          setCardToPlay("");
      }
    };

    return (
        <div
          className='card'
          style={styles}
          onClick={handleClick}
        >
            {number}
        </div>
    );
}

export default Card;