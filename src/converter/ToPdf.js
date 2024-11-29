import axios from "axios";
import { Buffer } from "buffer";
import { jsPDF } from "jspdf";
import "jspdf-autotable"; // Import autoTable plugin
import config from "../config";
import * as XLSX from "xlsx";

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
                let pdfBlob;

                if (fileType === "xls" || fileType === "xlsx") {
                    // Handle Excel file conversion with table formatting
                    try {
                        const arrayBuffer = e.target.result;
                        const workbook = XLSX.read(arrayBuffer, { type: "array" });
                        const pdf = new jsPDF();

                        workbook.SheetNames.forEach((sheetName, index) => {
                            if (index > 0) pdf.addPage(); // Add a new page for each sheet
                            const sheet = workbook.Sheets[sheetName];
                            const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });

                            // Convert data to a table structure and add it to the PDF
                            pdf.autoTable({
                                head: [data[0]], // First row as headers
                                body: data.slice(1), // Remaining rows as table body
                                startY: 10, // Start position for the table
                                theme: "grid", // Adds grid lines for table
                                headStyles: { fillColor: [22, 160, 133] }, // Optional: Header styling
                            });
                        });

                        pdfBlob = pdf.output('blob');
                        viewPdfInConsole(pdfBlob);
                        resolve(pdfBlob);
                    } catch (error) {
                        console.error("Error during Excel file conversion:", error);
                        reject(new Error("Unsupported file type"));
                    }
                } else if (fileType === "txt") {
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
                } else if (fileType === "docx" || fileType === "doc") {
                    // Handle .docx file conversion
                    const arrayBuffer = e.target.result;
                    try {
                        const mammoth = await import("mammoth"); // Dynamically import mammoth.js
                        const { value: textContent } = await mammoth.extractRawText({ arrayBuffer });
                        const pdf = new jsPDF();
                        pdf.text(textContent, 10, 10);
                        pdfBlob = pdf.output('blob');
                        viewPdfInConsole(pdfBlob);
                        resolve(pdfBlob);
                    } catch (error) {
                        console.error("Error processing .docx file:", error);
                        reject(new Error("Failed to process .docx file"));
                    }
                } else {
                    reject(new Error("Unsupported file type"));
                }
            };

            if (fileType === "txt" || fileType === "html") {
                reader.readAsText(blob);
            } else if (fileType === "png" || fileType === "jpg" || fileType === "jpeg") {
                reader.readAsDataURL(blob);
            } else if (fileType === "xls" || fileType === "xlsx" || fileType === "docx" || fileType === "doc") {
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

const viewPdfInConsole = (pdfBlob) => {
    const pdfUrl = URL.createObjectURL(pdfBlob);
    console.log("Converted PDF URL:", pdfUrl);
    window.open(pdfUrl); // Open the generated PDF in a new tab
};

export default ToPdf;
