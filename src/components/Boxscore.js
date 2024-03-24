import React, { useContext } from 'react'
import { AppContext } from "../App";
import BigCard from './BigCard';
import Card from './Card';
import { WORD_COLORS } from '../constants';

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
                        {event.description.split(' ').map((word, i) => (
                            <span key={i} 
                            style={{ color: WORD_COLORS[word] ? WORD_COLORS[word] : 'white' }}>
                                {word + ' '}
                            </span>
                        ))}
                    </div>
                ))}
            </div>
            <div>
                {cardToPlay && cardToPlay[0] === 't' ? (
                    <BigCard />
                ) : (
                    <div>
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
                        <div>
                        {(gameData["tacticsPlayed"].player1.size > 0 || gameData["tacticsPlayed"].player2.size > 0) && (
                            <h4 style={{textDecoration: 'underline'}} >Tactics Played:</h4>
                        )}
                        {gameData["tacticsPlayed"].player1.size > 0 && (
                            <p>
                                Player 1: {Array.from(gameData["tacticsPlayed"].player1).map((tactic, index) => (
                                    <span key={index}>{`${tactic}${index < (gameData["tacticsPlayed"].size - 1) ? ', ' : ''}`} </span>
                                ))}
                            </p>
                        )}
                        {gameData["tacticsPlayed"].player2.size > 0 && (
                            <p>
                                Player 2: {Array.from(gameData["tacticsPlayed"].player2).map((tactic, index) => (
                                    <span key={index}>{tactic} </span>
                                ))}
                            </p>
                        )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}

export default Boxscore