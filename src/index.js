/* eslint-disable no-unused-vars */
import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import { BrowserRouter as Router } from 'react-router-dom';
import { Amplify } from 'aws-amplify';
import config from './config';
import { initSentry } from './libs/errorLib';
import { GoogleOAuthProvider } from '@react-oauth/google'; // Import GoogleOAuthProvider

initSentry();

Amplify.configure({
  Auth: {
    mandatorySignIn: true,
    region: config.cognito.REGION,
    userPoolId: config.cognito.USER_POOL_ID,
    identityPoolId: config.cognito.IDENTITY_POOL_ID,
    userPoolWebClientId: config.cognito.APP_CLIENT_ID
  },
  Storage: {
    region: config.s3.REGION,
    bucket: config.s3.BUCKET,
    identityPoolId: config.cognito.IDENTITY_POOL_ID
  },
  API: {
    endpoints: [
      {
        name: "notes",
        endpoint: config.apiGateway.URL,
        region: config.apiGateway.REGION
      },
    ]
  }
});

const root = ReactDOM.createRoot(document.getElementById('root'));
const clientId = 'YOUR_GOOGLE_CLIENT_ID'; // Replace with your Google Client ID

root.render(
  <React.StrictMode>
    <GoogleOAuthProvider clientId={clientId}> {/* Wrap the app with GoogleOAuthProvider */}
      <Router>
        <App />
      </Router>
    </GoogleOAuthProvider>
  </React.StrictMode>,
);

reportWebVitals();
