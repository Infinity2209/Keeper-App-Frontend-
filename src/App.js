/* eslint-disable react/style-prop-object */
// App.js
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUser } from "@fortawesome/free-solid-svg-icons";
import "./App.css";
import MyRoutes from "./Routes";
import Nav from "react-bootstrap/Nav";
import Navbar from "react-bootstrap/Navbar";
import { LinkContainer } from "react-router-bootstrap";
import { AppContext } from "./libs/contextLib";
import { Auth } from "aws-amplify";
import React, { useState, useEffect } from "react";
import { useNavigate } from 'react-router-dom';
import { onError } from "./libs/errorLib";
import ErrorBoundary from "./components/ErrorBoundary";


function App() {
  const [isAuthenticated, userHasAuthenticated] = useState(false);
  const [isAuthenticating, setIsAuthenticating] = useState(true);
  const navigate = useNavigate();
  
  useEffect(() => {
    onLoad();
  }, []);

  async function onLoad() {
    try {
      await Auth.currentSession();
      userHasAuthenticated(true);
    } catch (e) {
      if (e !== 'No current user') {
        onError(e);
      }
    }
    setIsAuthenticating(false);
  }

  async function handleLogout() {
    try {
      await Auth.signOut();
      userHasAuthenticated(false);
      navigate('/login');
    } catch (e) {
      alert(e.message);
    }
  }

  return (
    !isAuthenticating && (
      <div className="App container py-3">
        <Navbar bg="light" expand="md" className="mb-3 nav">
          <LinkContainer to="/">
            <Navbar.Brand className="font-weight-bold text-muted">
            <i class="material-icons" id="home">&#xe88a;</i>
            </Navbar.Brand>
          </LinkContainer>
          <Navbar.Toggle />
          <Navbar.Collapse className="justify-content-end">
            <Nav activeKey={window.location.pathname}>
              {isAuthenticated ? (
                <>
                  <LinkContainer to="/settings">
                    <Nav.Link><i class="material-icons">&#xe8b8;</i>Settings</Nav.Link>
                  </LinkContainer>
                  <Nav.Link onClick={handleLogout}><i class="fa">&#xf235;</i> Logout</Nav.Link>
                </>
              ) : (
                <>
                  <LinkContainer to="/signup">
                    <Nav.Link><i class="fa">&#xf234;</i>  Signup</Nav.Link>
                  </LinkContainer>
                  <LinkContainer to="/login">
                    <Nav.Link><FontAwesomeIcon icon={faUser} />  Login</Nav.Link>
                  </LinkContainer>
                </>
              )}
            </Nav>
          </Navbar.Collapse>
        </Navbar>
        <ErrorBoundary>
          <AppContext.Provider value={{ isAuthenticated, userHasAuthenticated }}>
            <MyRoutes />
          </AppContext.Provider>
        </ErrorBoundary>
      </div>
    )
  );
}

export default App;
