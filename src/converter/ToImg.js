import React, { useRef, useState } from "react";
import axios from "axios";
import { Buffer } from "buffer";
import config from "../config";
import * as pdfjsLib from 'pdfjs-dist';

const ToImg = () => {
    const imageOutputRef = useRef(null);
    const [isLoading, setIsLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");

    const viewImage = (imageDataUrl) => {
        if (imageOutputRef.current) {
            const imgElement = document.createElement("img");
            imgElement.src = imageDataUrl;
            imgElement.alt = "Converted Image";
            imageOutputRef.current.innerHTML = ""; // Clear previous content
            imageOutputRef.current.appendChild(imgElement);
        }
    };

    const downloadImage = (imageDataUrl, fileName = "converted-image.jpg") => {
        const downloadLink = document.createElement("a");
        downloadLink.href = imageDataUrl;
        downloadLink.download = fileName;
        downloadLink.click();
    };

    const convertToImg = async (note) => {
        setIsLoading(true);
        setErrorMessage("");
        const att = note.attachment;
        const fullUrl = `https://${config.s3.BUCKET}.s3.${config.s3.REGION}.amazonaws.com/public/${att}`;
        const extensionOfAtt = att.split(".").pop().toLowerCase();

        if (extensionOfAtt === "jpg" || extensionOfAtt === "jpeg") {
            alert("The file is already in JPG/JPEG format.");
            setIsLoading(false);
            return;
        }

        try {
            const fileResponse = await axios.get(fullUrl, { responseType: "arraybuffer" });
            const fileBuffer = Buffer.from(fileResponse.data);
            const blob = new Blob([fileBuffer], { type: "application/octet-stream" });
            const reader = new FileReader();

            return new Promise((resolve, reject) => {
                reader.onload = async function (e) {
                    let imageDataUrl;

                    if (extensionOfAtt === "txt") {
                        const textContent = e.target.result;
                        const imageData = createTextImage(textContent);
                        imageDataUrl = imageData.toDataURL("image/jpeg");
                    } else if (["png", "gif", "bmp", "webp", "pdf"].includes(extensionOfAtt)) {
                        imageDataUrl = await convertImageOrPdfToJpeg(e.target.result, extensionOfAtt);
                    } else {
                        reject(new Error("Unsupported file type"));
                    }

                    viewImage(imageDataUrl);
                    downloadImage(imageDataUrl);
                    resolve(imageDataUrl);
                };

                if (extensionOfAtt === "txt") {
                    reader.readAsText(blob);
                } else {
                    reader.readAsDataURL(blob);
                }
            });
        } catch (error) {
            console.error("Error processing the file:", error);
            setErrorMessage("Error processing the file. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    const createTextImage = (textContent) => {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        const fontSize = 16;
        const maxWidth = 500;
        const lines = getTextLines(textContent, maxWidth, fontSize);

        canvas.width = maxWidth + 20;
        canvas.height = lines.length * (fontSize * 1.5) + 20;

        ctx.font = `${fontSize}px Arial`;
        ctx.fillStyle = "black";

        let y = 20;
        lines.forEach((line) => {
            ctx.fillText(line, 10, y);
            y += fontSize * 1.5;
        });

        return canvas;
    };

    const convertImageOrPdfToJpeg = async (fileData, extension) => {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");

        if (["png", "gif", "bmp", "webp"].includes(extension)) {
            const img = new Image();
            return new Promise((resolve, reject) => {
                img.onload = () => {
                    canvas.width = img.width;
                    canvas.height = img.height;
                    ctx.drawImage(img, 0, 0);
                    resolve(canvas.toDataURL("image/jpeg"));
                };
                img.onerror = () => reject(new Error("Error loading image"));
                img.src = fileData;
            });
        } else if (extension === "pdf") {
            // Use pdf.js library to render PDF into a canvas
            pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;
            const loadingTask = pdfjsLib.getDocument({ data: fileData });
            const pdf = await loadingTask.promise;
            const page = await pdf.getPage(1); // Render the first page
            const viewport = page.getViewport({ scale: 2 });
            canvas.width = viewport.width;
            canvas.height = viewport.height;

            await page.render({ canvasContext: ctx, viewport }).promise;
            return canvas.toDataURL("image/jpeg");
        }

        throw new Error("Unsupported file type");
    };

    const getTextLines = (text, maxWidth, fontSize) => {
        const lines = [];
        const words = text.split(" ");
        let currentLine = "";
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        ctx.font = `${fontSize}px Arial`;

        words.forEach((word) => {
            const width = ctx.measureText(currentLine + word).width;
            if (width < maxWidth) {
                currentLine += word + " ";
            } else {
                lines.push(currentLine.trim());
                currentLine = word + " ";
            }
        });

        if (currentLine.trim()) {
            lines.push(currentLine.trim());
        }

        return lines;
    };

    return (
        <div>
            <button
                onClick={() => convertToImg({ attachment: "path/to/your/file.txt" })}
                disabled={isLoading}
            >
                {isLoading ? "Processing..." : "Convert File to JPG/JPEG"}
            </button>
            <div ref={imageOutputRef} id="image-output"></div>
            {errorMessage && <p style={{ color: "red" }}>{errorMessage}</p>}
        </div>
    );
};

export default ToImg;
