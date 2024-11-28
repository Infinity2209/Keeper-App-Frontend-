import axios from 'axios';
import { Buffer } from 'buffer';

// Load pdf.js library for PDF file handling (you need to install pdfjs-dist)
import * as pdfjsLib from 'pdfjs-dist';

// Load html2canvas for rendering HTML to PNG
import html2canvas from 'html2canvas';

// Load Mammoth for DOCX to HTML conversion
import mammoth from 'mammoth';

// Function to handle file conversion
const ToPng = async (note) => {
    console.log("Data received:", note);

    let att = note.attachment;
    console.log("Attachment (relative path):", att);

    // Construct the full S3 URL using the relative path from the attachment
    const fullUrl = `https://note-app-upload.s3.us-east-1.amazonaws.com/public/${att}`;
    console.log("Full S3 URL constructed:", fullUrl);

    const extensionOfAtt = att.split(".").pop().toLowerCase();
    console.log("File extension:", extensionOfAtt);
    if (extensionOfAtt === "png") {
        alert("The file already in .png format");
    }
    // Validate supported file types
    else if (['jpg', 'jpeg' ].includes(extensionOfAtt)) {
        return handleImageFile(fullUrl, extensionOfAtt);
    } else if (extensionOfAtt === 'pdf') {
        return handlePdfFile(fullUrl);
    } else if (extensionOfAtt === 'docx') {
        return handleDocxFile(fullUrl);
    } else {
        console.error("Unsupported file type");
        return null;
    }
};

// Handle image files (JPG, PNG)
const handleImageFile = async (fullUrl, extensionOfAtt) => {
    try {
        // Download the image
        const fileResponse = await axios.get(fullUrl, { responseType: 'arraybuffer' });
        const fileBuffer = Buffer.from(fileResponse.data);
        console.log("File downloaded successfully:", fileBuffer);

        const blob = new Blob([fileBuffer], { type: `image/${extensionOfAtt}` });
        const reader = new FileReader();

        return new Promise((resolve, reject) => {
            reader.onload = function (e) {
                const imgDataUrl = e.target.result;
                const img = new Image();

                img.onload = function () {
                    const canvas = document.createElement("canvas");
                    const ctx = canvas.getContext("2d");

                    // Set canvas size to match image dimensions
                    canvas.width = img.width;
                    canvas.height = img.height;

                    // Draw the image on the canvas
                    ctx.drawImage(img, 0, 0);

                    // Convert canvas to PNG data URL
                    const pngDataUrl = canvas.toDataURL("image/png");

                    // Trigger the download
                    const link = document.createElement("a");
                    link.href = pngDataUrl;
                    link.download = "converted_image.png"; // Default file name
                    link.click(); // Simulate a click to start the download

                    resolve(pngDataUrl); // Return the PNG data URL
                };

                img.onerror = function (err) {
                    reject(new Error("Error loading image: " + err));
                };

                img.src = imgDataUrl; // Set the source of the image
            };

            reader.readAsDataURL(blob);
        });
    } catch (error) {
        console.error("Error processing the image:", error);
        throw error;
    }
};

// Handle PDF files using pdf.js
const handlePdfFile = async (fullUrl) => {
    try {
        // Download the PDF file
        const fileResponse = await axios.get(fullUrl, { responseType: 'arraybuffer' });
        const fileBuffer = Buffer.from(fileResponse.data);
        const blob = new Blob([fileBuffer], { type: 'application/pdf' });
        const reader = new FileReader();

        return new Promise((resolve, reject) => {
            reader.onload = function (e) {
                const loadingTask = pdfjsLib.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.js"; // Local path
                loadingTask.promise.then((pdf) => {
                    // Render the first page of the PDF
                    pdf.getPage(1).then((page) => {
                        const scale = 1.5;
                        const viewport = page.getViewport({ scale });
                        const canvas = document.createElement("canvas");
                        const ctx = canvas.getContext("2d");
                        canvas.height = viewport.height;
                        canvas.width = viewport.width;

                        const renderContext = {
                            canvasContext: ctx,
                            viewport: viewport,
                        };

                        page.render(renderContext).promise.then(() => {
                            const pngDataUrl = canvas.toDataURL("image/png");

                            // Trigger the download
                            const link = document.createElement("a");
                            link.href = pngDataUrl;
                            link.download = "converted_pdf_page.png"; // Default file name
                            link.click();

                            resolve(pngDataUrl); // Return the PNG data URL
                        });
                    });
                }).catch(reject);
            };

            reader.readAsArrayBuffer(blob); // Read the PDF as ArrayBuffer
        });
    } catch (error) {
        console.error("Error processing the PDF:", error);
        throw error;
    }
};

// Handle DOCX files and convert to HTML
const handleDocxFile = async (fullUrl) => {
    try {
        // Download the DOCX file
        const fileResponse = await axios.get(fullUrl, { responseType: 'arraybuffer' });
        const fileBuffer = Buffer.from(fileResponse.data);
        const blob = new Blob([fileBuffer], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
        const reader = new FileReader();

        return new Promise((resolve, reject) => {
            reader.onload = function (e) {
                // Use Mammoth.js to convert DOCX to HTML
                mammoth.extractRawText({ arrayBuffer: e.target.result })
                    .then((result) => {
                        const htmlContent = `<html><body>${result.value}</body></html>`;

                        // Render the HTML content to a canvas using html2canvas
                        const htmlElement = document.createElement('div');
                        htmlElement.innerHTML = htmlContent;

                        html2canvas(htmlElement).then((canvas) => {
                            const pngDataUrl = canvas.toDataURL("image/png");

                            // Trigger the download
                            const link = document.createElement("a");
                            link.href = pngDataUrl;
                            link.download = "converted_docx_image.png"; // Default file name
                            link.click();

                            resolve(pngDataUrl); // Return the PNG data URL
                        }).catch(reject);
                    })
                    .catch(reject);
            };

            reader.readAsArrayBuffer(blob); // Read the DOCX as ArrayBuffer
        });
    } catch (error) {
        console.error("Error processing the DOCX:", error);
        throw error;
    }
};

export default ToPng;
