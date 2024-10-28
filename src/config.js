const config = {
    s3: {
        REGION: "us-east-1",
        BUCKET: "notes-app2-uploads",
    },
    apiGateway: {
        REGION: "us-east-1",
        URL: "https://h1c4qx2eyj.execute-api.us-east-1.amazonaws.com/dev",
    },
    cognito: {
        REGION: "us-east-1",
        USER_POOL_ID: "us-east-1_uN0bSBS7G",
        APP_CLIENT_ID: "4jo2nu2m9da38k51jpchdh2oef",
        IDENTITY_POOL_ID: "us-east-1:ff6b0a23-6450-40d6-b691-6c2b75e27961",
    },
    
};

export default config;
