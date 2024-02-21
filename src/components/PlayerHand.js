import React, { useContext } from 'react'
import { AppContext } from "../App";
import Card from './Card';
import { sortHand } from '../utils';

function PlayerHand() {
    const { gameData } = useContext(AppContext);
    // Check if gameData is defined before mapping over it
    if (!gameData || !gameData["player1Hand"]) {
        return null; // or return a loading indicator or an empty div
    }

    // Sort hand by color and number
    const sortedHand = sortHand([...gameData["player1Hand"]]);

    return (
        <div>
            <div className='player1-hand' key={"player1Hand"}>
            {sortedHand.map((cardValue, index) => (
                <Card key={index} cardValue={cardValue} player1Hand/>
            ))}
        </div>
        </div>
        
    )
}

export default PlayerHand