import React from 'react'
import QAi from '../assets/Quaco AI Studio Gradiant Black Logo.png'
import { Container, Navbar } from 'react-bootstrap'
import { Link, useLocation } from 'react-router-dom'

function Header() {

    const location = useLocation();
    const isLandingPage = location.pathname === '/';

    return (
        <>
            <Navbar className="bg-body-tertiary" fixed="top" style={{ zIndex: 1 }}>
                <Container fluid className=" d-flex align-items-center justify-content-between">
                    {/* Logo Left */}
                    <Navbar.Brand className="ms-3">
                        <Link to="/">
                            <img
                                alt=""
                                src={QAi}
                                width="170"
                                height="50"
                                className=""
                            />
                        </Link>
                    </Navbar.Brand>

                    {/* Toolbar Center */}
                    {!isLandingPage && (

                        <div
                            className="position-absolute start-50 translate-middle-x d-flex justify-content-between align-items-center rounded-2"
                            id="toolbar"
                            style={{
                                height: "45px",
                                // border: '2px solid transparent',
                                // padding: '3px 1px',
                                // backgroundImage:
                                //     'linear-gradient(white, white), linear-gradient(-45deg, rgb(108, 110, 233), rgba(100, 93, 227, 0.75), rgb(0, 140, 255), rgb(0, 183, 255))',
                                // backgroundOrigin: 'border-box',
                                // backgroundClip: 'content-box, border-box',
                                // animation: 'anime 5s ease infinite alternate',
                                // backgroundSize: '200% 200%',
                                boxShadow: "#8CC9FF 0px 0px 0.15em, #8CC9FF 0px 0.15em 0.5em"
                            }}
                        >
                            <div className="mx-3">
                                <i className="bi bi-phone fs-4"></i>
                            </div>
                            <div className="mx-3">
                                <i className="bi bi-camera fs-4"></i>
                            </div>
                            <div className="mx-3">
                                <i className="bi bi-webcam fs-4"></i>
                            </div>
                        </div>
                    )
                    }

                    {/* Home Right */}
                    <Link to="/" className="me-3">
                        <button className="btn btn-outline-primary">Home</button>
                    </Link>
                </Container>
            </Navbar>
        </>
    )
}

export default Header
