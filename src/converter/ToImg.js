import React, { useRef, useState } from "react";
import axios from "axios";
import { Buffer } from "buffer";
import config from "../config";

const ToImg = () => {
    // Use state and ref hooks for managing image display
    const imageOutputRef = useRef(null);
    const [isLoading, setIsLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");

    // Function to view the converted image
    const viewImage = (imageDataUrl) => {
        if (imageOutputRef.current) {
            const imgElement = document.createElement('img');
            imgElement.src = imageDataUrl;
            imgElement.alt = "Converted Image";
            imageOutputRef.current.appendChild(imgElement);
        }
    };

    // Function to trigger download of the image
    const downloadImage = (imageDataUrl) => {
        const downloadLink = document.createElement('a');
        downloadLink.href = imageDataUrl;
        downloadLink.download = "converted-image.jpg";  // Set the download file name
        downloadLink.click();  // Programmatically click the link
    };

    // Main function to convert the file to an image
    const convertToImg = async (note) => {
        setIsLoading(true); // Show loading indicator
        setErrorMessage(""); // Reset error message

        console.log("Data received:", note);
        let att = note.attachment;
        console.log("Attachment (relative path):", att);

        // Construct the full S3 URL using the relative path from the attachment
        const fullUrl = `https://${config.s3.BUCKET}.s3.${config.s3.REGION}.amazonaws.com/public/${att}`;
        console.log("Full S3 URL constructed:", fullUrl);

        const extensionOfAtt = att.split(".").pop().toLowerCase();
        console.log("File extension:", extensionOfAtt);

        if (extensionOfAtt === "jpg" || extensionOfAtt === "jpeg") {
            alert("Your document is already in JPG/JPEG Format");
            setIsLoading(false); // Hide loading indicator
            return null;
        }

        try {
            // Step 1: Download the file from S3
            const fileResponse = await axios.get(fullUrl, { responseType: "arraybuffer" });
            const fileBuffer = Buffer.from(fileResponse.data);
            console.log("File downloaded successfully.", fileBuffer);

            // Step 2: Convert the file to an image
            const blob = new Blob([fileBuffer], { type: "application/octet-stream" });
            const reader = new FileReader();

            const fileExtension = att.split('.').pop().toLowerCase();
            return new Promise((resolve, reject) => {
                reader.onload = async function (e) {
                    let imageDataUrl;

                    if (fileExtension === "txt") {
                        // Handle text file conversion to image
                        const textContent = e.target.result;
                        const canvas = document.createElement("canvas");
                        const ctx = canvas.getContext("2d");

                        // Set font and size
                        const fontSize = 16;
                        const maxWidth = 500;
                        ctx.font = `${fontSize}px Arial`;
                        ctx.fillStyle = "black";

                        // Split the text into lines based on max width
                        const lines = getTextLines(textContent, maxWidth, fontSize);
                        const canvasHeight = lines.length * (fontSize * 1.5) + 20;

                        canvas.width = maxWidth + 20;
                        canvas.height = canvasHeight;

                        let y = 20;
                        lines.forEach((line) => {
                            ctx.fillText(line, 10, y);
                            y += fontSize * 1.5;
                        });

                        // Convert the canvas to a Data URL (base64 encoded image)
                        imageDataUrl = canvas.toDataURL("image/jpeg");

                        // Display the image
                        viewImage(imageDataUrl);
                        downloadImage(imageDataUrl);

                        resolve(imageDataUrl);
                    } else if (fileExtension === "png" || fileExtension === "jpeg" || fileExtension === "jpg") {
                        // Handle image file conversion (e.g., PNG/JPG to JPG)
                        const imgData = e.target.result;
                        imageDataUrl = imgData;  // Image is already in base64 format

                        // Display the image
                        viewImage(imageDataUrl);
                        downloadImage(imageDataUrl);

                        resolve(imageDataUrl);
                    } else {
                        reject(new Error("Unsupported file type"));
                    }
                };

                // Read the file as appropriate based on the file type
                if (fileExtension === "txt") {
                    reader.readAsText(blob);
                } else if (fileExtension === "png" || fileExtension === "jpg" || fileExtension === "jpeg") {
                    reader.readAsDataURL(blob);
                } else {
                    reject(new Error("Unsupported file type"));
                }
            });
        } catch (error) {
            console.error("Error processing the file:", error);
            setErrorMessage("Error processing the file. Please try again.");
        } finally {
            setIsLoading(false); // Hide loading indicator
        }
    };

    // Utility function to split text into wrapped lines based on width
    const getTextLines = (text, maxWidth, fontSize) => {
        const lines = [];
        const words = text.split(' ');
        let currentLine = '';
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        ctx.font = `${fontSize}px Arial`;

        words.forEach((word) => {
            const width = ctx.measureText(currentLine + word).width;
            if (width < maxWidth) {
                currentLine += word + ' ';
            } else {
                lines.push(currentLine.trim());
                currentLine = word + ' ';
            }
        });

        if (currentLine.trim()) {
            lines.push(currentLine.trim());
        }

        return lines;
    };

    return (
        <div>
            <button onClick={() => convertToImg({ attachment: "path/to/your/file.txt" })} disabled={isLoading}>
                {isLoading ? "Processing..." : "Convert File to Image"}
            </button>
            <div ref={imageOutputRef} id="image-output"></div>
            {errorMessage && <p style={{ color: "red" }}>{errorMessage}</p>}
        </div>
    );
};

export default ToImg;
