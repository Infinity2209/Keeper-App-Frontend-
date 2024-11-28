import axios from "axios";
import { Buffer } from "buffer";
import html2canvas from "html2canvas"; // Import html2canvas for HTML to image conversion
import * as XLSX from "xlsx";
import config from "../config";

const ToImg = async (note) => {
    console.log("Data received:", note);

    let att = note.attachment;
    console.log("Attachment (relative path):", att);

    // Construct the full S3 URL using the relative path from the attachment
    const fullUrl = `https://${config.s3.BUCKET}.s3.${config.s3.REGION}.amazonaws.com/public/${att}`;
    console.log("Full S3 URL constructed:", fullUrl);

    const extensionOfAtt = att.split(".").pop().toLowerCase();
    console.log("File extension:", extensionOfAtt);

    if (extensionOfAtt === "jpg" || extensionOfAtt === "jpeg") {
        alert("Your document is already in JPEG format");
        return null;
    }

    try {
        // Step 1: Download the file from S3
        const fileResponse = await axios.get(fullUrl, { responseType: "arraybuffer" });
        const fileBuffer = Buffer.from(fileResponse.data);
        console.log("File downloaded successfully.", fileBuffer);

        // Step 2: Convert the file to JPEG
        const blob = new Blob([fileBuffer], { type: "application/octet-stream" });
        const reader = new FileReader();

        // Define the fileType outside the onload function
        const fileType = att.split('.').pop().toLowerCase();

        return new Promise((resolve, reject) => {
            reader.onload = async function (e) {
                let imgDataUrl;

                if (fileType === "txt") {
                    // Handle text file conversion
                    const text = e.target.result;
                    const canvas = document.createElement("canvas");
                    const ctx = canvas.getContext("2d");
                    ctx.font = "16px Arial";
                    ctx.fillText(text, 10, 50); // Add text to canvas
                    imgDataUrl = canvas.toDataURL("image/jpeg");
                    resolve(imgDataUrl);
                } else if (fileType === "png") {
                    // Convert PNG directly to JPEG
                    imgDataUrl = e.target.result.replace("image/png", "image/jpeg");
                    resolve(imgDataUrl);
                } else if (fileType === "html") {
                    // Handle HTML to JPEG
                    const htmlContent = e.target.result;
                    const tempDiv = document.createElement("div");
                    tempDiv.innerHTML = htmlContent;
                    document.body.appendChild(tempDiv);
                    const canvas = await html2canvas(tempDiv);
                    imgDataUrl = canvas.toDataURL("image/jpeg");
                    document.body.removeChild(tempDiv); // Clean up temporary div
                    resolve(imgDataUrl);
                } else if (fileType === "xls" || fileType === "xlsx") {
                    // Convert Excel sheet to JPEG
                    const arrayBuffer = e.target.result;
                    let workbook = XLSX.read(arrayBuffer, { type: "array" });
                    const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
                    const data = XLSX.utils.sheet_to_html(firstSheet); // Convert sheet to HTML

                    const tempDiv = document.createElement("div");
                    tempDiv.innerHTML = data;
                    document.body.appendChild(tempDiv);

                    const canvas = await html2canvas(tempDiv);
                    imgDataUrl = canvas.toDataURL("image/jpeg");

                    document.body.removeChild(tempDiv);
                    resolve(imgDataUrl);
                } else {
                    reject(new Error("Unsupported file type"));
                }
            };

            if (extensionOfAtt === "txt" || extensionOfAtt === "html") {
                reader.readAsText(blob);
            } else if (extensionOfAtt === "png") {
                reader.readAsDataURL(blob);
            } else if (extensionOfAtt === "xls" || extensionOfAtt === "xlsx") {
                reader.readAsArrayBuffer(blob);
            } else {
                reject(new Error("Unsupported file type"));
            }
        });
    } catch (error) {
        console.error("Error processing the file:", error);
        throw error;
    }
};


// Function to trigger file download
const downloadImage = (imgDataUrl, filename = "converted_image.jpg") => {
    const link = document.createElement("a");
    link.href = imgDataUrl;
    link.download = filename;
    link.click(); // Simulate a click to trigger the download
};

export { ToImg, downloadImage };
