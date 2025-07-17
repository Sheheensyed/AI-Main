import { faPlay } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import React, { useEffect } from 'react'
import * as bootstrap from 'bootstrap'

function Right_Panel() {
    useEffect(() => {
        // Initialize Bootstrap tooltips
        const tooltipTriggerList = document.querySelectorAll('[data-bs-toggle="tooltip"]')
        tooltipTriggerList.forEach(tooltipTriggerEl => {
            new bootstrap.Tooltip(tooltipTriggerEl)
        })
    }, [])
    return (
        <>

            <div className="p-3 mt-3" style={{ height: '65%', overflowY: 'auto' }}>
                <div className='d-flex align-items-center'>
                    <button type='button' data-bs-toggle='tooltip' data-bs-placement='top' title='Generate Robot Framework' className=' text-light rounded-3 mt-2' style={{ height: "30px", width: '30px', border: 'none', background: 'linear-gradient(135deg,rgba(51, 191, 255)-26.55%,rgba(93, 92, 229)93.75%)' }} ><FontAwesomeIcon icon={faPlay} className='' /></button>
                    <h5 className="mt-3 mx-2 ms-5">Robot Framework</h5>
                </div>

                <div className='border h-100'>
                    <pre>***Test Case***</pre>
                    <pre>go_to_home</pre>
                    {/* <pre>{`${response.q_HAPI_temp}`}</pre> */}
                </div>

            </div>

        </>
    )
}

export default Right_Panel
