// eslint-disable-next-line
import React, { useState, useContext, useEffect } from 'react';
import { AppContext } from "../App";
// eslint-disable-next-line
import { selectTroopCard, updateNextAction } from '../utils';

function DeckCard() {
    const { gameData, setGameData } = useContext(AppContext);

    // Dynamically assign styles
    const styles = {
      backgroundColor: '#888',
      fontSize: '9px',
      justifyContent: 'center',
      cursor: 'pointer'
    }

    const handleClick = () => {
        if (gameData["nextAction"] !== 'player1Draw') return;
    
        const newData = updateNextAction(selectTroopCard('player1', gameData));
        setGameData(newData);
    };

    return (
        <div
          className='card'
          style={styles}
          onClick={handleClick}
        >
            Troop
            Cards
        </div>
    );
}

export default DeckCard;