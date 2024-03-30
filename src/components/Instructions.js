// eslint-disable-next-line
import React, { useContext, useState } from 'react';
import { AppContext } from '../App'
import { instructionsModalContent } from '../constants';

function Instructions() {
    // eslint-disable-next-line
    const { toggleInstructions } = useContext(AppContext);

    const close = () => {
        toggleInstructions();
    };

    return (
        <div className='instructions-modal'>
            
            <div className='instructions-content'>
                <h3>Instructions</h3>
                {instructionsModalContent}
                <button onClick={close}>Close</button>
            </div>
            
        </div>
    )
}

export default Instructions