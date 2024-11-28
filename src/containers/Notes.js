import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { API } from "aws-amplify";
import { onError } from "../libs/errorLib";
import Form from "react-bootstrap/Form";
import LoaderButton from "../components/LoaderButton";
import { Storage } from 'aws-amplify';
import "./Notes.css";
import ToPdf from "../converter/ToPdf";
import { ToImg } from "../converter/ToImg";
import ToWord from "../converter/ToWord";
import ToPng from "../converter/ToPng";

export default function Notes() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [note, setNote] = useState(null);
    const [content, setContent] = useState("");
    const [attachmentUrl, setAttachmentUrl] = useState(""); // Store the attachment URL
    const [attachmentContent, setAttachmentContent] = useState(""); // Store the content of the .txt file
    const [isDeleting, setIsDeleting] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false); // State for sidebar visibility
    const [convertedFile, setConvertedFile] = useState("");

    // Fetch the note when the component mounts
    useEffect(() => {
        async function loadNote() {
            try {
                const fetchedNote = await API.get("notes", `/notes/${id}`);

                // Check if attachment exists and fetch URL if necessary
                if (fetchedNote.attachment) {
                    const fileUrl = await Storage.get(fetchedNote.attachment);
                    setAttachmentUrl(fileUrl);

                    // If the attachment is a .txt file, fetch its content
                    if (fetchedNote.attachment.endsWith('.txt')) {
                        const fileContent = await fetchTextFile(fetchedNote.attachment);
                        setAttachmentContent(fileContent);
                    }
                }

                setContent(fetchedNote.content);
                setNote(fetchedNote);
            } catch (e) {
                onError(e);
            }
        }

        loadNote();
    }, [id]);

    // Fetch content of a .txt file from S3
    const fetchTextFile = async (fileKey) => {
        try {
            const file = await Storage.get(fileKey, { download: true });
            const text = await file.Body.text(); // Read the text content
            return text;
        } catch (error) {
            console.error("Error fetching .txt file content:", error);
            return "";
        }
    };

    // Validate the form
    function validateForm() {
        return content.length > 0;
    }

    // Save note to the API
    function saveNote(note) {
        return API.put("notes", `/notes/${id}`, {
            body: note,
        });
    }

    const convertToPDF = async (note) => {
        try {
            const updatedFile = await ToPdf(note); // Wait for the file conversion
            await setConvertedFile(updatedFile); // Update the state
            console.log("File converted successfully:", updatedFile); // Log the converted file directly
            // await s3Upload(updatedFile)
        } catch (error) {
            console.error("Error converting file to PDF:", error);
        }
    };

    const convertToJpg = async (note) => {
        try {
            const updatedFile = await ToImg(note);
            if (updatedFile) {
                console.log("Converted to JPG/JPEG:", updatedFile);
                setConvertedFile(updatedFile); // Set the converted file URL
            } else {
                console.error("Conversion failed.");
            }
        } catch (error) {
            console.error("Error converting file:", error);
        }
    };

    const convertToWord = async (note) => {
        try {
            const updatedFile = await ToWord(note); // Wait for the file conversion (You need to implement ToWord function)
            await setConvertedFile(updatedFile); // Update the state with the converted file
            console.log("File converted successfully to Word:", updatedFile); // Log the converted file
            // You can uncomment and add your S3 upload function if needed: await s3Upload(updatedFile);
        } catch (error) {
            console.error("Error converting file to Word:", error);
        }
    };
    
    const convertToPng = async (note) => {
        try {
            const updatedFile = await ToPng(note); // Wait for the file conversion (You may handle PNG conversion similarly to JPG)
            if (updatedFile) {
                console.log("Converted to PNG:", updatedFile);
                setConvertedFile(updatedFile); // Set the converted PNG file URL
            } else {
                console.error("PNG conversion failed.");
            }
        } catch (error) {
            console.error("Error converting file to PNG:", error);
        }
    };
    

    // UseEffect to log state changes if needed
    useEffect(() => {
        if (convertedFile) {
            console.log("Converted file to parse:", convertedFile);
        }
    }, [convertedFile]);

    // Handle form submission
    async function handleSubmit(event) {
        event.preventDefault();

        setIsLoading(true);
        try {
            await saveNote({
                content,
                attachment: attachmentUrl || note.attachment,
            });
            navigate("/");
        } catch (e) {
            onError(e);
            setIsLoading(false);
        }
    }

    // Delete the note
    function deleteNote() {
        return API.del("notes", `/notes/${id}`);
    }

    // Handle delete button click
    async function handleDelete(event) {
        event.preventDefault();
        const confirmed = window.confirm("Are you sure you want to delete this note?");
        if (!confirmed) return;

        setIsDeleting(true);
        try {
            await deleteNote();
            navigate("/");
        } catch (e) {
            onError(e);
            setIsDeleting(false);
        }
    }

    // Convert and render the attachment based on the file type
    const renderAttachment = () => {
        if (attachmentUrl) {
            const cleanFilePath = attachmentUrl.split('?')[0]; // Remove query params if present
            const fileExtension = cleanFilePath.split('.').pop().toLowerCase(); // Extract the file extension

            // Handle Image files (JPEG, PNG, etc.)
            if (["jpg", "jpeg", "png", "gif", "bmp"].includes(fileExtension)) {
                return <img src={attachmentUrl} alt="attachment" style={{ width: '100%', height: 'auto' }} />;
            }

            // Handle PDF files
            else if (fileExtension === "pdf") {
                return <embed src={attachmentUrl} width="100%" height="500px" type="application/pdf" />;
            }

            // Handle Word Documents (DOCX, DOC)
            else if (["doc", "docx"].includes(fileExtension)) {
                return <div>Word Document: <a href={attachmentUrl} target="_blank" rel="noopener noreferrer">Open Document</a></div>;
            }

            // Handle Excel files (XLSX, XLS)
            else if (["xls", "xlsx"].includes(fileExtension)) {
                return <div>Excel File: <a href={attachmentUrl} target="_blank" rel="noopener noreferrer">Open Excel</a></div>;
            }

            // Handle Text files
            else if (fileExtension === "txt") {
                return (
                    <pre className="text-file-content">{attachmentContent}</pre>
                );
            }

            // Handle other file types (e.g., unknown)
            else {
                return <div>File type not supported or recognized. <a href={attachmentUrl} target="_blank" rel="noopener noreferrer">Download File</a></div>;
            }
        }
    };

    function toggleSidebar() {
        setIsSidebarOpen(!isSidebarOpen); // Toggle the sidebar visibility
    }

    return (
        <div className="Notes">
            <div className="main-content">
                {note && (
                    <Form onSubmit={handleSubmit}>
                        <div className="flex flex-column">
                            <Form.Group controlId="file">
                                <Form.Label>Attachment</Form.Label>
                                <div>
                                    {renderAttachment()} {/* Call renderAttachment to display the file */}
                                </div>
                            </Form.Group>
                            <Form.Group controlId="content">
                                <Form.Control
                                    as="textarea"
                                    value={content}
                                    onChange={(e) => setContent(e.target.value)}
                                />
                            </Form.Group>
                        </div>

                        <LoaderButton
                            block
                            size="lg"
                            isLoading={isLoading}
                            disabled={!validateForm()}
                            style={{ backgroundColor: 'yellow', color: 'black' }}
                            onClick={toggleSidebar} // Open Sidebar when clicked
                        >
                            <i className="material-icons">autorenew</i> Export As
                        </LoaderButton>
                        {/* Save Button */}
                        <LoaderButton
                            block
                            size="lg"
                            isLoading={isLoading}
                            disabled={!validateForm()}
                        >
                            <i className="material-icons">&#xe161;</i> Save
                        </LoaderButton>

                        {/* Delete Button */}
                        <LoaderButton
                            block
                            size="lg"
                            variant="danger"
                            onClick={handleDelete}
                            isLoading={isDeleting}
                        >
                            <i className="material-icons">&#xe872;</i> Delete
                        </LoaderButton>
                    </Form>
                )}
            </div>

            {/* Sidebar */}
            {isSidebarOpen && (
                <div className={`sidebar ${isSidebarOpen ? "open" : ""}`}>
                    <div className="sidebar-content">
                        <div className="side">
                            <h3>Choose an Option</h3>
                        </div>
                        <ul>
                            <li className="howlist" onClick={() => convertToPDF(note)}>PDF</li>
                            <li className="howlist" onClick={() => convertToJpg(note)}>JPG/JPEG</li>
                            <li className="howlist" onClick={() => convertToWord(note)}>WORD</li>
                            <li className="howlist" onClick={() => convertToPng(note)}>PNG</li>
                        </ul>
                    </div>
                </div>
            )}
        </div>
    );
}
