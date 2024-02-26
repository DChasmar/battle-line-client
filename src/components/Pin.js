import React, { useContext } from 'react'
import Card from './Card'
import { AppContext } from "../App";
import { checkGameOver } from '../utils';

function Pin({ pinData, pin }) {
    const { gameData, setGameData, cardToPlay } = useContext(AppContext);
    const player1CardsPlayed = pinData["player1"].cardsPlayed || [];
    const player2CardsPlayed = pinData["player2"].cardsPlayed || [];
    const claimed = gameData["claimed"][pin];

    const readyToAlterPin = cardToPlay["tacticChangePin"];

    const renderCards = (playerCardsPlayed, player) => {
        const blankCards = Array(3 - playerCardsPlayed.length).fill("");
        let filledCards = []
        if (player === "player1") {
            filledCards = playerCardsPlayed.concat(blankCards);
        } else if (player === "player2") {
            const reversedPlayerCards = playerCardsPlayed.slice().reverse();
            filledCards = blankCards.concat(reversedPlayerCards);
        }
    
        return filledCards.map((cardValue, index) => (
            <Card key={index} cardValue={cardValue} player={player} pin={pin} />
        ));
    };

    const handleClaimClick = () => {
        if (gameData["nextAction"] !== "player1Play") {
            alert("Not claimable.")
            return
        };
        if (pinData["player1"]["claimable"]) {
            const newGameData = { ...gameData };
            newGameData["claimed"][pin] = "player1";
            newGameData[pin]["claimed"] = true;
            // Remove pin from playable for tactic cards (if not a color card);
            const winner = checkGameOver(newGameData);
            if (winner) {
                newGameData["gameOver"] = winner;
                console.log(`That's game over. ${winner} wins!`);
            }
            setGameData(newGameData);
        } else alert("Not claimable.")
    }

    const playTactic = () => {
        alert("Not yet programmed");
    };

    return (
        <div className={`pin ${claimed ? `claimed-${claimed}` : ''}`}>
            <div className='cards-played'>
                {renderCards(player2CardsPlayed, 'player2')}
            </div>
            <div
            className="circle"
            style = {{
                translateY: claimed === "player1" ? '20px' : claimed === "player2" ? '-20px' : 'inherit'
            }}></div>
            <div className='cards-played'>
                {renderCards(player1CardsPlayed, 'player1')}
            </div>
            {readyToAlterPin && !pinData["claimed"] && (
                <button className='claim-button'
                style={{ cursor: claimed ? 'default' : 'pointer' }}
                onClick={playTactic}>
                    Play Tactic
                </button>
            )}
            {pinData["player1"]["claimable"] && !pinData["claimed"] && gameData["nextAction"] === "player1Play" && (
                <button className='claim-button'
                style={{ cursor: claimed ? 'default' : 'pointer' }}
                onClick={handleClaimClick}>
                    Claim
                </button>
            )}
        </div>
    )
    }

export default Pin