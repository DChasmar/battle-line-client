import React, { useContext } from 'react'
import { AppContext } from "../App";
import BigCard from './BigCard';
import Card from './Card';

function Boxscore() {
    const { gameData, cardToPlay } = useContext(AppContext);

    if (!gameData || !Object.keys(gameData).length) {
        console.log("No gameData for the Board.")
        return null; // or return a loading indicator or an empty div
    }

    return (
        <div className='boxscore'>
            <h2 style={{textDecoration: 'underline'}}>Boxscore</h2>
            <div className='event-log'>
                <div style={{textDecoration: 'underline', textAlign: 'center'}}>Event Log</div>
                {gameData.events.map((event, index) => (
                    <div key={index} className='event-message'>
                        {event.description}
                    </div>
                ))}
            </div>
            <div>
            {cardToPlay && cardToPlay[0] === 't' ? (
                <BigCard />
            ) : (
                gameData["cardsDiscarded"] && (
                gameData["cardsDiscarded"].map((card, index) => (
                    <Card key={index} cardValue={card} />
                ))
                )
            )}
            </div>
        </div>
    )
}

export default Boxscore