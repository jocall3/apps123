```javascript
import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';

// --- Placeholder Components for different views ---

const Dashboard = () => (
    <div style={{ padding: '20px', flexGrow: 1 }}>
        <h2 style={{ color: '#333' }}>Project Dashboard</h2>
        <p style={{ color: '#555' }}>Manage your projects, ideas, and generated applications here.</p>
        <p style={{ color: '#555' }}>Start a new project or open an existing one.</p>
        <div style={{ marginTop: '20px' }}>
            <button style={{
                marginRight: '10px',
                padding: '10px 15px',
                backgroundColor: '#007bff',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '16px',
                transition: 'background-color 0.2s ease',
            }}>New Project</button>
            <button style={{
                padding: '10px 15px',
                backgroundColor: '#6c757d',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '16px',
                transition: 'background-color 0.2s ease',
            }}>Open Project</button>
        </div>
    </div>
);

const AppEditor = () => (
    <div style={{ padding: '20px', flexGrow: 1 }}>
        <h2 style={{ color: '#333' }}>Application Editor</h2>
        <p style={{ color: '#555' }}>This is where you design, code, and configure your applications.</p>
        <p style={{ color: '#555' }}>Features will include: visual builders, code editors, component libraries, etc.</p>
        <p style={{ color: '#888' }}><em>(Coming soon: Integrated AI coding assistant)</em></p>
    </div>
);

const AppPreview = () => (
    <div style={{ padding: '20px', flexGrow: 1 }}>
        <h2 style={{ color: '#333' }}>Application Preview / Runtime</h2>
        <p style={{ color: '#555' }}>See your generated application running live here.</p>
        <p style={{ color: '#555' }}>This area could host an iframe or dynamically render the application's components.</p>
        <div style={{
            marginTop: '20px',
            border: '1px solid #ddd',
            borderRadius: '8px',
            minHeight: '400px',
            backgroundColor: '#f9f9f9',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#aaa',
            fontSize: '1.2em',
            boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.05)'
        }}>
            Application Preview Area
        </div>
    </div>
);

const Settings = () => (
    <div style={{ padding: '20px', flexGrow: 1 }}>
        <h2 style={{ color: '#333' }}>Meta-App Settings</h2>
        <p style={{ color: '#555' }}>Configure the meta-application itself. Adjust themes, AI models, integrations, and user preferences.</p>
        <ul style={{ listStyleType: 'none', padding: 0 }}>
            <li style={{ marginBottom: '10px' }}><strong>Theme:</strong> <button style={{ marginLeft: '10px', padding: '5px 10px' }}>Dark</button><button style={{ marginLeft: '5px', padding: '5px 10px' }}>Light</button></li>
            <li style={{ marginBottom: '10px' }}><strong>AI Model:</strong> <select style={{ marginLeft: '10px', padding: '5px 10px', borderRadius: '4px' }}><option>GPT-4</option><option>Claude 3</option><option>Gemini</option></select></li>
            <li style={{ marginBottom: '10px' }}><strong>Integrations:</strong> <button style={{ marginLeft: '10px', padding: '5px 10px' }}>Connect GitHub</button></li>
        </ul>
    </div>
);

const About = () => (
    <div style={{ padding: '20px', flexGrow: 1 }}>
        <h2 style={{ color: '#333' }}>About App Weaver</h2>
        <p style={{ color: '#555' }}>App Weaver is a revolutionary meta-application designed to empower users to build, customize, and deploy other applications with unprecedented ease and flexibility.</p>
        <p style={{ color: '#555' }}>Our mission is to democratize software development, making the power of AI-assisted creation accessible to everyone.</p>
        <p style={{ color: '#555' }}>Version: 0.1.0 (Alpha)</p>
        <p style={{ color: '#555' }}>Developed by: The Meta-App Team</p>
    </div>
);

// --- Layout Components ---

const Header = ({ toggleSidebar }) => (
    <header style={{
        backgroundColor: '#282c34', // Darker header
        color: 'white',
        padding: '0 20px',
        minHeight: '60px', // Fixed height
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        boxShadow: '0 2px 5px rgba(0,0,0,0.2)',
        position: 'sticky', // Makes header sticky at the top
        top: 0,
        zIndex: 1000, // Ensure header is on top
        width: '100%',
        boxSizing: 'border-box', // Include padding in width
    }}>
        <div style={{ display: 'flex', alignItems: 'center' }}>
            <button onClick={toggleSidebar} style={{
                background: 'none',
                border: 'none',
                color: 'white',
                fontSize: '28px', // Slightly larger icon
                cursor: 'pointer',
                marginRight: '15px',
                lineHeight: 1, // For better vertical alignment
            }}>
                ☰
            </button>
            <h1 style={{ margin: 0, fontSize: '24px', fontWeight: 'bold' }}>App Weaver</h1>
        </div>
        <nav>
            <Link to="/dashboard" style={{ color: '#aaffaa', textDecoration: 'none', marginLeft: '20px', fontSize: '16px' }}>Dashboard</Link>
            <Link to="/editor" style={{ color: '#aaffaa', textDecoration: 'none', marginLeft: '20px', fontSize: '16px' }}>Editor</Link>
            <Link to="/preview" style={{ color: '#aaffaa', textDecoration: 'none', marginLeft: '20px', fontSize: '16px' }}>Preview</Link>
            <Link to="/settings" style={{ color: '#aaffaa', textDecoration: 'none', marginLeft: '20px', fontSize: '16px' }}>Settings</Link>
        </nav>
    </header>
);

const Sidebar = ({ isOpen }) => (
    <aside style={{
        width: isOpen ? '250px' : '0',
        backgroundColor: '#333', // Slightly lighter than header
        color: 'white',
        paddingTop: '20px', // Padding inside
        transition: 'width 0.3s ease-in-out',
        overflowX: 'hidden', // Hide content when collapsed
        position: 'fixed',
        top: '60px', // Below the header
        left: 0,
        height: 'calc(100% - 60px)', // Takes remaining height
        zIndex: 999, // Below header, above main content
        boxShadow: isOpen ? '2px 0 8px rgba(0,0,0,0.3)' : 'none',
        boxSizing: 'border-box',
    }}>
        {isOpen && (
            <nav style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                <h3 style={{ margin: '0 20px 20px', color: '#ccc', fontSize: '18px' }}>Workspace</h3>
                <Link to="/dashboard" style={{ color: 'white', textDecoration: 'none', padding: '12px 20px', display: 'block', transition: 'background-color 0.2s ease' }}>Dashboard</Link>
                <Link to="/editor" style={{ color: 'white', textDecoration: 'none', padding: '12px 20px', display: 'block', transition: 'background-color 0.2s ease' }}>App Editor</Link>
                <Link to="/preview" style={{ color: 'white', textDecoration: 'none', padding: '12px 20px', display: 'block', transition: 'background-color 0.2s ease' }}>App Preview</Link>
                <div style={{ borderTop: '1px solid #444', margin: '20px 0' }}></div>
                <h3 style={{ margin: '0 20px 20px', color: '#ccc', fontSize: '18px' }}>Meta-App</h3>
                <Link to="/settings" style={{ color: 'white', textDecoration: 'none', padding: '12px 20px', display: 'block', transition: 'background-color 0.2s ease' }}>Settings</Link>
                <Link to="/about" style={{ color: 'white', textDecoration: 'none', padding: '12px 20px', display: 'block', transition: 'background-color 0.2s ease' }}>About</Link>
            </nav>
        )}
    </aside>
);

const Footer = () => (
    <footer style={{
        backgroundColor: '#282c34',
        color: 'rgba(255, 255, 255, 0.7)',
        padding: '10px 20px',
        textAlign: 'center',
        minHeight: '40px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: '0 -2px 5px rgba(0,0,0,0.2)',
        zIndex: 1000,
        position: 'relative', // Ensures it stays at the bottom of the content
    }}>
        &copy; {new Date().getFullYear()} App Weaver. All rights reserved.
    </footer>
);

// --- Main WebApp Component ---

const WebApp = () => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);

    const toggleSidebar = () => {
        setIsSidebarOpen(!isSidebarOpen);
    };

    return (
        <Router>
            <div style={{
                display: 'flex',
                flexDirection: 'column',
                minHeight: '100vh',
                backgroundColor: '#f0f2f5', // Light background for the overall app
                fontFamily: 'Arial, sans-serif', // Basic font
                // Ensure no default margin/padding from body interferes
                margin: 0,
                padding: 0,
            }}>
                <Header toggleSidebar={toggleSidebar} />

                <div style={{ display: 'flex', flexGrow: 1 }}>
                    <Sidebar isOpen={isSidebarOpen} />
                    <main style={{
                        flexGrow: 1,
                        marginLeft: isSidebarOpen ? '250px' : '0', // Adjust margin based on sidebar state
                        transition: 'margin-left 0.3s ease-in-out',
                        padding: '20px', // Padding around the content
                        backgroundColor: 'white', // Content area background
                        overflowY: 'auto', // Enable vertical scrolling for main content
                        display: 'flex', // To make content fill height if needed
                        flexDirection: 'column', // Content inside main
                        boxSizing: 'border-box',
                    }}>
                        <Routes>
                            <Route path="/" element={<Dashboard />} />
                            <Route path="/dashboard" element={<Dashboard />} />
                            <Route path="/editor" element={<AppEditor />} />
                            <Route path="/preview" element={<AppPreview />} />
                            <Route path="/settings" element={<Settings />} />
                            <Route path="/about" element={<About />} />
                            {/* Fallback route */}
                            <Route path="*" element={<Dashboard />} />
                        </Routes>
                    </main>
                </div>

                <Footer />
            </div>
        </Router>
    );
};

export default WebApp;
```