// eslint-disable-next-line
import React, { useState, useContext, useEffect } from 'react';
import { AppContext } from "../App";
// eslint-disable-next-line
import DeckCard from './DeckCard';

function Decks() {
    const { gameData } = useContext(AppContext);
    
    if (!gameData || !Object.keys(gameData).length) {
        console.log("Not working.")
        return null; // or return a loading indicator or an empty div
    }

    return (
        <div style = {{display: 'flex', flexDirection: 'row', margin: '10px'}}>
            {gameData["troopCards"].size > 0 && <DeckCard troop />}
            {gameData["tacticCards"].size > 0 && <DeckCard tactic />}
        </div>
    )
}

export default Decks