import React, { useContext } from 'react';
import { AppContext } from "../App";
import { CARD_COLORS, COLORS_SET, TACTICS } from '../constants'
import { handleReturnCardToTopOfDeck, handleRemoveScoutFromHand } from '../utils'

function PlayerHandCard({ cardValue }) {
    const { gameData, setGameData, cardToPlay, setCardToPlay, cardToTactic, setCardToTactic } = useContext(AppContext);

    if (!gameData || !Object.keys(gameData).length) {
      console.log("No game data for the PlayerHandCard.")
      return null; // or return a loading indicator or an empty div
    }

    // Extract color and number from the cardValue
    const color = cardValue[0] || "";
    let number = parseInt(cardValue.slice(1)) || "";

    const troop = COLORS_SET.has(color);
    const tactic = color === 't';
    // Add condition for Darius and Alexander

    const canPlayTactic = gameData["tacticsPlayed"].player1.size <= gameData["tacticsPlayed"].player2.size;
    const selected = cardValue === cardToPlay;
    const scouting = cardToPlay in TACTICS && TACTICS[cardToPlay].name === "Scout" && cardToTactic !== null;

    const handleClick = () => {
      if (gameData["nextAction"] !== 'player1Play' || (scouting && cardToTactic.stage < 3)) return;
      if (!canPlayTactic && tactic) return;
      setCardToPlay(cardValue);
      if (cardToTactic) setCardToTactic(null);
    };

    const handleScoutClick = () => {
      if (tactic && TACTICS[cardToPlay].name === "Scout") return;
      const newCardToTactic = {
        ...cardToTactic,
        "stage": (cardToTactic["stage"] || 0) + 1
      }
      let newData;
      if (newCardToTactic.stage < 5) {
        newData = handleReturnCardToTopOfDeck("player1", cardValue, gameData);
        setCardToTactic(newCardToTactic);
      } else {
        newData = handleRemoveScoutFromHand("player1", cardToPlay, handleReturnCardToTopOfDeck("player1", cardValue, gameData));
        setCardToPlay("");
        setCardToTactic(null);
      };
      setGameData(newData);
    }

    if (cardValue in TACTICS) {
      number = TACTICS[cardValue].symbol;
    }

    return (
        <div
          className= {`card ${selected ? 'card-selected' : ''}`} 
          style={{ 
            backgroundColor: CARD_COLORS[color], 
            cursor: gameData["nextAction"] === 'player1Play' && (troop || (tactic && canPlayTactic)) && !(scouting && cardToTactic.stage < 3) ? 'pointer' : 'default'
          }}
          onClick={ scouting && cardToTactic.stage > 2 ? handleScoutClick : handleClick }
        >
          {number}
        </div>
    );
}

export default PlayerHandCard;