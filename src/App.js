import './App.css';
import React, { useState, createContext, useEffect } from "react";
import Board from './components/Board'
import Prompt from './components/Prompt';
import Instructions from './components/Instructions';
import Boxscore from './components/Boxscore';
import { initializeGameData } from './utils/gamedata';
import { handlePlayer2ClaimPins, handlePlayer2PlayCard, handlePlayer2DrawCard } from './utils/computerbot'

export const AppContext = createContext();

function App() {
  const [gameData, setGameData] = useState({});
  const [cardToPlay, setCardToPlay] = useState("");
  // A State variable to handle tactic operations, such as redeploy and traitor
  const [cardToTactic, setCardToTactic] = useState(null);

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
        let newGameData = handlePlayer2ClaimPins(gameData);
        if (!newGameData.gameOver) newGameData = handlePlayer2PlayCard(newGameData);
        setGameData(newGameData);
      } else if (gameData["nextAction"] === 'player2Draw') {
        const newGameData = handlePlayer2DrawCard(gameData);
        setGameData(newGameData);
      }
    }
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
  }, [gameData]);

  // useEffect(() => {
  //   console.log(cardToPlay);
  //   console.log(cardToTactic);
  //   // eslint-disable-next-line
  // }, [cardToPlay, cardToTactic]);

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
