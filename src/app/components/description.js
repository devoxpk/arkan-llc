import React, { useEffect, useState } from "react";
import { db } from "../firebase"; // Firestore instance
import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore"; // Firestore methods

export default function Description() {
  const params = new URLSearchParams(window.location.search);
  const cat = params.get("cat"); // Collection name
  let editMode = params.get("edit"); // Edit mode check

  editMode = editMode === "" || editMode === "true";

  const [sections, setSections] = useState([]); // Store all sections
  const [loading, setLoading] = useState(true);
  const [newHeader, setNewHeader] = useState(""); // For new header
  const [newContent, setNewContent] = useState(""); // For new content
  const [hasAccess, setHasAccess] = useState(false); // Access state
  const [editingIndex, setEditingIndex] = useState(null); // Index of the section being edited
  const validKey = "fabfbuygi328y902340"; // Required key for edit mode

  useEffect(() => {
    const storedKey = localStorage.getItem("A98398HBFBB93BNABSN");
    if (storedKey === validKey) {
      setHasAccess(true);
    }

    const fetchSections = async () => {
      try {
        const docRef = doc(db, cat, "desc");
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          setSections(data.sections || []); // Load sections
        } else {
          console.log("No document found! Setting default document.");
          await setDoc(docRef, { sections: [] });
          setSections([]); // Initialize with empty sections
        }
      } catch (error) {
        console.error("Error fetching document:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchSections();
  }, [cat, validKey]);

  const toggleExpand = (index) => {
    setSections((prev) =>
      prev.map((section, i) =>
        i === index ? { ...section, expanded: !section.expanded } : section
      )
    );
  };

  const handleAddSection = () => {
    if (newHeader && newContent) {
      setSections((prev) => [
        ...prev,
        { header: newHeader, content: newContent, expanded: false },
      ]);
      setNewHeader("");
      setNewContent("");
    } else {
      alert("Please provide both header and content.");
    }
  };

  const handleDeleteSection = (index) => {
    const updatedSections = sections.filter((_, i) => i !== index);
    setSections(updatedSections);
  };

  const handleEditSection = (index) => {
    const sectionToEdit = sections[index];
    setNewHeader(sectionToEdit.header);
    setNewContent(sectionToEdit.content);
    setEditingIndex(index);
  };

  const handleSaveEdit = () => {
    if (editingIndex !== null) {
      const updatedSections = sections.map((section, index) =>
        index === editingIndex
          ? { ...section, header: newHeader, content: newContent }
          : section
      );
      setSections(updatedSections);
      setEditingIndex(null);
      setNewHeader("");
      setNewContent("");
    }
  };

  const handleSaveChanges = async () => {
    try {
      const docRef = doc(db, cat, "desc");
      await updateDoc(docRef, {
        sections: sections.map((section) => ({
          header: section.header,
          content: section.content,
        })),
      });
      alert("Sections updated successfully!");
    } catch (error) {
      console.error("Error updating sections:", error);
      alert("Failed to save changes.");
    }
  };

  return (
    <div>
      <br />
      {loading ? (
        <p>Loading...</p>
      ) : (
        <div>
          {sections.map((section, index) => (
            <div key={index} style={{ marginBottom: "10px" }}>
              <div
                onClick={() => toggleExpand(index)}
                className="description-header" style={{fontWeight:"bold"}}
              >
                {section.header}
                <span className="expand-symbol">{section.expanded ? "-" : "+"}</span>
              </div>

              {section.expanded && (
                <div className="description-content">
                  <p
                    dangerouslySetInnerHTML={{
                      __html: section.content.replace(/\n/g, "<br />"),
                    }}
                  />
                  {editMode && hasAccess && (
                    <div style={{ marginTop: "10px" }}>
                      <button onClick={() => handleEditSection(index)}>Edit</button>
                      <button
                        onClick={() => handleDeleteSection(index)}
                        style={{ marginLeft: "10px" }}
                      >
                        Delete
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}

          {editMode && hasAccess && (
            <div style={{ marginTop: "20px" }}>
              <h3>{editingIndex !== null ? "Edit Section" : "Add New Section"}</h3>
              <input
                type="text"
                placeholder="Header"
                value={newHeader}
                onChange={(e) => setNewHeader(e.target.value)}
                style={{ display: "block", marginBottom: "10px" ,border:"1px solid black",width:"50%"}}
              />
              <textarea
                placeholder="Content"
                value={newContent}
                onChange={(e) => setNewContent(e.target.value)}
                rows="5"
                cols="50"
                style={{ display: "block", marginBottom: "10px" ,border:"1px solid black",width:"100%"}}
              ></textarea>
              {editingIndex !== null ? (
                <button onClick={handleSaveEdit} style={{marginBottom:"12px"}}>Save Edit</button>
              ) : (
                <button onClick={handleAddSection} style={{marginBottom:"12px"}}>Add Section</button>
              )}
              <button
                onClick={handleSaveChanges}
                style={{ marginLeft: "10px", display: "block" ,marginBottom:"12px"}}
              >
                Save All Changes
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
