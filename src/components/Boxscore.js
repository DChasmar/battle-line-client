import React, { useContext } from 'react'
import { AppContext } from "../App";
import BigCard from './BigCard';
import Card from './Card';

function Boxscore() {
    const { gameData, cardToPlay } = useContext(AppContext);

    if (!gameData || !Object.keys(gameData).length) {
        console.log("No gameData for the Boxscore.")
        return null; // or return a loading indicator or an empty div
    }

    return (
        <div className='boxscore'>
            <h2 style={{textDecoration: 'underline'}}>Boxscore</h2>
            <div style={{ textDecoration: 'underline', textAlign: 'center', fontWeight: '600', marginBottom: '4px' }}>Event Log</div>
            <div className='event-log'>
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
                    <div>
                    {gameData["discardedCards"].length > 0 && (
                        <div>
                        <h4 style={{textDecoration: 'underline'}} >Discarded Cards</h4>
                        <div>
                            {gameData["discardedCards"].map((card, index) => (
                            <Card key={index} cardValue={card} />
                            ))}
                        </div>
                        </div>
                    )}
                    </div>
                )}
            </div>
        </div>
    )
}

export default Boxscore