import React, { useContext } from 'react';
import { AppContext } from "../App";
import { selectTroopCard, selectTacticCard, updateNextAction } from '../utils';
import { CARD_COLORS, TACTICS } from '../constants';

function DeckCard( {troop, tactic} ) {
    const { gameData, setGameData, cardToPlay, cardToTactic, setCardToTactic } = useContext(AppContext);

    const scout = cardToPlay && cardToPlay in TACTICS && TACTICS[cardToPlay].name === "Scout";

    // Dynamically assign styles
    const styles = {
      backgroundColor: troop ? CARD_COLORS["T"] : tactic ? CARD_COLORS["t"] : 'white',
      fontSize: '10px',
      justifyContent: 'center',
      cursor: (gameData["nextAction"] === 'player1Draw' || scout) ? 'pointer' : 'default'
    }

    const text = troop ? "Troop" : tactic ? "Tactic" : null

    const handleClick = () => {
      if (gameData["nextAction"] !== 'player1Draw') return;
      if (troop && gameData["troopCards"].size < 1) {
        alert("There are no Troop cards left.");
        // Manage condition when there are no troops or no tactics left
        return;
      } else if (tactic && gameData["tacticCards"].size < 1) {
        alert("There are no Tactic cards left.");
        // Manage condition when there are no troops or no tactics left
        return;
      }
      if (troop) {
        const newData = updateNextAction(selectTroopCard('player1', false, gameData));
        setGameData(newData);
      } else if (tactic) {
        const newData = updateNextAction(selectTacticCard('player1', false, gameData));
        setGameData(newData);
      }
    };

    const handleScoutClick = () => {
      if (troop) {
        const newData = selectTroopCard('player1', true, gameData);
        setGameData(newData);
      } else if (tactic) {
        const newData = selectTacticCard('player1', true, gameData);
        setGameData(newData);
      }
      if (cardToTactic !== null) {
        const newCardToTactic = {
          ...cardToTactic,
          "stage": (cardToTactic["stage"] || 0) + 1
        }
        setCardToTactic(newCardToTactic);
      } else {
        setCardToTactic({ tactic: "Scout", stage: 1, });
      }
    };

    return (
      <div
        className='card'
        style={styles}
        onClick={scout ? handleScoutClick : handleClick}
      >
        {text}
      </div>
    );
}

export default DeckCard;