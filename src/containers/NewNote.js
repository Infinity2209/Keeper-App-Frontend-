/* eslint-disable no-unused-vars */
import React, { useRef, useState } from "react";
import Form from "react-bootstrap/Form";
import LoaderButton from "../components/LoaderButton";
import { onError } from "../libs/errorLib";
import config from "../config";
import "./NewNote.css";
import { API } from "aws-amplify";
import { useNavigate } from "react-router-dom";
import { s3Upload } from "../libs/awsLib";

export default function NewNote() {
  const [noteForms, setNoteForms] = useState([{ content: "", attachment: null }]);
  const navigate = useNavigate();

  function validateForm(content) {
    return content.length > 0;
  }

  function handleFileChange(event, formIndex) {
    const files = event.target.files;
    const updatedNoteForms = [...noteForms];
    updatedNoteForms[formIndex].attachment = files[0];
    setNoteForms(updatedNoteForms);
  }

  async function handleSubmit(event, formIndex) {
    event.preventDefault();
    const { content, attachment } = noteForms[formIndex];

    if (attachment && attachment.size > config.MAX_ATTACHMENT_SIZE) {
      alert(`Please pick a file smaller than ${config.MAX_ATTACHMENT_SIZE / 1000000} MB.`);
      return;
    }

    try {
      const uploadedAttachment = attachment ? await s3Upload(attachment) : null;
      await createNote({
        content,
        attachment: uploadedAttachment
      });

      if (formIndex === noteForms.length - 1) {
        // If it's the last form, navigate back to the homepage
        navigate("/");
      }
    } catch (e) {
      onError(e);
    }
  }

  async function createNote(note) {
    return API.post("notes", "/notes", {
      body: note
    });
  }

  function handleAddForm() {
    setNoteForms((prevForms) => [...prevForms, { content: "", attachment: null }]);
  }

  function handleFormContentChange(event, formIndex) {
    const updatedNoteForms = [...noteForms];
    updatedNoteForms[formIndex].content = event.target.value;
    setNoteForms(updatedNoteForms);
  }

  return (
    <div className="NewNote">
      {noteForms.map((noteForm, index) => (
        <Form key={index} onSubmit={(event) => handleSubmit(event, index)} className="note-form">
          <Form.Group controlId={`content-${index}`}>
            <Form.Control
              value={noteForm.content}
              as="textarea"
              onChange={(event) => handleFormContentChange(event, index)}
            />
          </Form.Group>
          <Form.Group controlId={`file-${index}`}>
            <Form.Label>Attachment</Form.Label>
            <Form.Control onChange={(event) => handleFileChange(event, index)} type="file" />
          </Form.Group>
          <LoaderButton
            block
            type="submit"
            size="lg"
            variant="primary"
            isLoading={false} // Set to appropriate isLoading state for each form
            disabled={!validateForm(noteForm.content)}
          >
            Create
          </LoaderButton>
        </Form>
      ))}
      <button className="add-note-button" onClick={handleAddForm}>
        Add New Note
      </button>
    </div>
  );
}
