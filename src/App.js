import './App.css';
import React, { useState, createContext, useEffect } from "react";
import Board from './components/Board'
import { initializeGameData, handlePlayer2ClaimPins, handlePlayer2PlayCard, handlePlayer2DrawCard, checkGameOver } from './utils';
import Prompt from './components/Prompt';
// import GameOver from './components/GameOver';
import Instructions from './components/Instructions';
import Boxscore from './components/Boxscore';

export const AppContext = createContext();

function App() {
  const [gameData, setGameData] = useState({});
  const [cardToPlay, setCardToPlay] = useState("");
  // A State variable to handle tactic operations, such as redeploy and traitor
  const [cardToTactic, setCardToTactic] = useState({});

  const [claimedCount, setClaimedCount] = useState(0);

  const [showPrompt, setShowPrompt] = useState(true);
  const [showInstructions, setShowInstructions] = useState(false);

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
  }, [gameData]);

  useEffect(() => {
    let claimed = 0;
    for (const pin in gameData["claimed"]) {
      if (pin === "player1"  || pin === "player2") claimed++;
    }
    // console.log(`Claimed = ${claimed}`)
    if (claimed === claimedCount) return;

    if (gameData && gameData["claimed"]) {
      const winner = checkGameOver(gameData);
      if (winner) {
        const newData = { ...gameData };
        newData["gameOver"] = winner;
        setGameData(newData);
        console.log(`That's game over. ${winner} wins!`);
      }
    }
    setClaimedCount(claimed);
  // eslint-disable-next-line
  }, [gameData]);

  const hidePrompt = () => {
    if (!showPrompt) return;
    setShowPrompt(false);
  };

  const toggleInstructions = () => {
    if (showInstructions) setShowInstructions(false);
    else setShowInstructions(true);
  };


  useEffect(() => {
    console.log(gameData);
    console.log(`cardToPlay: ${cardToPlay}`);
    console.log(`cardToTactic: ${cardToTactic}`);
    // eslint-disable-next-line
  }, [gameData]);

  return (
    <div className="App">
      <AppContext.Provider
        value={{
          gameData,
          setGameData,
          cardToPlay, 
          setCardToPlay,
          cardToTactic, 
          setCardToTactic,
          hidePrompt,
          toggleInstructions
        }}>
      {showPrompt && <Prompt />}
      <h2> Battle Line </h2>
      <div style={{display: 'flex', flexDirection: 'row'}}>
        <Board />
        <Boxscore />
      </div>
      {showInstructions && <Instructions />}
      </AppContext.Provider>
    </div>
  );
}

export default App;
