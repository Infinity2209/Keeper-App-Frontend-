import axios from "axios";
import { Buffer } from "buffer";
import { jsPDF } from "jspdf"; // Import jsPDF directly
import config from "../config";

const ToPdf = async (note) => {
    console.log("Data received:", note);

    let att = note.attachment;
    console.log("Attachment (relative path):", att);

    // Construct the full S3 URL using the relative path from the attachment
    const fullUrl = `https://${config.s3.BUCKET}.s3.${config.s3.REGION}.amazonaws.com/public/${att}`;
    console.log("Full S3 URL constructed:", fullUrl);

    const extensionOfAtt = att.split(".").pop().toLowerCase();
    console.log("File extension:", extensionOfAtt);

    if (extensionOfAtt === "pdf") {
        alert("Your document is already in PDF Format");
        return null;
    }

    try {
        // Step 1: Download the file from S3
        const fileResponse = await axios.get(fullUrl, { responseType: "arraybuffer" });
        const fileBuffer = Buffer.from(fileResponse.data);
        console.log("File downloaded successfully.", fileBuffer);

        // Step 2: Convert the file to PDF
        const blob = new Blob([fileBuffer], { type: "application/octet-stream" });
        const reader = new FileReader();
        const fileType = att.split('.').pop().toLowerCase();

        return new Promise((resolve, reject) => {
            reader.onload = async function (e) {
                const fileType = att.split('.').pop().toLowerCase();
                let pdfBlob;

                if (fileType === "txt") {
                    // Handle text file conversion
                    const text = e.target.result;
                    const pdf = new jsPDF();
                    pdf.text(text, 10, 10);
                    pdfBlob = pdf.output('blob');
                    viewPdfInConsole(pdfBlob);
                    resolve(pdfBlob);
                } else if (fileType === "png" || fileType === "jpg" || fileType === "jpeg") {
                    // Handle image file conversion
                    const imgData = e.target.result;
                    const pdf = new jsPDF();
                    pdf.addImage(imgData, 'JPEG', 10, 10, 190, 0); // Adjust dimensions as needed
                    pdfBlob = pdf.output('blob');
                    viewPdfInConsole(pdfBlob);
                    resolve(pdfBlob);
                } else if (fileType === "html") {
                    // Handle HTML file conversion
                    const htmlContent = e.target.result;
                    const pdf = new jsPDF();
                    pdf.html(htmlContent, {
                        callback: function (doc) {
                            pdfBlob = doc.output('blob');
                            viewPdfInConsole(pdfBlob);
                            resolve(pdfBlob);
                        }
                    });
                } else {
                    alert("Unsupported file type. Please upload a .txt, .png, .jpg, or .html file.");
                    reject(new Error("Unsupported file type"));
                }
            };

            if (fileType === "txt" || fileType === "html") {
                reader.readAsText(blob);
            } else if (fileType === "png" || fileType === "jpg" || fileType === "jpeg") {
                reader.readAsDataURL(blob);
            } else {
                reject(new Error("Unsupported file type"));
            }
        });
    } catch (error) {
        console.error("Error processing the file:", error);
        throw error;
    }
};

const viewPdfInConsole = (pdfBlob) => {
    const pdfUrl = URL.createObjectURL(pdfBlob);
    console.log("Converted PDF URL:", pdfUrl);
    // Optionally, you can also open the PDF in a new tab
    window.open(pdfUrl);
};

export default ToPdf;
