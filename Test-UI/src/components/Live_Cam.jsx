import React from 'react'

function Live_Cam() {

    const camUrl = import.meta.env.VITE_CAM_LINK
    return (
        <>
            <div className="p-3 text-center" style={{ height: '65%', overflow: 'hidden' }}>

                <div className='d-flex justify-content-center align-items-center mb-3'>

                    <button className='btn btn-dark px-4'>Execute</button>
                    <button className='btn btn-warning ms-2 px-3'>Pause</button>
                    <button className='btn btn-success px-3'>Play</button>

                    <h5 className="mb-0 text-center flex-grow-1">Live Cam</h5>
                    <div style={{ width: '20%' }}>{camUrl}</div>
                </div>
                <div className="bg-dark w-100 h-100 rounded"></div>
            </div>

        </>
    )
}

export default Live_Cam
