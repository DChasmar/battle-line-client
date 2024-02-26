// eslint-disable-next-line
import React, { useContext } from 'react';
import { AppContext } from "../App";
// eslint-disable-next-line
import { CARD_COLORS, COLORS_SET, TACTICS } from '../constants'
import { playCard, updateNextAction, chooseCardToPlay } from '../utils';

function Card({ cardValue, player1Hand, player2Hand, player, pin }) {
    const { gameData, setGameData, cardToPlay, setCardToPlay } = useContext(AppContext);

    if (!gameData || !Object.keys(gameData).length) {
      console.log("No game data for the Card.")
      return null; // or return a loading indicator or an empty div
    }

    // Extract color and number from the cardValue
    const color = cardValue[0] || "";
    let number = parseInt(cardValue.slice(1)) || "";

    // Dynamically assign styles
    let styles;
    const placementPlayable = (cardToPlay["troop"] || cardToPlay["tacticColor"]) && !cardValue && player === 'player1' && gameData["player1PinsPlayable"]['troop'].has(pin);
    const canPlayTactic = gameData["tacticsPlayed"].player1 <= gameData["tacticsPlayed"].player2;
    const readyToSteal = cardToPlay["tacticSteal"] && color === 'T';
    const readyToSwap = cardToPlay["tacticSwap"];
    const readyToSwitch = cardToPlay["tacticSwitch"];
    const wantNewTroops = cardToPlay["tacticNewTroops"];

    if (player2Hand) {
      styles = {
        backgroundColor: CARD_COLORS[color],
        cursor: readyToSteal ? 'pointer' : 'default',
      };
    } else if (cardValue in TACTICS) {
      // number = TACTICS[cardValue].name;
      styles = {
        backgroundColor: CARD_COLORS[color],
        cursor: player1Hand || (cardToPlay["troop"] && player === 'player1') ? 'pointer' : 'default',
        color: cardValue === cardToPlay["troop"] ? 'white' : 'black',
      };
    } else if (color in CARD_COLORS) {
      styles = {
        backgroundColor: CARD_COLORS[color],
        cursor: player1Hand || (cardToPlay["troop"] && player === 'player1') ? 'pointer' : 'default',
        color: cardValue === cardToPlay["troop"] ? 'white' : 'black',
        // border: placementPlayable ? '2px solid grey' : '2px solid black'
      };
    } else {
        console.log("Error reading card color.");
    }

    const handleClick = () => {
      if (gameData["nextAction"] !== 'player1Play') return;
      // Manage selection of tactic cards
      if (player1Hand) {
        if (COLORS_SET.has(color)) chooseCardToPlay(cardValue, setCardToPlay);
        else if (color === 't' && canPlayTactic) chooseCardToPlay(cardValue, setCardToPlay);
      } else if (placementPlayable) {
        const newData = updateNextAction(playCard(player, pin, cardToPlay["troop"], gameData));
        setGameData(newData);
        setCardToPlay("", setCardToPlay);
      }
    };

    return (
        <div
          className='card'
          style={styles}
          onClick={handleClick}
        >
            {number !== 0 ? number : ""}
        </div>
    );
}

export default Card;