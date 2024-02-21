// eslint-disable-next-line
import React, { useState, useContext, useEffect } from 'react';
import { AppContext } from "../App";
// eslint-disable-next-line
import DeckCard from './DeckCard';

function Decks() {
    // eslint-disable-next-line
    const { gameData, setGameData } = useContext(AppContext);
    return (
        <div style = {{display: 'flex', flexDirection: 'row'}}>
            <DeckCard />
        </div>
    )
}

export default Decks