import React, { useContext } from 'react'
import { AppContext } from "../App";
import Card from './Card';

function OpponentHand() {
    const { gameData } = useContext(AppContext);
    // Check if gameData is defined before mapping over it
    if (!gameData || !gameData["player2HandConcealed"]) {
        return null; // or return a loading indicator or an empty div
    }

    const hand = gameData["player2HandConcealed"]

    return (
        <div>
            <div className='player2-hand' key={"player2Hand"}>
                {hand.map((cardValue, index) => (
                    <Card key={index} cardValue={cardValue} player2Hand />
                ))}
            </div>
        </div>
    )
}

export default OpponentHand