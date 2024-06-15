import React, { useContext } from 'react';
import { AppContext } from "../App";
import DeckCard from './DeckCard';

function Decks() {
    const { gameData } = useContext(AppContext);
    
    if (!gameData || !Object.keys(gameData).length) {
        console.log("Decks not working.")
        return null; // or return a loading indicator or an empty div
    }

    return (
        <div style = {{display: 'flex', flexDirection: 'row', margin: '10px'}}>
            {(gameData.troopCards.size > 0 || gameData.troopDeckTop.length > 0) && <DeckCard troop />}
            {(gameData.tacticCards.size > 0 || gameData.tacticDeckTop.length > 0) && <DeckCard tactic />}
        </div>
    )
}

export default Decks