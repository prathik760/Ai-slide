import React, { useState, useRef } from 'react';
import './SlideEditor.css';

const SlideEditor = ({ slides, setSlides }) => {
  const [draggedIndex, setDraggedIndex] = useState(null);
  const [selectedTemplate, setSelectedTemplate] = useState('default');
  const dragItem = useRef(null);
  const dragOverItem = useRef(null);

  const handleEdit = (index, field, value) => {
    const updatedSlides = slides.map((slide, idx) =>
      idx === index ? { ...slide, [field]: value } : slide
    );
    setSlides(updatedSlides);
  };

  const handleAddSlide = () => {
    const newSlide = {
      title: 'New Slide',
      content: 'Add content here...',
      layout: selectedTemplate
    };
    setSlides([...slides, newSlide]);
  };

  const handleDeleteSlide = (index) => {
    setSlides(slides.filter((_, idx) => idx !== index));
  };

  const handleDuplicateSlide = (index) => {
    const slideToDuplicate = slides[index];
    const newSlide = {
      ...slideToDuplicate,
      title: `${slideToDuplicate.title} (Copy)`
    };
    const updatedSlides = [...slides];
    updatedSlides.splice(index + 1, 0, newSlide);
    setSlides(updatedSlides);
  };

  const handleDragStart = (e, index) => {
    dragItem.current = index;
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragEnter = (e, index) => {
    dragOverItem.current = index;
  };

  const handleDragEnd = () => {
    if (dragItem.current !== null && dragOverItem.current !== null) {
      const newSlides = [...slides];
      const draggedSlide = newSlides[dragItem.current];
      
      // Remove the dragged slide
      newSlides.splice(dragItem.current, 1);
      
      // Add it back at the new position
      if (dragItem.current < dragOverItem.current) {
        newSlides.splice(dragOverItem.current - 1, 0, draggedSlide);
      } else {
        newSlides.splice(dragOverItem.current, 0, draggedSlide);
      }
      
      dragItem.current = null;
      dragOverItem.current = null;
      setDraggedIndex(null);
      setSlides(newSlides);
    }
  };

  const handleTemplateSelect = (template) => {
    setSelectedTemplate(template);
  };

  const templates = [
    { id: 'default', name: 'Default', icon: '📄' },
    { id: 'title', name: 'Title', icon: '🏷️' },
    { id: 'content', name: 'Content', icon: '📝' },
    { id: 'image', name: 'Image', icon: '🖼️' },
    { id: 'comparison', name: 'Comparison', icon: '⚖️' }
  ];

  return (
    <div className="slide-editor-container">
      <div className="editor-header">
        <h2>Edit Slides</h2>
        <div className="editor-actions">
          <button className="editor-button secondary">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
              <polyline points="17 21 17 13 7 13 7 21"></polyline>
              <polyline points="7 3 7 8 15 8"></polyline>
            </svg>
            Save
          </button>
          <button className="editor-button">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
              <polyline points="7 10 12 15 17 10"></polyline>
              <line x1="12" y1="15" x2="12" y2="3"></line>
            </svg>
            Export
          </button>
        </div>
      </div>

      <div className="template-selector">
        {templates.map((template) => (
          <div
            key={template.id}
            className={`template-option ${selectedTemplate === template.id ? 'selected' : ''}`}
            onClick={() => handleTemplateSelect(template.id)}
          >
            <div className="template-icon">{template.icon}</div>
            <div className="template-name">{template.name}</div>
          </div>
        ))}
      </div>

      <div className="slides-container">
        {slides.map((slide, index) => (
          <div
            key={index}
            className={`slide-card ${draggedIndex === index ? 'dragging' : ''}`}
            draggable
            onDragStart={(e) => handleDragStart(e, index)}
            onDragEnter={(e) => handleDragEnter(e, index)}
            onDragEnd={handleDragEnd}
          >
            <div className="drag-handle">
              <span></span>
              <span></span>
              <span></span>
            </div>
            
            <div className="slide-card-header">
              <div className="slide-number">Slide {index + 1}</div>
              <div className="slide-actions">
                <button 
                  className="slide-action-button"
                  onClick={() => handleDuplicateSlide(index)}
                  title="Duplicate slide"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                  </svg>
                </button>
                <button 
                  className="slide-action-button danger"
                  onClick={() => handleDeleteSlide(index)}
                  title="Delete slide"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="3 6 5 6 21 6"></polyline>
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                  </svg>
                </button>
              </div>
            </div>
            
            <div className="slide-content">
              <input
                type="text"
                value={slide.title}
                onChange={(e) => handleEdit(index, 'title', e.target.value)}
                placeholder="Slide Title"
                className="slide-title-input"
              />
              <textarea
                value={slide.content}
                onChange={(e) => handleEdit(index, 'content', e.target.value)}
                placeholder="Slide Content"
                className="slide-content-textarea"
              />
              
              <div className="slide-options">
                <div className="slide-option">
                  <label>Layout:</label>
                  <select 
                    value={slide.layout || 'default'}
                    onChange={(e) => handleEdit(index, 'layout', e.target.value)}
                  >
                    <option value="default">Default</option>
                    <option value="title">Title Only</option>
                    <option value="content">Content Only</option>
                    <option value="two-column">Two Column</option>
                    <option value="image-text">Image + Text</option>
                  </select>
                </div>
                
                <div className="slide-option">
                  <label>Animation:</label>
                  <select 
                    value={slide.animation || 'none'}
                    onChange={(e) => handleEdit(index, 'animation', e.target.value)}
                  >
                    <option value="none">None</option>
                    <option value="fade">Fade</option>
                    <option value="slide">Slide</option>
                    <option value="zoom">Zoom</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      <div className="add-slide-container">
        <button 
          onClick={handleAddSlide}
          className="add-slide-button"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
          Add Slide
        </button>
      </div>
    </div>
  );
};

export default SlideEditor;