import axios from "axios";
import { Buffer } from "buffer"; // Ensure this is here
import * as XLSX from "xlsx";
import config from "../config";
import { Document, Packer, Paragraph, TextRun } from "docx"; // docx library for creating Word files
import { saveAs } from "file-saver";
import html2canvas from "html2canvas";

const ToWord = async (note) => {
    console.log("Data received:", note);

    let att = note.attachment;
    console.log("Attachment (relative path):", att);

    // Construct the full S3 URL using the relative path from the attachment
    const fullUrl = `https://${config.s3.BUCKET}.s3.${config.s3.REGION}.amazonaws.com/public/${att}`;
    console.log("Full S3 URL constructed:", fullUrl);

    const extensionOfAtt = att.split(".").pop().toLowerCase();
    console.log("File extension:", extensionOfAtt);

    if (extensionOfAtt === "docx") {
        alert("Your document is already in Word Format");
        return null;
    }

    try {
        // Step 1: Download the file from S3
        const fileResponse = await axios.get(fullUrl, { responseType: "arraybuffer" });
        const fileBuffer = Buffer.from(fileResponse.data); // Using Buffer from 'buffer'
        console.log("File downloaded successfully.", fileBuffer);

        // Step 2: Convert the file to Word (DOCX format)
        const blob = new Blob([fileBuffer], { type: "application/octet-stream" });
        const reader = new FileReader();

        return new Promise((resolve, reject) => {
            const fileType = att.split('.').pop().toLowerCase(); // Get file extension
            reader.onload = async function (e) {
                let imgDataUrl;

                // Handling .txt files
                if (fileType === "txt") {
                    const text = e.target.result;
                    const doc = new Document({
                        sections: [
                            {
                                properties: {},
                                children: [
                                    new Paragraph({
                                        children: [new TextRun(text)],
                                    }),
                                ],
                            },
                        ],
                    });

                    const buffer = await Packer.toBuffer(doc);
                    const docBlob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document" });
                    const fileName = `converted_file_${new Date().toISOString()}.docx`;

                    // Call the function to save or download the file
                    await saveOrDownloadFile(docBlob, fileName);
                    resolve(docBlob);

                } else if (['jpg', 'jpeg', 'png'].includes(fileType)) {
                    // Handle image files (convert to data URL)
                    imgDataUrl = e.target.result.replace("image/png", "image/jpeg");
                    resolve(imgDataUrl);

                } else if (fileType === "html") {
                    // Convert HTML content to DOCX
                    const htmlContent = e.target.result;
                    const tempDiv = document.createElement("div");
                    tempDiv.innerHTML = htmlContent;
                    document.body.appendChild(tempDiv);

                    const canvas = await html2canvas(tempDiv);
                    imgDataUrl = canvas.toDataURL("image/jpeg");
                    document.body.removeChild(tempDiv); // Clean up temporary div

                    resolve(imgDataUrl);

                } else if (fileType === "xls" || fileType === "xlsx") {
                    // Handle Excel files, convert to DOCX
                    const arrayBuffer = e.target.result;
                    let workbook = XLSX.read(arrayBuffer, { type: "array" });
                    const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
                    const data = XLSX.utils.sheet_to_html(firstSheet); // Convert Excel sheet to HTML

                    const doc = new Document({
                        sections: [
                            {
                                properties: {},
                                children: [
                                    new Paragraph({
                                        children: [new TextRun(data)],
                                    }),
                                ],
                            },
                        ],
                    });

                    const buffer = await Packer.toBuffer(doc);
                    const docBlob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document" });
                    const fileName = `converted_file_${new Date().toISOString()}.docx`;

                    // Call the function to save or download the file
                    await saveOrDownloadFile(docBlob, fileName);
                    resolve(docBlob);

                } else {
                    reject(new Error(`Unsupported file type: ${fileType}`));
                }
            };

            if (fileType === "txt" || fileType === "html") {
                reader.readAsText(blob);
            } else if (fileType === "png" || fileType === "jpg" || fileType === "jpeg") {
                reader.readAsDataURL(blob);
            } else if (fileType === "xls" || fileType === "xlsx") {
                reader.readAsArrayBuffer(blob);
            } else {
                reject(new Error(`Unsupported file type: ${fileType}`));
            }
        });

    } catch (error) {
        console.error("Error processing the file:", error);
        alert("There was an error processing the file. Please try again.");
        throw error;
    }
};

// Function to handle the download or saving of the converted file
const saveOrDownloadFile = (fileBlob, fileName) => {
    return new Promise((resolve, reject) => {
        try {
            // Using the `saveAs` method to trigger a download and allow the user to choose the destination
            saveAs(fileBlob, fileName); // This will prompt the user to download and choose where to save
            resolve(true);
        } catch (error) {
            reject(new Error("File saving failed."));
        }
    });
};

export default ToWord;