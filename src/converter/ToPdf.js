import axios from "axios";
import { Storage } from "aws-amplify";
import config from "../config";

const ToPdf = async (note) => {
    const convertToPdf = async (fileBuffer, extension) => {
        const response = await axios.post("http://localhost:5000/convert", {
            fileBuffer: fileBuffer.toString("base64"),
            extension: extension,
        });
        return Buffer.from(response.data.pdfBuffer, "base64");
    };

    console.log("Data received:", note);

    let att = note.attachment;
    console.log("Attachment (relative path):", att);

    // Construct the full S3 URL using the relative path
    const fullUrl = `https://${config.s3.BUCKET}.s3.${config.s3.REGION}.amazonaws.com/public/${att}`;
    console.log("Full S3 URL constructed:", fullUrl);

    const extensionOfAtt = att.split(".").pop().toLowerCase();
    console.log("File extension:", extensionOfAtt);

    if (extensionOfAtt === "pdf") {
        alert("Your document is already in PDF Format");
        return;
    }

    try {
        // Step 1: Download the file from S3
        const fileResponse = await axios.get(fullUrl, { responseType: "arraybuffer" });
        const fileBuffer = Buffer.from(fileResponse.data);
        console.log("File downloaded successfully.");

        // Step 2: Convert the file to PDF
        const convertedPdf = await convertToPdf(fileBuffer, extensionOfAtt);
        console.log("File converted to PDF successfully.");

        // Step 3: Upload the converted PDF back to S3
        const newKey = att.replace(`.${extensionOfAtt}`, ".pdf").split("/").pop();
        const s3UploadResponse = await Storage.put(`${newKey}`, convertedPdf, {
            contentType: "application/pdf",
        });
        console.log("Converted PDF uploaded to S3:", s3UploadResponse.key);

        // Generate the public S3 URL dynamically
        const newUrl = `https://${config.s3.BUCKET}.s3.${config.s3.REGION}.amazonaws.com/public/${newKey}`;
        note.attachment = newUrl;

        console.log("Updated attachment URL:", newUrl);

        // Step 4: Optionally, update the backend with the new URL
        // await updateNoteAttachment(note.noteId, newUrl); // Your backend API call here

        return newUrl; // Return the updated URL if needed
    } catch (error) {
        console.error("Error processing the file:", error);
        throw error;
    }
};

export default ToPdf;
