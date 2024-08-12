import * as Sentry from "@sentry/browser";
const isLocal = process.env.NODE_ENV === "development";
export function initSentry() {
    if (isLocal) {
        return;
    }
    Sentry.init({ dsn: "https://f39ecf08b0604de68bc4d0b636ca9f86@o4505420608700416.ingest.sentry.io/4505420610535424" });
}
export function logError(error, errorInfo = null) {
    if (isLocal) {
        return;
    }
    Sentry.withScope((scope) => {
        errorInfo && scope.setExtras(errorInfo);
        Sentry.captureException(error);
    });
}
export function onError(error) {
    let errorInfo = {};
    let message = error.toString();
    // Auth errors
    if (!(error instanceof Error) && error.message) {
        errorInfo = error;
        message = error.message;
        error = new Error(message);
        // API errors
    } else if (error.config && error.config.url) {
        errorInfo.url = error.config.url;
    }
    logError(error, errorInfo);
    alert(message);
}
