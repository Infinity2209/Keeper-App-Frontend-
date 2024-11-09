const config = {
    s3: {
        REGION: "us-east-1",
        BUCKET: "note-app-upload",
    },
    apiGateway: {
        REGION: "us-east-1",
        URL: "https://9fongqdf99.execute-api.us-east-1.amazonaws.com/dev",
    },
    cognito: {
        REGION: "us-east-1",
        USER_POOL_ID: "us-east-1_n2pzpQOcf", 
        APP_CLIENT_ID: "691hh2hibv15ql73pd51ka4fpo", 
        IDENTITY_POOL_ID: "us-east-1:cf8eea9d-10cc-42bc-ba78-b21b37dce85b",
    },
};

export default config;
