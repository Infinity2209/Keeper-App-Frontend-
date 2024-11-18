import React, { useRef, useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { API, Storage } from "aws-amplify";
import { onError } from "../libs/errorLib";
import Form from "react-bootstrap/Form";
import LoaderButton from "../components/LoaderButton";
import config from "../config";
import "./Notes.css";
import { s3Upload } from "../libs/awsLib";

export default function Notes() {
    const file = useRef(null);
    const { id } = useParams();
    const navigate = useNavigate();
    const [note, setNote] = useState(null);
    const [content, setContent] = useState("");
    const [isDeleting, setIsDeleting] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        function loadNote() {
            return API.get("notes", `/notes/${id}`);
        }
        async function onLoad() {
            try {
                const note = await loadNote();
                const { content, attachment } = note;

                if (attachment) {
                    // Get the signed S3 URL
                    note.attachmentURL = await Storage.vault.get(attachment);
                }

                setContent(content);
                setNote(note);
            } catch (e) {
                onError(e);
            }
        }
        onLoad();
    }, [id]);

    function validateForm() {
        return content.length > 0;
    }

    function saveNote(note) {
        return API.put("notes", `/notes/${id}`, {
            body: note,
        });
    }

    async function handleSubmit(event) {
        let attachment;
        event.preventDefault();

        if (file.current && file.current.size > config.MAX_ATTACHMENT_SIZE) {
            alert(
                `Please pick a file smaller than ${config.MAX_ATTACHMENT_SIZE / 1000000
                } MB.`
            );
            return;
        }

        setIsLoading(true);
        try {
            if (file.current) {
                attachment = await s3Upload(file.current);
            }
            await saveNote({
                content,
                attachment: attachment || note.attachment,
            });
            navigate("/");
        } catch (e) {
            onError(e);
            setIsLoading(false);
        }
    }

    function deleteNote() {
        return API.del("notes", `/notes/${id}`);
    }

    async function handleDelete(event) {
        event.preventDefault();
        const confirmed = window.confirm(
            "Are you sure you want to delete this note?"
        );
        if (!confirmed) {
            return;
        }

        setIsDeleting(true);
        try {
            await deleteNote();
            navigate("/");
        } catch (e) {
            onError(e);
            setIsDeleting(false);
        }
    }

    const renderAttachment = () => {
        if (note.attachmentURL) {
            const cleanFilePath = note.attachmentURL.split('?')[0];
            const fileExtension = cleanFilePath.split('.').pop().toLowerCase();
            if (["jpg", "jpeg", "png", "svg"].includes(fileExtension)) {
                return <img src={note.attachmentURL} alt="attachment" style={{ width: '100%', height: 'auto' }} />;
            } else if (fileExtension === "pdf") {
                return <embed src={note.attachmentURL} width="100%" height="500px" type="application/pdf" />;
            } else if (["doc", "docx"].includes(fileExtension)) {
                return <div>Word Document: <a href={note.attachmentURL} target="_blank" rel="noopener noreferrer">Open Document</a></div>;
            } else if (["xls", "xlsx"].includes(fileExtension)) {
                return <div>Excel File: <a href={note.attachmentURL} target="_blank" rel="noopener noreferrer">Open Excel</a></div>;
            } else {
                return <div>File type not supported or recognized.</div>;
            }
        }
    };

    return (
        <div className="Notes">
            {note && (
                <Form onSubmit={handleSubmit}>
                    <div className="flex flex-column">
                        <Form.Group controlId="file">
                            <Form.Label>Attachment</Form.Label>
                            <div>
                                {renderAttachment()}
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
                        type="submit"
                        isLoading={isLoading}
                        disabled={!validateForm()}
                    >
                        <i className="material-icons">&#xe161;</i> Save
                    </LoaderButton>
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
    );
}
