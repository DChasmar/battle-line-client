import React, { useContext } from 'react'
import Pin from './Pin';
import Decks from './Decks';
import PlayerHand from './PlayerHand';
import OpponentHand from './OpponentHand';
import GameOver from './GameOver';
import { AppContext } from "../App";
import { TACTICS } from '../constants'
import { handleDiscard, updateNextAction } from '../utils'

function Board() {
    const { gameData, setGameData, cardToPlay, setCardToPlay, cardToTactic, setCardToTactic } = useContext(AppContext);

    if (!gameData || !Object.keys(gameData).length) {
        console.log("No gameData for the Board.")
        return null; // or return a loading indicator or an empty div
    }

    const pinKeys = Object.keys(gameData).filter(key => key.startsWith('pin'));

    const tacticsMayDiscard = new Set(["Deserter", "Redeploy"]);

    const discard = cardToPlay && cardToPlay in TACTICS && tacticsMayDiscard.has(TACTICS[cardToPlay].name) && Object.keys(cardToTactic).length > 0;

    const handleDiscardClick = () => {
        const newData = updateNextAction(handleDiscard("player1", cardToPlay, cardToTactic, gameData));
        setGameData(newData);
        setCardToPlay("");
        setCardToTactic({});
    };

    return (
        <div className='board'>
            <OpponentHand />
            <div className='board-pins'>
                {pinKeys.map(pin => (
                    <div key={pin}>
                        <Pin pinData={gameData[pin]} pin={pin} />
                    </div>
                ))}
            </div>
            <div style = {{display: 'flex', flexDirection: 'row', justifyContent: 'center'}}>
                <PlayerHand />
                <Decks />
                {discard && (
                <button
                className='claim-button'
                style={{ height: "50px", margin: "12px" }}
                onClick={handleDiscardClick}>
                    Discard
                </button>
                )}
            </div>
            {gameData.gameOver && <GameOver />}
        </div>
    )
}

export default Board