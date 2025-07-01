import React, { useContext, useEffect, useState } from 'react'
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
    const { steps, setSteps } = useStepContext();
    const [loading, setLoading] = useState(false)
    const [editSteps, setEditSteps] = useState('')
    const [caseId, setCaseId] = useState('');
    const { setMappedSteps } = useMappedSteps();
    const [show, setShow] = useState(false);
    const [showSteps, setShowSteps] = useState(false);


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
        setShowSteps(false)
        const add = {
            device: device,
            model: model,
            user_query: userQuery
        };

        if (!device) {
            setError(true)
            return;
        }
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
            setShowSteps(true)
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
                setSteps(updatedCase.steps); // 👈 just in case steps changed
                console.log("Steps from backend:", Array.isArray(response.data.steps), response.data.steps);
                setMappedSteps(updatedCase.mapped_steps); // 👈 set mapped steps
                navigate(`/lists/${response.data.case_id}`); // ✅ Go to /list after successful mapping
            }
        } catch (error) {
            console.log(error);
        }
    };

    useEffect(() => {
        setDevice('');
        setError(false)
        // localStorage.removeItem('caseId')
    }, []);
    return (
        <>
            <div className='d-flex vh-100 w-100 justify-content-center align-items-center flex-column'>

                <div className='border border-1 m-0 p-3 w-50 rounded-2' >
                    <h3 className='text-center fw-bold'>Device Configuration</h3>

                    <h5 className='mt-4'>Select Device Under Test (DUT) <span className='text-danger'>*</span> </h5>

                    <select className={`form-select ${error ? 'border border-danger border-2' : device ? 'border border-primary border-1' : ''}`} value={device} onChange={(e) => { setDevice(e.target.value); setError(false) }} style={{
                        width: "100%", padding: "8px", borderRadius: "5px", border: "1px solid #ccc", appearance: "none", // removes default arrow in some browsers
                    }}>
                        <option value="" hidden>
                            Choose a DUT Type
                        </option>
                        <option value="IPhone">Iphone</option>
                        <option value="Nothing">Nothing</option>
                        <option value="Moto">Moto</option>
                        <option value="Samsung">Samsung</option>
                    </select>


                </div>

                <form className='w-50 text-center my-3' onSubmit={(e) => { e.preventDefault(); if (device && userQuery.trim()) { handleSubmit() } }}>
                    <textarea type="text" name="" placeholder='Enter Input' className='form-control' onChange={(e) => setUserQuery(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); if (device && userQuery.trim()) { handleSubmit() } } }} />
                    <button className={`btn ${(!userQuery || !device) ? 'btn-secondary' : 'btn-success'}  mx-3 my-3 px-5 gap-2 `} disabled={!userQuery || !device || loading}>Generate</button>
                </form>

                {loading ? (
                    <div className="d-flex justify-content-center align-items-center mt-4">
                        <div className="spinner-border text-primary" role="status">
                            <span className="visually-hidden">Loading...</span>
                        </div>
                        <span className="ms-2 text-primary">Generating steps...</span>
                    </div>
                ) : steps?.length > 0 ? (
                    <div className='border border-2 w-75 p-3'>
                        <h5 className='text-center'>Steps to Generate The Automation</h5>

                        <ol>
                            {steps.map((item, index) => (
                                <li className='text-center' key={index}> {item} </li>
                            ))}
                        </ol>

                        <div className='d-flex justify-content-center align-items-center'>
                            <button className='btn btn-warning' onClick={handleShow}>Edit</button>
                            <button className='btn btn-success mx-3' onClick={handleExecute}>Build</button>
                        </div>
                    </div>
                ) : null}
                

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


            </div>
        </>
    )
}

export default Search