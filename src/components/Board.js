import React, { useContext } from 'react'
import Pin from './Pin';
import Decks from './Decks';
import PlayerHand from './PlayerHand';
import OpponentHand from './OpponentHand';
import GameOver from './GameOver';
import { AppContext } from "../App";
import { TACTICS, SCOUT_MESSAGES } from '../constants'
import { updateNextAction } from '../utils/gamelogic'
import { handleDiscard } from '../utils/tacticlogic'

function Board() {
    const { gameData, setGameData, cardToPlay, setCardToPlay, cardToTactic, setCardToTactic } = useContext(AppContext);

    if (!gameData || !Object.keys(gameData).length) {
        console.log("No gameData for the Board.")
        return null; // or return a loading indicator or an empty div
    }

    const pinKeys = Object.keys(gameData).filter(key => key.startsWith('pin'));

    const tacticsMayDiscard = new Set(["Deserter", "Redeploy"]);

    const discard = cardToPlay && cardToPlay in TACTICS && tacticsMayDiscard.has(TACTICS[cardToPlay].name) && cardToTactic !== null;

    const scout = cardToPlay && cardToPlay in TACTICS && TACTICS[cardToPlay].name === "Scout";
    // Show Mud and Fog once they have been applied.
    // Show four cards instead of three if mud has been applied.
    // You cannot Desert mud if either player has played a fourth card.
    // You can play mud and fog on the same pin.

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
            {scout && (<div>{SCOUT_MESSAGES[cardToTactic !== null ? cardToTactic.stage : 0]}</div>)}
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