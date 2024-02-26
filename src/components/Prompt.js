import React, { useContext, useState } from 'react';
import { AppContext } from '../App'

function Prompt() {
    const { hidePrompt } = useContext(AppContext);
    const [promptIsVisible, setPromptIsVisible] = useState(true); // Use state to manage visibility

    const play = () => {
      setPromptIsVisible(false); // Trigger the fade-out effect
      setTimeout(() => hidePrompt(), 500);
    }

  return (
    <div className={`prompt ${promptIsVisible ? '' : 'hidden'}`}>
        <div className='icon-container'>
            <div className='icon-circle'></div>
            <div className='icon-circle'></div>
            <div className='icon-circle'></div>
            <div className='icon-circle'></div>
            <div className='icon-circle'></div>
            <div className='icon-circle'></div>
            <div className='icon-circle'></div>
            <div className='icon-circle'></div>
            <div className='icon-circle'></div>
        </div>
        
        <h1 style={{color: 'black'}}>Battle Line</h1>
        <button className="play-button" onClick={play}>
            Play
        </button>
        <button className="play-button" onClick={play}>
            Instructions
        </button>
    </div>
  );
}

export default Prompt;