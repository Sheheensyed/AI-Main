import React, { useEffect, useState } from 'react';
import { getSingleCase } from '../services/allApi';
import { useParams } from 'react-router-dom';
import Badge from 'react-bootstrap/Badge';
import Button from 'react-bootstrap/Button';
import SplitPane from 'react-split-pane';
import '../styles/split-pane.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowsUpDownLeftRight, faCamera, faCrosshairs, faHand, faLightbulb, faMobile, faMobileScreenButton } from '@fortawesome/free-solid-svg-icons';
import Container from 'react-bootstrap/Container';
import Navbar from 'react-bootstrap/Navbar';
import logo from '../assets/logo-3.png.webp'

function Execute() {
    const { id: caseId } = useParams();
    const [steps, setSteps] = useState([]);
    const [mappedSteps, setMappedSteps] = useState([]);
    const [query, setQuery] = useState('');
    const [count, setCount] = useState(0);
    const [consoleHeight, setConsoleHeight] = useState(200);
    const [consoleVisible, setConsoleVisible] = useState(true);

    useEffect(() => {
        const fetchCase = async () => {
            try {
                const res = await getSingleCase(caseId);
                setSteps(res.data.steps || []);
                setCount(res.data.steps?.length || 0);
                setMappedSteps(res.data.mapped_steps || []);
                setQuery(res.data.user_query);
            } catch (error) {
                console.error('Failed to fetch case:', error);
            }
        };

        if (caseId) fetchCase();
    }, [caseId]);

    return (
        <>
            <Navbar className="bg-body-tertiary">
                <Container>
                    <Navbar.Brand href="" className='d-flex justify-content-between w-100'>
                        <img alt="" src={logo} width="100" height="30" className="d-inline-block align-top" />
                            <div className='d-flex justify-content-between align-items-center border border-2 rounded-3' id='toolbar'>
                                {/* <div className='mx-3'><FontAwesomeIcon className='text-primary' icon={faMobileScreenButton} /></div> */}
                                {/* <div className='mx-3'><FontAwesomeIcon className='text-primary' icon={faCamera} /></div> */}
                                <div className='mx-3'><i className="bi bi-phone text-primary" ></i></div>
                                <div className='mx-3'><i className="bi bi-camera text-primary" ></i></div>
                                <div className='mx-3'><i className="bi bi-webcam text-primary" ></i></div>
                            </div>

                            <div>
                                <button className='btn btn-outline-primary'>go home</button>
                            </div>
                    </Navbar.Brand>
                </Container>
            </Navbar>

            <div style={{ height: '100vh' }}>
                <SplitPane split="vertical" defaultSize="25%" minSize={200}>
                    {/* Left Panel: Generated Steps */}
                    <div className="p-3 border-end" style={{ height: '100%', overflowY: 'auto' }}>
                        <div>
                            <div className='d-flex justify-content-between'>
                                <h5 className='m-auto'>Generated Steps</h5>
                                <Button variant="secondary">
                                    Steps <Badge bg="dark">{count}</Badge>
                                </Button>
                            </div>
                            <p className='text-muted my-3 mx-2' style={{ textAlign: 'justify' }}><small><em>This automation workflow will authenticate with the system, fetch user data, process it according to your criteria, send notifications to active users, and generate a comprehensive report of the entire process.</em></small></p>

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




                    {/* Center and Right Split */}
                    <SplitPane split="vertical" defaultSize="70%" minSize={300}>
                        {/* CENTER PANEL + CONSOLE */}
                        <div style={{ position: 'relative', height: '100%' }}>
                            {/* Live Cam */}
                            <div className="p-3 text-center" style={{ height: '65%', overflow: 'hidden' }}>
                                <h5 className="mb-4">Live Cam</h5>
                                <div className="bg-dark w-100 h-100 rounded"></div>
                            </div>

                            {/* Console Panel */}
                            {consoleVisible && (
                                <div
                                    style={{
                                        position: 'absolute',
                                        bottom: 0,
                                        left: 0,
                                        right: 0,
                                        height: `${consoleHeight}px`,
                                        backgroundColor: '#1e1e1e',
                                        borderTop: '2px solid #333',
                                        zIndex: 10,
                                        color: '#d4d4d4',
                                        fontFamily: 'monospace',
                                        display: 'flex',
                                        flexDirection: 'column',
                                    }}
                                >
                                    {/* Resizer Bar */}
                                    <div
                                        style={{
                                            height: '5px',
                                            cursor: 'row-resize',
                                            background: '#555',
                                        }}
                                        onMouseDown={(e) => {
                                            const startY = e.clientY;
                                            const startHeight = consoleHeight;

                                            const onMouseMove = (e) => {
                                                const newHeight = startHeight + (startY - e.clientY);
                                                setConsoleHeight(Math.min(Math.max(newHeight, 100), 500));
                                            };

                                            const onMouseUp = () => {
                                                window.removeEventListener('mousemove', onMouseMove);
                                                window.removeEventListener('mouseup', onMouseUp);
                                            };

                                            window.addEventListener('mousemove', onMouseMove);
                                            window.addEventListener('mouseup', onMouseUp);
                                        }}
                                    />

                                    {/* Console Output */}
                                    <div style={{ flex: 1, overflowY: 'auto', padding: '1rem' }}>
                                        <h6 className="text-center" style={{ color: '#fff' }}>Console Output</h6>
                                        <pre style={{ whiteSpace: 'pre-wrap', margin: 0 }}>
                                            Connecting to robot...
                                            {"\n"}Step 1: Power on device
                                            {"\n"}Step 2: Initializing...
                                            {"\n"}Step 3: Running tests...
                                            {"\n"}✅ All systems operational.
                                        </pre>
                                    </div>
                                </div>
                            )}

                            {/* Toggle Button */}
                            <Button
                                size="sm"
                                variant="dark"
                                onClick={() => setConsoleVisible(!consoleVisible)}
                                style={{
                                    position: 'absolute',
                                    bottom: (consoleVisible ? consoleHeight + 10 : 10),
                                    right: 10,
                                    zIndex: 20,
                                }}
                            >
                                {consoleVisible ? 'Hide Console' : 'Show Console'}
                            </Button>
                        </div>

                        {/* Right Panel: Robot Framework */}
                        <div className="p-3 text-center" style={{ height: '100%', overflowY: 'auto' }}>
                            <h5 className="mb-4">Robot Framework</h5>

                            <p className='text-dark'>The generated script will appear here after the workflow is executed.</p>
                            {/* Future content */}
                        </div>
                    </SplitPane>
                </SplitPane>
            </div>

        </>
    );
}

export default Execute;
