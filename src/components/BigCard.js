import React, { useContext } from 'react';
import { AppContext } from "../App";
import { TACTICS } from '../constants';
import Darius from '../icons/darius.svg';
import Alexander from '../icons/alexander.svg';
import CampaignCavalry from '../icons/campaign-cavalry.svg';
import ShieldBearer from '../icons/shield-bearer.svg';
import Traitor from '../icons/traitor.svg';
import Deserter from '../icons/deserter.svg';
import Fog from '../icons/fog.svg';
import Mud from '../icons/mud.svg';
import Redeploy from '../icons/redeploy.svg';
import Scout from '../icons/scout.svg';

function BigCard() {
    const { gameData, cardToPlay } = useContext(AppContext);

    if (!gameData || !Object.keys(gameData).length) {
      console.log("No game data for the BigCard.")
      return null; // or return a loading indicator or an empty div
    }

    const cardInfo = cardToPlay && cardToPlay[0] === 't' && TACTICS[cardToPlay];

    // Map card names to their corresponding icons
    const iconMap = {
        Darius,
        Alexander,
        'Campaign Cavalry': CampaignCavalry,
        'Shield Bearer': ShieldBearer,
        Traitor,
        Deserter,
        Fog,
        Mud,
        Redeploy,
        Scout,
    };

    // Convert card name to a format suitable for mapping
    const iconName = cardInfo.name;

    // Get the corresponding icon for the card
    const icon = iconMap[iconName];

    return (
        <div
          className='card card-big'
          style={{justifyContent: 'center', displayContent: 'flex', flexDirection: 'column'}}
        >
            <div>{cardInfo.name}</div>
            <img src={icon} alt={cardInfo.name} style={{ width: '100px', height: '100px', margin: '5px' }} />
            <div style={{fontSize: '10px', padding: '4px'}}>{cardInfo.description}</div>
        </div>
    );
}

export default BigCard;