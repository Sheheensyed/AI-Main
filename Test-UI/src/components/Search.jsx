import React, { useContext, useState } from 'react'
import { useNavigate } from 'react-router-dom';
import DeviceContext from '../context/Temp';
import { faXmark } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { Button, Modal } from 'react-bootstrap';
import { addCase, addNewStep, deleteSingleSteps, editSingleSteps, executeSteps, getSingleCase, mapSteps } from '../services/allApi';
import { useMappedSteps } from '../context/MappedStepContext';
import { useStepContext } from '../context/StepContext';


function Search() {
    const { device, setDevice, model, setModel } = useContext(DeviceContext)
    const navigate = useNavigate()
    const [error, setError] = useState(false)
    // const [deviceError,setDeviceError]=useState(false)

    const handleCheck = () => {
        if (!device && !model) {
            // setDeviceError(true)
            setError(!device)
            // alert('Please Select any Options')
        } else {
            setError(false)
            navigate('/lists')
        }
    }

    const isDisabled = !device && !model

    const [loading, setLoading] = useState(false)
    const [editSteps, setEditSteps] = useState('')
    const [caseId, setCaseId] = useState('');
    // const { setSteps } = useStepContext();

    const [executionResult, setExecutionResult] = useState('');
    const [showExecModal, setShowExecModal] = useState(false);
    const { setMappedSteps } = useMappedSteps();
    const [show, setShow] = useState(false);
    const [steps,setSteps]=useState('')

    const handleSaveChanges = async () => {
        try {
            const updatePromises = editSteps.map((step, index) => {
                if (step !== steps[index]) {
                    const payload = { newStep: step };
                    console.log(`📦 Sending update for step ${index}:`, payload);
                    return editSingleSteps(caseId, index, step); // Only send if edited
                }
                return null;
            });

            const results = await Promise.all(updatePromises.filter(Boolean));
            console.log("✅ Updated steps:", results);

            setSteps([...editSteps]); // Update UI after success
        } catch (error) {
            console.log("❌ Error updating step:", error);
        }

        setShow(false);
    };

    const handleClose = () => {
        setShow(false)
    };

    const handleShow = () => {
        setEditSteps([...steps])
        setShow(true)
    };


    const [userQuery, setUserQuery] = useState('')
    // console.log(userQuery);

    const handleSubmit = async () => {
        setLoading(true)
        const add = {
            device: device,
            model: model,
            user_query: userQuery
        };

        try {
            console.log("Payload being sent:", add);

            const response = await addCase(add)
            if (response.status === 201) {
                console.log(`Case created :`, response.data);
                setSteps(response.data.steps)
                setCaseId(response.data._id)
                localStorage.setItem("caseId", response.data._id); // ✅ Save to localStorage
            } else {
                console.log(`Unexpected Response : `, response);
            }
        } catch (error) {
            console.log(`Error saving to backend :`, error);
        }
        finally {
            setLoading(false)
        }
    }

    const handleStepChange = (index, newValue) => {
        const updateSteps = [...editSteps]
        updateSteps[index] = newValue;
        setEditSteps(updateSteps)
    }

    const handleDeleteStep = async (index) => {
        try {
            await deleteSingleSteps(caseId, index);
            const newSteps = [...editSteps];
            newSteps.splice(index, 1);
            setEditSteps(newSteps);
        } catch (error) {
            console.log("Error deleting step:", error);
        }
    };


    const handleAddStep = async () => {
        try {
            const response = await addNewStep(caseId, { newStep: "New Step..." }); // Add an empty step
            console.log("✅ Step added:", response.data);

            // Update the UI with a new blank step
            setEditSteps(prev => [...prev, ""]);
        } catch (error) {
            console.error("❌ Error adding step:", error);
        }
    };

    const handleExecute = async () => {
        try {
            const id = caseId || localStorage.getItem("caseId");
            const cleanedSteps = steps.filter(step => step.trim() !== "");

            const response = await mapSteps(id, cleanedSteps);

            if (response.data && response.data.case_id) {
                const updatedCase = await getSingleCase(response.data.case_id); // 👈 fetch updated case
                setCaseId(updatedCase._id);
                setMappedSteps(updatedCase.mapped_steps); // 👈 set from fresh data
                // navigate('/mapped');
            }
        } catch (error) {
            console.log(error);
        }
    };

    return (
        <>
            <div className='d-flex vh-100 w-100 justify-content-center align-items-center flex-column'>

                <div className='border border-2 m-0 p-3 w-50 rounded-5' >
                    <h3 className='text-center fw-bold'>Device Configuration</h3>

                    <h5 className='mt-4'>Select Device Under Test (DUT) <span className='text-danger'>*</span> </h5>

                    <select className={`form-select ${error ? 'border border-danger border-2' : device ? 'border border-primary border-1' : ''}`} value={device} onChange={(e) => { setDevice(e.target.value); if (e.target.value) { setError(false) } }} style={{
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
                    {/* 
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
                    </select> */}

                    {/* <button className={`btn ${isDisabled ? 'btn-secondary' : 'btn-primary'} w-100 my-2`} >Run Saved Script</button> */}
                    {/* <button className={`btn ${isDisabled ? 'btn-secondary' : 'btn-primary'} w-100 mt-2'`} onClick={handleCheck}>Continue to Test Generation</button> */}


                    {/* <div className='mt-3'>
                        <h5>Your Selections</h5>

                        <div className='d-flex'>
                            <div className=''>Device : {device || 'Not Selected'} </div>
                            <div className='mx-5'> Model : {model || 'Not Selected'} </div>
                        </div>
                    </div> */}

                </div>

                {/* <div className='d-flex justify-content-center align-items-center vh-100 w-100 flex-column'> */}
                {/* <p className=''>  <strong>Selected Device :</strong> {device}</p> */}
                {/* <p className=''><strong>Selected Model :</strong> {model}</p> */}
                <div className='text-center w-50 my-3'>
                    <textarea type="text" name="" placeholder='Enter Input' className='form-control' onChange={(e) => { setUserQuery(e.target.value) }} />
                    <button className='btn btn-success mx-3 my-3 px-5' onClick={handleSubmit}>Generate</button>
                </div>

                {steps?.length > 0 ?
                    <div className='border border-2 w-75 p-3'>
                        <h5 className='text-center'>Steps to Generate The Automation</h5>

                        <ol>
                            {steps.map((item, index) => (
                                <li className='text-center' key={index}> {item} </li>
                            ))
                            }
                        </ol>

                        <div className='d-flex justify-content-center align-items-center'>
                            <button className='btn btn-warning' onClick={handleShow}>Edit</button>
                            <button className='btn btn-success mx-3' onClick={handleExecute}>Build</button>
                        </div>
                    </div>
                    :
                    <div>
                        {/* <h3 className='text-center'>Step Not Available Yet!</h3> */}
                    </div>
                }

                {loading &&
                    <div className="flex justify-center items-center mt-4">
                        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
                        <span className="ml-2 text-blue-600">Generating...</span>
                    </div>
                }

                {/* </div> */}

                {/* Edit */}
                <Modal show={show} onHide={handleClose}>
                    <Modal.Header closeButton>
                        <Modal.Title>Edit Steps</Modal.Title>
                    </Modal.Header>
                    <Modal.Body>
                        <ul>
                            {
                                Array.isArray(editSteps) && editSteps?.map((item, index) => (
                                    <li className='text-center d-flex align-items-center my-3' key={index}>
                                        <input type="text" className='form-control' value={item} onChange={(e) => { handleStepChange(index, e.target.value) }} />
                                        <FontAwesomeIcon className='text-danger mx-2' onClick={(() => handleDeleteStep(index))} style={{ cursor: 'pointer' }} icon={faXmark} />
                                    </li>
                                ))

                            }

                        </ul>
                        <div className='d-flex justify-content-center'>
                            <button className='btn btn-primary' onClick={handleAddStep}>
                                Add Step
                            </button>


                        </div>
                    </Modal.Body>
                    <Modal.Footer>
                        <Button variant="secondary" onClick={handleClose}>
                            Close
                        </Button>
                        <Button variant="primary" onClick={handleSaveChanges}>
                            Save Changes
                        </Button>
                    </Modal.Footer>
                </Modal>

                {/* Execute */}
                <Modal show={showExecModal} onHide={() => setShowExecModal(false)}>
                    <Modal.Header closeButton>
                        <Modal.Title>Execution Result</Modal.Title>
                    </Modal.Header>
                    <Modal.Body>
                        <p>{executionResult}</p>
                    </Modal.Body>
                    <Modal.Footer>
                        <Button variant="secondary" onClick={() => setShowExecModal(false)}>
                            Close
                        </Button>
                    </Modal.Footer>
                </Modal>


            </div>
        </>
    )
}

export default Search