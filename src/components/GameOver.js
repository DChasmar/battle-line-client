// eslint-disable-next-line
import React, { useContext, useState } from 'react';
import { AppContext } from '../App'
import { resetGame } from '../utils';

function GameOver() {
    // eslint-disable-next-line
    const { gameData, setGameData } = useContext(AppContext);

    const play = () => {
        resetGame(gameData["gameOver"], setGameData);
    }

    return (
        <div className='game-over-modal'>
            <div className='game-over-content'>
                <h3>{gameData["gameOver"]} wins!</h3>
                <button onClick={play}>Play Again</button>
            </div>
        </div>
    )
    }

export default GameOver