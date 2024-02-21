import './App.css';
import React, { useState, createContext, useEffect } from "react";
import Board from './components/Board'
import { initializeGameData, handlePlayer2ClaimPins, handlePlayer2PlayCard, handlePlayer2DrawCard, checkGameOver, resetGame } from './utils';
import PlayerHand from './components/PlayerHand';
import Decks from './components/Decks';

export const AppContext = createContext();

function App() {
  const [gameData, setGameData] = useState({});
  const [cardToPlay, setCardToPlay] = useState("");

  useEffect(() => {
    const newGameData = initializeGameData()
    setGameData(newGameData)
  // eslint-disable-next-line
  }, []);

  useEffect(() => {
    if (gameData && gameData["nextAction"]) {
        if (gameData["nextAction"] === 'player2Play') {
            const newGameData = handlePlayer2PlayCard(handlePlayer2ClaimPins(gameData));
            setGameData(newGameData);
        } else if (gameData["nextAction"] === 'player2Draw') {
            const newGameData = handlePlayer2DrawCard(gameData);
            setGameData(newGameData);
        }
    }
  // eslint-disable-next-line
  }, [gameData && gameData["nextAction"]]);

  useEffect(() => {
    if (gameData && gameData["claimed"]) {
      const winner = checkGameOver(gameData);
      console.log("The winner is...", winner);
      if (winner) {
        console.log("That's game over.");
        alert(`${winner} wins!`);
        resetGame(winner, setGameData);
      }
    }
    // eslint-disable-next-line
  }, [gameData && gameData["claimed"], gameData]);

  // useEffect(() => {
  //   console.log(gameData)
  // }, [gameData]);

  return (
    <div className="App">
      <AppContext.Provider
        value={{
          gameData,
          setGameData,
          cardToPlay, 
          setCardToPlay
        }}>
      <h2> Battle Line </h2>
      <div>
        <Board />
        <div style = {{display: 'flex', flexDirection: 'row', justifyContent: 'center'}}>
          <PlayerHand />
          <Decks />
        </div>
      </div>
      </AppContext.Provider>
    </div>
  );
}

export default App;
