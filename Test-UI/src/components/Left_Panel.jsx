import React, { useState } from 'react'
import Badge from 'react-bootstrap/Badge';
import Button from 'react-bootstrap/Button';
import { useCaseContext } from '../context/CaseContext';

function Left_Panel() {
    const { mappedSteps, query, count, steps } = useCaseContext()
    const { active, setActive } = useCaseContext()
    // const [isFocused, setIsFocused] = useState(false);
    console.log(mappedSteps);



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
            <div className="p-3 border-end mt-3" style={{ height: '717.5px', overflowY: 'auto' }}>

                <div className='d-flex justify-content-center'>
                    <Button
                        variant=""
                        className="d-flex align-items-center mt-3 px-5"
                        style={{
                            height: '45px',
                            // display: 'inline-flex',
                            boxSizing: 'border-box',
                            letterSpacing: '0.05857em',
                            boxShadow: 'rgba(0, 0, 0, 0.2) 0px 3px 1px -2px, rgba(0, 0, 0, 0.14) 0px 2px 2px 0px, rgba(0, 0, 0, 0.12) 0px 1px 5px 0px',
                            color: 'white',
                            fontSize: '1em',
                            outline: 0,
                            border: 'none',
                            // transition: 'background-color 250ms cubic-bezier(0.4, 0, 0.2, 1), box-shadow 250ms cubic-bezier(0.4, 0, 0.2, 1), border-color 250ms cubic-bezier(0.4, 0, 0.2, 1), color 250ms cubic-bezier(0.4, 0, 0.2, 1)',
                            background: 'linear-gradient(135deg,rgba(51, 191, 255)-26.55%,rgba(93, 92, 229)93.75%)',
                            // background:'rgba(51, 145, 255, 1)',
                            // background:'rgba(0, 88, 191, 1)',
                            // background:'rgba(140, 201, 255, 1)',
                            borderRadius: '8px',
                        }}
                    >
                        <h5 className="mb-0 me-2" style={{ fontWeight: 600 }}>Generated Steps</h5>
                        <Badge bg="white" className='text-dark mt-1'>{mappedSteps.length}</Badge>
                    </Button>

                </div>

                <div className=''>
                    {/* <p className='text-muted my-3 mx-2' style={{ textAlign: 'justify' }}><small><em>This automation workflow will authenticate with the system, fetch user data, process it according to your criteria, send notifications to active users, and generate a comprehensive report of the entire process.</em></small></p> */}

                    {/* <input type="text" value={query} readOnly onFocus={() => setIsFocused(true)} onBlur={() => setIsFocused(false)} className="form-control my-5 text-center shadow-sm w-75 m-auto" style={{
                        border: '2px solid transparent', borderRadius: '8px', padding: '3px 1px', backgroundImage:
                            'linear-gradient(white, white), linear-gradient(-45deg, rgb(108, 110, 233), rgba(100, 93, 227, 0.75), rgb(0, 140, 255), rgb(0, 183, 255))', backgroundOrigin: 'border-box', backgroundClip: 'content-box, border-box', animation: 'input 5s ease infinite alternate', backgroundSize: '200% 100%', transition: 'box-shadow 0.3s ease, transform 0.3s ease', boxShadow: isFocused ? '0 0 10px #00ffff' : 'none', transform: isFocused ? 'scale(1.03)' : 'scale(1)'
                    }}
                    /> */}
                    <div className='d-flex flex-column my-2'>
                        <span className='mt-3 ms-4 mb-1'>User Query:</span>
                        <div className='d-flex justify-content-center'>
                            <input
                                type="text"
                                value={`${query}`}
                                readOnly
                                className="form-control mb-3 text-center"
                                style={{
                                    boxShadow: "#8CC9FF 0px 0px 0.15em, #8CC9FF 0px 0.15em 0.5em",
                                    width: '300px'
                                }}
                            />
                        </div>
                    </div>



                    {/* <p className='text-secondary text-center' style={{ border: '0.5px solid transparent', borderRadius: '8px', padding: '1px 1px', backgroundImage: 'linear-gradient(white, white), linear-gradient(-45deg,rgb(108, 110, 233),rgba(100, 93, 227, 0.75),rgb(0, 140, 255),rgb(0, 183, 255))', backgroundOrigin: 'border-box', backgroundClip: 'content-box, border-box', animation: 'anime 2s linear infinite alternate', backgroundSize: '200% 200%' }}>User-Query : <span className='text-primary'>{query}</span> </p> */}
                </div>
                <div className='me-4'>

                    <ol >
                        {mappedSteps.length ? mappedSteps.map((mStep, index) => (
                                <div key={index || mStep._id} className=' my-2 border p-2 rounded-3 d-flex'>
                                    <span className='bg-dark text-white rounded-2 d-flex justify-content-center align-items-center me-2' style={{
                                        //  borderRadius: '50%',
                                        width: '25px', height: '25px', boxSizing: 'border-box',
                                        letterSpacing: '0.05857em',
                                        boxShadow: 'rgba(0, 0, 0, 0.2) 0px 3px 1px -2px, rgba(0, 0, 0, 0.14) 0px 2px 2px 0px, rgba(0, 0, 0, 0.12) 0px 1px 5px 0px',
                                        color: 'white',
                                        fontSize: '15px',
                                        outline: 0,
                                        border: 'none',
                                        transition: 'background-color 250ms cubic-bezier(0.4, 0, 0.2, 1), box-shadow 250ms cubic-bezier(0.4, 0, 0.2, 1), border-color 250ms cubic-bezier(0.4, 0, 0.2, 1), color 250ms cubic-bezier(0.4, 0, 0.2, 1)',
                                        background: 'linear-gradient(135deg,rgba(51, 191, 255)-26.55%,rgba(93, 92, 229)93.75%',
                                        borderRadius: '8px',
                                    }}>{index + 1}</span>
                                    <strong className='ms-2'></strong>
                                    {mStep.step}
                                </div>
                            // <div className='d-flex flex-column my-2'>
                            //     <div className='d-flex justify-content-center'>
                            //         <input
                            //             type="text"
                            //             value={`${query}`}
                            //             readOnly
                            //             className="form-control mb-3 text-center"
                            //             style={{
                            //                 // boxShadow: "#8CC9FF 0px 0px 0.15em, #8CC9FF 0px 0.15em 0.5em",
                            //             }}
                            //         />
                            //     </div>
                            // </div>

                            // <li className='d-flex justify-content-center align-items-center' >
                            //     {/* <span>{index+1}</span> */}
                            //      <input readOnly type="text" className='form-control w-75 py-1 text-capitalize text-center my-3 border border-2' value={mStep.step} name="" key={index} id="" style={{
                            //         border: '2px solid transparent', borderRadius: '8px', padding: '3px 1px', backgroundImage:
                            //             'linear-gradient(white, white), linear-gradient(-45deg, rgb(108, 110, 233), rgba(100, 93, 227, 0.75), rgb(0, 140, 255), rgb(0, 183, 255))', backgroundOrigin: 'border-box', backgroundClip: 'content-box, border-box', animation: 'input 5s ease infinite alternate', backgroundSize: '200% 100%', transition: 'box-shadow 0.3s ease, transform 0.3s ease'
                            //     }} />

                            // </li>
                        )
                        ) : <p className='text-center'>No mapped steps available.</p>}
                    </ol>

                </div>
            </div>

        </>
    )
}

export default Left_Panel
