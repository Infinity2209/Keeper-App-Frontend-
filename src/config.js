const config = {
    s3: {
        REGION: "us-east-1",
        BUCKET: "notes-ap-ananta",
    },
    apiGateway: {
        REGION: "us-east-1",
        URL: "https://sjms08fhj8.execute-api.us-east-1.amazonaws.com/prod",
    },
    cognito: {
        REGION: "us-east-1",
        USER_POOL_ID: "us-east-1_qJluHej8r",
        APP_CLIENT_ID: "711qlgpntcanku6rcp5840blga",
        IDENTITY_POOL_ID: "us-east-1:355df27b-ba6f-435e-858b-7cdc4e61e4cc",
    },
    social: {
        FB: "257199716923752"
    }
};

export default config;