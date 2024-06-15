import React, { useContext } from 'react';
import { AppContext } from '../App'
import { resetGame } from '../utils/gamedata';

function GameOver() {
    const { gameData, setGameData } = useContext(AppContext);

    const play = () => {
        resetGame(gameData["gameOver"], setGameData);
    }

    return (
        <div className='game-over-modal'>
            <div className='game-over-content'>
                <h3>{`Player ${gameData["gameOver"].slice(-1)} wins!`}</h3>
                <button onClick={play}>Play Again</button>
            </div>
        </div>
    )
    }

export default GameOver