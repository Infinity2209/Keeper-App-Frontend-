/* eslint-disable no-unused-vars */
import React, { useState } from "react";
import { GoogleOAuthProvider, GoogleLogin } from "@react-oauth/google";
import Form from "react-bootstrap/Form";
import LoaderButton from "../components/LoaderButton";
import { useNavigate } from "react-router-dom";
import { useAppContext } from "../libs/contextLib";
import { useFormFields } from "../libs/hooksLib";
import { Auth } from "aws-amplify";
import { onError } from "../libs/errorLib";
import "./Signup.css";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEye, faEyeSlash } from '@fortawesome/free-solid-svg-icons';

export default function Signup() {
  const [fields, handleFieldChange] = useFormFields({
    email: "",
    password: "",
    confirmPassword: "",
    confirmationCode: ""
  });
  const navigate = useNavigate();
  const [newUser, setNewUser] = useState(null);
  const { userHasAuthenticated } = useAppContext();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false); // State to toggle password visibility

  function validateForm() {
    return fields.email.length > 0 && fields.password.length > 0 && fields.password === fields.confirmPassword;
  }

  function validateConfirmationForm() {
    return fields.confirmationCode.length > 0;
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setIsLoading(true);
    try {
      const newUser = await Auth.signUp({
        username: fields.email,
        password: fields.password
      });
      setIsLoading(false);
      setNewUser(newUser);
    } catch (e) {
      onError(e);
      setIsLoading(false);
    }
  }

  async function handleConfirmationSubmit(event) {
    event.preventDefault();
    setIsLoading(true);
    try {
      await Auth.confirmSignUp(fields.email, fields.confirmationCode);
      await Auth.signIn(fields.email, fields.password);
      userHasAuthenticated(true);
      navigate("/");
    } catch (e) {
      onError(e);
      setIsLoading(false);
    }
  }

  function togglePasswordVisibility() {
    setShowPassword(!showPassword);
  }

  return (
    <div className="Signup">
      <GoogleOAuthProvider clientId="YOUR_GOOGLE_CLIENT_ID">
        {newUser === null ? (
          <Form onSubmit={handleSubmit}>
            <Form.Group controlId="email" size="lg">
              <Form.Label>Email</Form.Label>
              <Form.Control autoFocus type="email" value={fields.email} onChange={handleFieldChange} />
            </Form.Group>
            <Form.Group controlId="password" size="lg" style={{ position: "relative" }}>
              <Form.Label>Password</Form.Label>
              <Form.Control
                type={showPassword ? "text" : "password"}
                value={fields.password}
                onChange={handleFieldChange}
              />
              <FontAwesomeIcon
                icon={showPassword ? faEyeSlash : faEye}
                onClick={togglePasswordVisibility}
                className="password-toggle-icon"
                style={{
                  position: "absolute",
                  top: "75%",
                  right: "10px",
                  transform: "translateY(-50%)",
                  cursor: "pointer",
                  zIndex: 2,
                  color: "black" // Set the icon color to dark black
                }}
              />
            </Form.Group>
            <Form.Group controlId="confirmPassword" size="lg" style={{ position: "relative" }}>
              <Form.Label>Confirm Password</Form.Label>
              <Form.Control
                type={showPassword ? "text" : "password"}
                value={fields.confirmPassword}
                onChange={handleFieldChange}
              />
            </Form.Group>
            <LoaderButton block size="lg" type="submit" variant="success" isLoading={isLoading} disabled={!validateForm()}>
              Signup
            </LoaderButton>
            <div className="mt-4">
              <GoogleLogin
                onSuccess={(credentialResponse) => {
                  console.log(credentialResponse);
                  // Handle successful login here
                }}
                onError={() => {
                  console.log("Login Failed");
                }}
              />
            </div>
          </Form>
        ) : (
          <Form onSubmit={handleConfirmationSubmit}>
            <Form.Group controlId="confirmationCode" size="lg">
              <Form.Label>Confirmation Code</Form.Label>
              <Form.Control autoFocus type="tel" onChange={handleFieldChange} value={fields.confirmationCode} />
              <Form.Text muted>Please check your email for the code.</Form.Text>
            </Form.Group>
            <LoaderButton block size="lg" type="submit" variant="success" isLoading={isLoading} disabled={!validateConfirmationForm()}>
              Verify
            </LoaderButton>
          </Form>
        )}
      </GoogleOAuthProvider>
    </div>
  );
}
