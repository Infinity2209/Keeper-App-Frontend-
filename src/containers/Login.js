/* eslint-disable no-unused-vars */
import React, { useState } from "react";
import { Auth } from "aws-amplify";
import Form from "react-bootstrap/Form";
import LoaderButton from "../components/LoaderButton";
import { useAppContext } from "../libs/contextLib";
import { useFormFields } from "../libs/hooksLib";
import { onError } from "../libs/errorLib";
import { useNavigate } from 'react-router-dom';
import "./Login.css";
import { Link } from "react-router-dom";
import { GoogleLogin } from '@react-oauth/google';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEye, faEyeSlash } from '@fortawesome/free-solid-svg-icons';

export default function Login() {
  const navigate = useNavigate();
  const { userHasAuthenticated } = useAppContext();
  const [showPassword, setShowPassword] = useState(false); // State to toggle password visibility
  const [isLoading, setIsLoading] = useState(false);
  const [fields, handleFieldChange] = useFormFields({
    email: "",
    password: ""
  });

  function validateForm() {
    return fields.email.length > 0 && fields.password.length > 0;
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setIsLoading(true);
    try {
      await Auth.signIn(fields.email, fields.password);
      userHasAuthenticated(true);
      navigate("/");
    } catch (e) {
      onError(e);
      setIsLoading(false);
    }
  }

  async function handleFbLogin() {
    setIsLoading(true);
    try {
      const response = await Auth.federatedSignIn({ provider: "Facebook" });
      setIsLoading(false);
      userHasAuthenticated(true);
      navigate("/");
    } catch (e) {
      onError(e);
      setIsLoading(false);
    }
  }

  async function handleGoogleLogin(response) {
    setIsLoading(true);
    try {
      const { credential } = response;
      await Auth.federatedSignIn('google', { token: credential });
      setIsLoading(false);
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
    <div className="Login">
      <Form onSubmit={handleSubmit}>
        <Form.Group size="lg" controlId="email">
          <Form.Label>Email</Form.Label>
          <Form.Control
            autoFocus
            type="email"
            value={fields.email}
            onChange={handleFieldChange}
          />
        </Form.Group>
        <Form.Group size="lg" controlId="password" style={{ position: "relative" }}>
          <Form.Label>Password</Form.Label>
          <Form.Control
            type={showPassword ? "text" : "password"} // Toggle input type based on showPassword state
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
              color: "black"
            }}
          />
        </Form.Group>
        <Link to="/login/reset" className="text-white">Forgot password?</Link>
        <LoaderButton
          block
          size="lg"
          type="submit"
          isLoading={isLoading}
          disabled={!validateForm()}
        >
          Login
        </LoaderButton>
        <div className='mt-4'>
          <GoogleLogin
            onSuccess={handleGoogleLogin}
            onError={() => {
              console.log('Google Login Failed');
            }}
          />
        </div>
      </Form>
    </div>
  );
}
