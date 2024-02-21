import React, { useContext } from 'react'
import Pin from './Pin';
import { AppContext } from "../App";

function Board() {
    const { gameData } = useContext(AppContext);

    if (!gameData || !Object.keys(gameData).length) {
        console.log("Not working.")
        return null; // or return a loading indicator or an empty div
    }

    const pinKeys = Object.keys(gameData).filter(key => key.startsWith('pin'));

    return (
        <div>
            <div className='board-pins'>
                {pinKeys.map(pin => (
                    <div key={pin}>
                        <Pin pinData={gameData[pin]} pin={pin} />
                    </div>
                ))}
            </div>
        </div>
    )
}

export default Board