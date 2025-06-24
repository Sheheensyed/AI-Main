import React, { useContext, useState } from 'react'
import { useNavigate } from 'react-router-dom';
import DeviceContext from '../context/Temp';

function Search() {
    
    const {device,setDevice,model,setModel}=useContext(DeviceContext)
    const navigate = useNavigate()
    const [error,setError]=useState(false)
    // const [deviceError,setDeviceError]=useState(false)

    const handleCheck = () => {
        if (!device && !model) {
            // setDeviceError(true)
            setError(!device)
            // alert('Please Select any Options')
        }else{
            setError(false)
            navigate('/lists')
        }
    }
    
    const isDisabled = !device && !model

    return (
        <>
            <div className='d-flex vh-100 w-100 justify-content-center align-items-center '>

                <div className='border border-2 m-0 p-3 w-50 rounded-5' >
                    <h3 className='text-center fw-bold'>Device Configuration</h3>

                    <h5 className='mt-4'>Select Device Under Test (DUT) <span className='text-danger'>*</span> </h5>

                    <select className={`form-select ${error? 'border border-danger border-2' : device ? 'border border-primary border-1' :''}`} value={device} onChange={(e) =>{ setDevice(e.target.value);if(e.target.value){setError(false)}}} style={{
                        width: "100%", padding: "8px", borderRadius: "5px", border: "1px solid #ccc", appearance: "none", // removes default arrow in some browsers
                    }}>
                        <option value="" disabled>
                            Choose a DUT Type
                        </option>
                        <option value="IPhone">Iphone</option>
                        <option value="Nothing">Nothing</option>
                        <option value="Moto">Moto</option>
                        <option value="Samsung">Samsung</option>
                    </select>

                     <h5 className='mt-4'>Select Hardware ID</h5>

                    <select className="form-select" value={model} onChange={(e) => setModel(e.target.value)} style={{
                        width: "100%", padding: "8px", borderRadius: "5px", border: "1px solid #ccc", appearance: "none", // removes default arrow in some browsers
                    }}
                    >
                        <option value="" disabled>
                            Choose Model
                        </option>
                        <option value="16 Pro">16 Pro</option>
                        <option value="15 Pro Max">15 Pro Max</option>
                        <option value="2A">2A</option>
                        <option value="5G">5G</option>
                    </select>

                    <button className={`btn ${isDisabled? 'btn-secondary' : 'btn-primary'} w-100 my-2`} >Run Saved Script</button>
                    <button className={`btn ${isDisabled? 'btn-secondary' :'btn-primary'} w-100 mt-2'`}  onClick={handleCheck}>Continue to Test Generation</button>


                <div className='mt-3'>
                    <h5>Your Selections</h5>

                    <div className='d-flex'>
                        <div className=''>Device : {device || 'Not Selected'} </div>
                        <div className='mx-5'> Model : {model || 'Not Selected'} </div>
                    </div>
                </div>

                </div>


            </div>
        </>
    )
}

export default Search