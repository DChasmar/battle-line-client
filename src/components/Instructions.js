// eslint-disable-next-line
import React, { useContext, useState } from 'react';
import { AppContext } from '../App'

function Instructions() {
    // eslint-disable-next-line
    const { toggleInstructions } = useContext(AppContext);

    return (
        <div>Instructions</div>
    )
}

export default Instructions