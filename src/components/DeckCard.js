import React, { useContext } from 'react';
import { AppContext } from "../App";
import { selectTroopCard, selectTacticCard, updateNextAction } from '../utils';
import { CARD_COLORS } from '../constants';

function DeckCard( {troop, tactic} ) {
    const { gameData, setGameData } = useContext(AppContext);

    // Dynamically assign styles
    const styles = {
      backgroundColor: troop ? CARD_COLORS["T"] : tactic ? CARD_COLORS["t"] : 'white',
      fontSize: '10px',
      justifyContent: 'center',
      cursor: gameData["nextAction"] === 'player1Draw' ? 'pointer' : 'default'
    }

    const text = troop ? "Troop" : tactic ? "Tactic" : null

    const handleClick = () => {
      if (gameData["nextAction"] !== 'player1Draw') return;
      if (troop && gameData["troopCards"].size < 1) {
        alert("There are no Troop cards left.");
        // Manage condition when there are no troops or no tactics left
      } else if (tactic && gameData["tacticCards"].size < 1) {
        alert("There are no Tactic cards left.");
        // Manage condition when there are no troops or no tactics left
      }
      if (troop) {
        const newData = updateNextAction(selectTroopCard('player1', gameData));
        setGameData(newData);
      } else if (tactic) {
        const newData = updateNextAction(selectTacticCard('player1', gameData));
        setGameData(newData);
      }
    };

    return (
      <div
        className='card'
        style={styles}
        onClick={handleClick}
      >
        {text}
      </div>
    );
}

export default DeckCard;