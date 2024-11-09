const config = {
    s3: {
        REGION: "us-east-1",
        BUCKET: "keeper-app-uploads",
    },
    apiGateway: {
        REGION: "us-east-1",
        URL: "https://9fongqdf99.execute-api.us-east-1.amazonaws.com/dev",
    },
    cognito: {
        REGION: "us-east-1",
        USER_POOL_ID: "us-east-1_zMzb9U5gh", // Updated user pool ID
        APP_CLIENT_ID: "4uk01j4dv37dvnpj3hoqq6gd58", // Updated app client ID
        IDENTITY_POOL_ID: "us-east-1:b10469a8-f4d2-4d0c-8ae7-8b52ec0b742c",
    },
};

export default config;
