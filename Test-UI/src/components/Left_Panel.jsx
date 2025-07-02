import React from 'react'
import Badge from 'react-bootstrap/Badge';
import Button from 'react-bootstrap/Button';
import { useCaseContext } from '../context/CaseContext';

function Left_Panel() {
    const { mappedSteps, query, count, steps } = useCaseContext()
    const { active, setActive } = useCaseContext()


    return (
        <>
            <style>
                {`
  @keyframes anime {
    0%   { background-position: 0% 50%; }
  100% { background-position: 100% 50%; }
  }
`}
            </style>
            <div className="p-3 border-end mt-3" style={{ height: '100%', overflowY: 'auto' }}>
                <div>
                    <div className='d-flex justify-content-between'>
                        <h5 className='m-auto'>Generated Steps</h5>
                        <Button variant="secondary">
                            Steps <Badge bg="dark">{mappedSteps.length}</Badge>
                        </Button>
                    </div>
                    <div className='d-flex flex-column'>
                        {/* <p className='text-muted my-3 mx-2' style={{ textAlign: 'justify' }}><small><em>This automation workflow will authenticate with the system, fetch user data, process it according to your criteria, send notifications to active users, and generate a comprehensive report of the entire process.</em></small></p> */}

                        <input type="text" placeholder={`${query}`} name="" id="" readOnly className='form-control  my-5 text-center shadow-sm' style={{ border: '0.5px solid transparent', borderRadius: '8px', padding: '1px 1px', backgroundImage: 'linear-gradient(white, white), linear-gradient(-45deg,rgb(108, 110, 233),rgba(100, 93, 227, 0.75),rgb(0, 140, 255),rgb(0, 183, 255))', backgroundOrigin: 'border-box', backgroundClip: 'content-box, border-box', animation: 'anime 2s linear infinite alternate', backgroundSize: '200% 200%' }} />
                        {/* <p className='text-secondary text-center' style={{ border: '0.5px solid transparent', borderRadius: '8px', padding: '1px 1px', backgroundImage: 'linear-gradient(white, white), linear-gradient(-45deg,rgb(108, 110, 233),rgba(100, 93, 227, 0.75),rgb(0, 140, 255),rgb(0, 183, 255))', backgroundOrigin: 'border-box', backgroundClip: 'content-box, border-box', animation: 'anime 2s linear infinite alternate', backgroundSize: '200% 200%' }}>User-Query : <span className='text-primary'>{query}</span> </p> */}
                    </div>
                    <ol>
                        {mappedSteps.length ? mappedSteps.map((mStep, index) => (
                            <div key={mStep._id || index} className='border mb-3 p-3 rounded-4 shadow bg-light d-flex'>
                                <span className='bg-dark text-white p-1 d-flex justify-content-center align-items-center rounded-circle me-2' style={{ borderRadius: '50%', width: '30px', height: '30px' }}>{index + 1}</span>
                                <strong className='ms-1'></strong>   {mStep.step} 
                            </div>

                        )) : <p className='text-center'>No mapped steps available.</p>}
                    </ol>
                </div>
            </div>

        </>
    )
}

export default Left_Panel
