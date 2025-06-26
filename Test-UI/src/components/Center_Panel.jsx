import React from 'react'
import Live_Cam from './Live_Cam';
import Console from './Console';

function Center_Panel() {
    return (
        <>

            <div  style={{height:'100%',position:'relative'}}>
                {/* Live Cam */}
                <Live_Cam />
                {/* Console Panel */}
                <Console />
            </div>

                
               

        </>
    )
}

export default Center_Panel
