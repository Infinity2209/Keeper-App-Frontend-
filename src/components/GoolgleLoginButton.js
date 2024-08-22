import React from 'react';
import { GoogleLogin } from 'react-google-login';

export default function GoogleLoginButton() {
    const handleSuccess = (response) => {
        console.log("Google login success:", response);
        // Handle the response here
    };

    const handleFailure = (response) => {
        console.log("Google login failure:", response);
        // Handle the failure here
    };

    return (
        <GoogleLogin
            clientId={process.env.REACT_APP_GOOGLE_CLIENT_ID}
            buttonText="Login with Google"
            onSuccess={handleSuccess}
            onFailure={handleFailure}
            cookiePolicy={'single_host_origin'}
        />
    );
}
