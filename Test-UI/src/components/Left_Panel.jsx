import React from 'react'
import Badge from 'react-bootstrap/Badge';
import Button from 'react-bootstrap/Button';
import { useCaseContext } from '../context/CaseContext';

function Left_Panel() {
    const { mappedSteps, query, count,steps } = useCaseContext()
    return (
        <>

            <div className="p-3 border-end" style={{ height: '100%', overflowY: 'auto' }}>
                <div>
                    <div className='d-flex justify-content-between'>
                        <h5 className='m-auto'>Generated Steps</h5>
                        <Button variant="secondary">
                            Steps <Badge bg="dark">{mappedSteps.length}</Badge>
                        </Button>
                    </div>
                    <div className='d-flex flex-column'>
                        <p className='text-muted my-3 mx-2' style={{ textAlign: 'justify' }}><small><em>This automation workflow will authenticate with the system, fetch user data, process it according to your criteria, send notifications to active users, and generate a comprehensive report of the entire process.</em></small></p>

                        <p className='text-secondary text-center'>User-Query : <span className='text-primary'>{query}</span> </p>
                    </div>
                    <ol>
                        {mappedSteps.length ? mappedSteps.map((mStep, index) => (
                            <div key={mStep._id || index} className='border mb-3 p-3 rounded-4 shadow-sm bg-light d-flex'>
                                <span className='bg-dark text-white p-1 d-flex justify-content-center align-items-center rounded-circle me-2' style={{ borderRadius: '50%', width: '30px', height: '30px' }}>{index + 1}</span>
                                <strong className='ms-1'></strong>   {mStep.step} <br />
                            </div>

                        )) : <p className='text-center'>No mapped steps available.</p>}
                    </ol>
                </div>
            </div>

        </>
    )
}

export default Left_Panel
