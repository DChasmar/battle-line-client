import React, { useContext } from 'react'
import { AppContext } from "../App";
import OpponentHandCard from './OpponentHandCard';

function OpponentHand() {
    const { gameData } = useContext(AppContext);
    // Check if gameData is defined before mapping over it
    if (!gameData || !gameData["player2HandConcealed"]) {
        console.log("No game data for the OpponentHand.");
        return null; // or return a loading indicator or an empty div
    }

    const hand = gameData["player2HandConcealed"]

    return (
        <div>
            <div className='player2-hand' key={"player2Hand"}>
                {hand.map((cardValue, index) => (
                    <OpponentHandCard key={index} cardValue={cardValue} player2Hand />
                ))}
            </div>
        </div>
    )
}

export default OpponentHand