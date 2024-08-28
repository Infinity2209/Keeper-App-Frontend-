const config = {
    s3: {
        REGION: "us-east-1",
        BUCKET: "keeper-app-bucket",
    },
    apiGateway: {
        REGION: "us-east-1",
        URL: "https://s4an8nor94.execute-api.us-east-1.amazonaws.com/dev",
    },
    cognito: {
        REGION: "us-east-1",
        USER_POOL_ID: "us-east-1_SfCeOQRGj",
        APP_CLIENT_ID: "2cj6ijjro4uhdnpt6evtne8bmk",
        IDENTITY_POOL_ID: "us-east-1:2c64df36-abb8-4e61-8cf7-cb26381a41a7",
    },
    social: {
        FB: "257199716923752"
    },
};

export default config;
