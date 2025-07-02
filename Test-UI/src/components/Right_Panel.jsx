import React from 'react'

function Right_Panel() {
    return (
        <>

            <div className="p-3 text-center mt-3" style={{ height: '65%', overflowY: 'auto' }}>
                <h5 className="mt-3">Robot Framework</h5>

                <p className='text-dark'>The generated script will appear here after the workflow is executed.</p>
                {/* Future content */}
            </div>

        </>
    )
}

export default Right_Panel
