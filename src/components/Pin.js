import React, { useContext } from 'react'
import { AppContext } from "../App";
import PlayerPinCard from './PlayerPinCard';
import OpponentPinCard from './OpponentPinCard';
import { TACTICS, CARD_COLORS } from '../constants';
import { checkGameOver, updateNextAction } from '../utils/gamelogic';
import { handleFog, handleMud, handleRemoveChangePinTactic } from '../utils/tacticlogic';

function Pin({ pinData, pin }) {
    const { gameData, setGameData, cardToPlay, setCardToPlay } = useContext(AppContext);
    const player1CardsPlayed = pinData["player1"].cardsPlayed || [];
    const player2CardsPlayed = pinData["player2"].cardsPlayed || [];
    const claimed = gameData["claimed"][pin];

    const pinNumber = pin[3];

    const mudded = pinData["tacticsPlayed"].includes("Mud");
    const fogged = pinData["tacticsPlayed"].includes("Fog");

    const numberOfCards = mudded ? 4 : 3;

    const readyToAlterPin = !claimed && cardToPlay && cardToPlay in TACTICS && (TACTICS[cardToPlay].name === "Fog" || TACTICS[cardToPlay].name === "Mud");
    const readyToDesertPinChange = !claimed && cardToPlay && cardToPlay in TACTICS && (TACTICS[cardToPlay].name === "Deserter") && (mudded || fogged);

    let changeTactic = null;
    if (readyToAlterPin) changeTactic = TACTICS[cardToPlay].name;

    const renderCards = (playerCardsPlayed, player) => {
        const blankCards = Array(numberOfCards - playerCardsPlayed.length).fill("");
        let filledCards = []
        if (player === "player1") {
            filledCards = playerCardsPlayed.concat(blankCards);
            return filledCards.map((cardValue, index) => (
                <PlayerPinCard key={index} cardValue={cardValue} pin={pin} />
            ));
        } else if (player === "player2") {
            const reversedPlayerCards = playerCardsPlayed.slice().reverse();
            filledCards = blankCards.concat(reversedPlayerCards);
            return filledCards.map((cardValue, index) => (
                <OpponentPinCard key={index} cardValue={cardValue} pin={pin} />
            ));
        }  
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

            const nextEventMessage = { description: `Player 1 claimed Pin ${pin[3]}.` };
            newGameData["events"].push(nextEventMessage);

            const winner = checkGameOver(newGameData);
            if (winner) {
                newGameData["gameOver"] = winner;
            }
            setGameData(newGameData);
        } else alert("Not claimable.")
    }

    const playTactic = () => {
        if (changeTactic === "Mud") {
            const newData = updateNextAction(handleMud("player1", pin, cardToPlay, gameData));
            setGameData(newData);
            setCardToPlay("");
        } else if (changeTactic === "Fog") {
            const newData = updateNextAction(handleFog("player1", pin, cardToPlay, gameData));
            setGameData(newData);
            setCardToPlay("");
        }
    };

    const handleDesertFogOrMud = (str) => {
        if (!readyToDesertPinChange) return;
        let tacticNameToRemove = null;
        if (str === 'either') {
            if (mudded && (player1CardsPlayed.length === numberOfCards || player2CardsPlayed.length === numberOfCards)) {
                alert("You cannot Desert Mud if either player has played four cards already.");
                return;
            }
            tacticNameToRemove = mudded ? "Mud" : fogged ? "Fog" : null;
        } else if (str === 'both') {
            tacticNameToRemove = fogged ? "Fog" : null;
        } else console.log("Error in handleDesertFogOrMud in Pin");
        const newData = updateNextAction(handleRemoveChangePinTactic("player1", pin, cardToPlay, tacticNameToRemove, gameData));
        setGameData(newData);
        setCardToPlay("");
    };

    return (
        <div className={`pin ${claimed ? `claimed-${claimed}` : ''}`}>
            <div className='cards-played'>
                {renderCards(player2CardsPlayed, 'player2')}
            </div>
            <div className="circle-container" >
                <div
                    className="circle"
                    style={{
                        backgroundColor: mudded ? CARD_COLORS["mud"] : fogged ? CARD_COLORS["fog"] : 'red',
                        cursor: readyToDesertPinChange ? 'pointer' : 'default'
                    }}
                    onClick={() => handleDesertFogOrMud("either")}
                > {pinNumber} </div>
                { fogged && mudded && (
                    <div
                        className="circle"
                        style={{
                            backgroundColor: fogged && mudded ? CARD_COLORS["fog"] : 'red',
                            cursor: readyToDesertPinChange ? 'pointer' : 'default'
                        }}
                        onClick={() => handleDesertFogOrMud("both")}
                    > {pinNumber} </div>
                )}
            </div>
            <div className='cards-played'>
                {renderCards(player1CardsPlayed, 'player1')}
            </div>
            {readyToAlterPin && (
                <button className='claim-button'
                style={{ 
                    cursor: claimed ? 'default' : 'pointer',
                    backgroundColor: TACTICS[cardToPlay].name === "Fog" ? CARD_COLORS["fog"] : "Mud" ? CARD_COLORS["mud"] : CARD_COLORS["claim"]
                }}
                onClick={playTactic}>
                    {TACTICS[cardToPlay].name === "Fog" ? "Fog" : "Mud"}
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