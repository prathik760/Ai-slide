import React, { useState, useEffect } from 'react';
import PptxGenjs from "pptxgenjs";
import jsPDF from 'jspdf';
import './PPTPreview.css';


const PPTPreview = ({ 
  slides, 
  setSlides, 
  prompt, 
  onPromptChange,
  isGenerating,
  onSlidesGenerated,
  onPptxGenerated,
  onPdfGenerated
}) => {
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [viewMode, setViewMode] = useState('grid');
  const [editingSlide, setEditingSlide] = useState(null);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editedSlide, setEditedSlide] = useState({
    title: '',
    subtitle: '',
    content: ''
  });
  const [editPrompt, setEditPrompt] = useState('');
  const [isEditing, setIsEditing] = useState(false);


  // ✅ FIXED: Improved PPTX download with both image and text
  const handleDownloadPPTX = async () => {
    try {
      const pptx = new PptxGenjs();
      
      slides.forEach((slide, index) => {
        const slideObj = pptx.addSlide();
        
        slideObj.background = { color: 'FFFFFF' };
        
        if (slide.image) {
          try {
            slideObj.addImage({
              src: slide.image,
              x: 0.5,
              y: 0.5,
              w: 8,
              h: 3.5
            });
          } catch (err) {
            console.warn('Could not load image:', err);
          }
        }
        
        slideObj.addText(slide.title, {
          x: 0.5,
          y: 4.2,
          w: 8,
          h: 0.6,
          fontSize: 28,
          bold: true,
          color: '#363636',
          align: 'left'
        });
        
        if (slide.subtitle) {
          slideObj.addText(slide.subtitle, {
            x: 0.5,
            y: 5,
            w: 8,
            h: 0.4,
            fontSize: 16,
            color: '#666666',
            align: 'left',
            italic: true
          });
        }
        
        if (slide.content) {
          const cleanedContent = removeMarkdown(slide.content);
          slideObj.addText(cleanedContent, {
            x: 0.5,
            y: 5.6,
            w: 8,
            h: 1.4,
            fontSize: 12,
            color: '#363636',
            align: 'left',
            valign: 'top',
            wrap: true,
            lineSpacing: 18
          });
        }
      });
      
      await pptx.writeFile({ 
        fileName: `${prompt || 'presentation'}.pptx` 
      });
      
      if (onPptxGenerated) {
        onPptxGenerated();
      }
    } catch (error) {
      console.error('Error generating PPTX:', error);
      alert('Failed to generate PPTX file. Please try again.');
    }
  };


  // ✅ FIXED: Improved PDF download with both image and text
  const handleDownloadPDF = () => {
    try {
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });
      
      slides.forEach((slide, index) => {
        if (index > 0) {
          pdf.addPage();
        }
        
        let yPosition = 20;
        
        if (slide.image) {
          try {
            pdf.addImage(slide.image, 'JPEG', 20, yPosition, 170, 100);
            yPosition += 110;
          } catch (err) {
            console.warn('Could not add image:', err);
          }
        }
        
        pdf.setFontSize(20);
        pdf.setFont('helvetica', 'bold');
        pdf.text(slide.title, 20, yPosition);
        yPosition += 10;
        
        if (slide.subtitle) {
          pdf.setFontSize(14);
          pdf.setFont('helvetica', 'italic');
          pdf.text(slide.subtitle, 20, yPosition);
          yPosition += 8;
        }
        
        if (slide.content) {
          pdf.setFontSize(11);
          pdf.setFont('helvetica', 'normal');
          const cleanedContent = removeMarkdown(slide.content);
          const lines = pdf.splitTextToSize(cleanedContent, 170);
          pdf.text(lines, 20, yPosition);
        }
      });
      
      pdf.save(`${prompt || 'presentation'}.pdf`);
      
      if (onPdfGenerated) {
        onPdfGenerated();
      }
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Failed to generate PDF file. Please try again.');
    }
  };


  const handleSlideClick = (index) => {
    setCurrentSlideIndex(index);
    setViewMode('viewer');
  };


  const handlePrevSlide = () => {
    setCurrentSlideIndex((prev) => (prev > 0 ? prev - 1 : slides.length - 1));
  };


  const handleNextSlide = () => {
    setCurrentSlideIndex((prev) => (prev < slides.length - 1 ? prev + 1 : 0));
  };


  const handleDotClick = (index) => {
    setCurrentSlideIndex(index);
  };


  const handleBackToGrid = () => {
    setViewMode('grid');
  };


  const handleEditSlide = (index) => {
    setEditingSlide(index);
    setEditedSlide({
      title: slides[index].title,
      subtitle: slides[index].subtitle || '',
      content: slides[index].content || ''
    });
    setEditModalOpen(true);
  };


  const handleSaveSlide = () => {
    const updatedSlides = slides.map((slide, idx) => {
      if (idx === editingSlide) {
        return { 
          ...slide, 
          title: editedSlide.title,
          subtitle: editedSlide.subtitle,
          content: editedSlide.content
        };
      }
      return slide;
    });
    
    setSlides(updatedSlides);
    setEditModalOpen(false);
    setEditingSlide(null);
  };


  const handleCancelEdit = () => {
    setEditModalOpen(false);
    setEditingSlide(null);
  };


  const handleInputChange = (field, value) => {
    setEditedSlide(prev => ({
      ...prev,
      [field]: value
    }));
  };


  const handleDeleteSlide = (index) => {
    const updatedSlides = slides.filter((_, idx) => idx !== index);
    setSlides(updatedSlides);
    if (currentSlideIndex >= updatedSlides.length && currentSlideIndex > 0) {
      setCurrentSlideIndex(currentSlideIndex - 1);
    }
    if (updatedSlides.length === 0) {
      setViewMode('grid');
    }
  };


  const handleAddSlide = () => {
    const newSlide = {
      title: 'New Slide',
      subtitle: 'Enter subtitle here',
      content: 'Add your content here...',
      type: 'content',
      image: `https://picsum.photos/seed/new-slide-${Date.now()}/800/450.jpg`,
      layout: 'content'
    };
    const updatedSlides = [...slides, newSlide];
    setSlides(updatedSlides);
    setCurrentSlideIndex(updatedSlides.length - 1);
    setViewMode('viewer');
  };


  const handleRegenerateImage = (index) => {
    const updatedSlides = slides.map((slide, idx) => {
      if (idx === index) {
        return {
          ...slide,
          image: `https://picsum.photos/seed/${slide.title.replace(/\s+/g, '-').toLowerCase()}-${Date.now()}/800/450.jpg`
        };
      }
      return slide;
    });
    setSlides(updatedSlides);
  };


  const handleEditWithAI = async () => {
    if (!editPrompt.trim()) return;
    
    setIsEditing(true);
    
    try {
      const response = await fetch('http://localhost:5001/api/edit-slide', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          slide: slides[editingSlide],
          prompt: editPrompt
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to edit slide');
      }

      const data = await response.json();
      
      const updatedSlides = slides.map((slide, idx) => {
        if (idx === editingSlide) {
          return {
            ...slide,
            title: data.title,
            subtitle: data.subtitle || '',
            content: data.content || ''
          };
        }
        return slide;
      });
      
      setSlides(updatedSlides);
      setEditPrompt('');
      setIsEditing(false);
    } catch (error) {
      console.error('Error editing slide:', error);
      alert('Failed to edit slide. Please try again.');
      setIsEditing(false);
    }
  };


  const removeMarkdown = (text) => {
    if (!text) return '';
    
    text = text.replace(/\*\*(.*?)\*\*/g, '$1');
    text = text.replace(/\*(.*?)\*/g, '$1');
    text = text.replace(/__(.*?)__/g, '$1');
    text = text.replace(/`(.*?)`/g, '$1');
    text = text.replace(/\[(.*?)\]\((.*?)\)/g, '$1');
    
    return text;
  };


  const formatContent = (content) => {
    if (!content) return [];
    
    const lines = content.split('\n').filter(line => line.trim());
    const elements = [];
    let i = 0;
    
    while (i < lines.length) {
      const line = lines[i].trim();
      
      const boldMatch = line.match(/^\*\*(.*?)\*\*:\s*(.*)/);
      if (boldMatch) {
        elements.push(
          <div key={`bold-${i}`} className="bold-heading">
            <h3 className="section-heading">{boldMatch[1]}</h3>
            {boldMatch[2] && <p className="heading-content">{boldMatch[2]}</p>}
          </div>
        );
        i++;
        continue;
      }
      
      if (line.match(/^\*\*(.*?)\*\*$/)) {
        const text = line.replace(/\*\*(.*?)\*\*/g, '$1');
        elements.push(
          <h3 key={`heading-${i}`} className="section-heading">
            {text}
          </h3>
        );
        i++;
        continue;
      }
      
      const bulletMatch = line.match(/^[•\-\*]\s+(.*)/);
      if (bulletMatch) {
        const bulletItems = [];
        while (i < lines.length && lines[i].trim().match(/^[•\-\*]\s+/)) {
          const item = lines[i].trim().replace(/^[•\-\*]\s+/, '');
          const cleanedItem = removeMarkdown(item);
          bulletItems.push(
            <li key={`bullet-${i}`} className="bullet-item">
              {cleanedItem}
            </li>
          );
          i++;
        }
        elements.push(
          <ul key={`list-${i}`} className="content-list bullet-list">
            {bulletItems}
          </ul>
        );
        continue;
      }
      
      const numberMatch = line.match(/^\d+\.\s+(.*)/);
      if (numberMatch) {
        const numberedItems = [];
        while (i < lines.length && lines[i].trim().match(/^\d+\.\s+/)) {
          const item = lines[i].trim().replace(/^\d+\.\s+/, '');
          const cleanedItem = removeMarkdown(item);
          numberedItems.push(
            <li key={`number-${i}`} className="numbered-item">
              {cleanedItem}
            </li>
          );
          i++;
        }
        elements.push(
          <ol key={`ordered-list-${i}`} className="content-list numbered-list">
            {numberedItems}
          </ol>
        );
        continue;
      }
      
      if (line) {
        const cleanedText = removeMarkdown(line);
        elements.push(
          <p key={`para-${i}`} className="content-paragraph">
            {cleanedText}
          </p>
        );
      }
      
      i++;
    }
    
    return elements;
  };


  if (slides.length === 0) {
    return (
      <div className="no-slides">
        <svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
          <line x1="9" y1="9" x2="15" y2="9"></line>
          <line x1="9" y1="15" x2="15" y2="15"></line>
        </svg>
        <p>No slides yet!</p>
        <p>Start chatting with the AI to generate your presentation.</p>
      </div>
    );
  }


  if (viewMode === 'viewer') {
    const currentSlide = slides[currentSlideIndex];
    const isTitleSlide = currentSlide.type === 'title';
    
    return (
      <div className="slide-viewer">
        <div className="slide-viewer-header">
          <div className="slide-viewer-title">
            {currentSlide.title} ({currentSlideIndex + 1}/{slides.length})
          </div>
          <div className="slide-viewer-controls">
            <button 
              className="slide-viewer-button" 
              onClick={() => handleRegenerateImage(currentSlideIndex)}
              title="Regenerate image"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="23 4 23 10 17 10"></polyline>
                <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path>
              </svg>
            </button>
            <button 
              className="slide-viewer-button" 
              onClick={() => handleEditSlide(currentSlideIndex)}
              title="Edit slide"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
              </svg>
            </button>
            <button 
              className="slide-viewer-button" 
              onClick={() => handleDeleteSlide(currentSlideIndex)}
              title="Delete slide"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="3 6 5 6 21 6"></polyline>
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
              </svg>
            </button>
            <button 
              className="slide-viewer-button" 
              onClick={handleAddSlide}
              title="Add new slide"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="5" x2="12" y2="19"></line>
                <line x1="5" y1="12" x2="19" y2="12"></line>
              </svg>
            </button>
            <button className="slide-viewer-button" onClick={handleBackToGrid} title="Back to grid view">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="7" height="7"></rect>
                <rect x="14" y="3" width="7" height="7"></rect>
                <rect x="3" y="14" width="7" height="7"></rect>
                <rect x="14" y="14" width="7" height="7"></rect>
              </svg>
            </button>
            <button 
              className="slide-viewer-button" 
              onClick={handleDownloadPPTX} 
              title="Download PPTX"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                <polyline points="7 10 12 15 17 10"></polyline>
                <line x1="12" y1="15" x2="12" y2="3"></line>
              </svg>
            </button>
            <button 
              className="slide-viewer-button" 
              onClick={handleDownloadPDF} 
              title="Download PDF"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                <polyline points="7 10 12 15 17 10"></polyline>
                <line x1="12" y1="15" x2="12" y2="3"></line>
              </svg>
            </button>
          </div>
        </div>
        
        <div className="slide-viewer-content">
          <div className="slide-viewer-slide">
            <div className="slide-number-background">
              {String(currentSlideIndex + 1).padStart(2, '0')}
            </div>
            
            {isTitleSlide ? (
              <div className="slide-title-layout">
                <div className="slide-title-image-section">
                  {currentSlide.image && (
                    <img 
                      src={currentSlide.image} 
                      alt={currentSlide.title} 
                      className="slide-title-image"
                    />
                  )}
                </div>
                <div className="slide-title-text-section">
                  <h1 className="slide-main-title">{currentSlide.title}</h1>
                  {currentSlide.subtitle && (
                    <h2 className="slide-main-subtitle">{currentSlide.subtitle}</h2>
                  )}
                </div>
              </div>
            ) : (
              <div className="slide-content-layout">
                <div className="slide-content-image-section">
                  {currentSlide.image && (
                    <div className="slide-image-container">
                      <img 
                        src={currentSlide.image} 
                        alt={currentSlide.title} 
                        className="slide-content-image"
                      />
                    </div>
                  )}
                </div>
                <div className="slide-content-text-section">
                  <h1 className="slide-content-title">{currentSlide.title}</h1>
                  {currentSlide.subtitle && (
                    <h2 className="slide-content-subtitle">{currentSlide.subtitle}</h2>
                  )}
                  <div className="slide-content-body">
                    {formatContent(currentSlide.content)}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
        
        <div className="slide-viewer-footer">
          <button 
            className="slide-nav-button" 
            onClick={handlePrevSlide}
            title="Previous slide"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6"></polyline>
            </svg>
          </button>
          <div className="slide-dots">
            {slides.map((_, index) => (
              <div
                key={index}
                className={`slide-dot ${index === currentSlideIndex ? 'active' : ''}`}
                onClick={() => handleDotClick(index)}
              />
            ))}
          </div>
          <button 
            className="slide-nav-button" 
            onClick={handleNextSlide}
            title="Next slide"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9 18 15 12 9 6"></polyline>
            </svg>
          </button>
        </div>
      </div>
    );
  }


  return (
    <div className="ppt-preview-container">
      <div className="slides-header">
        <h2>Preview ({slides.length} slides)</h2>
        <div className="header-buttons">
          <button onClick={handleAddSlide} className="action-button add-button">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
            Add Slide
          </button>
          <button onClick={handleDownloadPPTX} className="action-button download-button">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
              <polyline points="7 10 12 15 17 10"></polyline>
              <line x1="12" y1="15" x2="12" y2="3"></line>
            </svg>
            PPTX
          </button>
          <button onClick={handleDownloadPDF} className="action-button download-button">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
              <polyline points="14 2 14 8 20 8"></polyline>
              <line x1="16" y1="13" x2="8" y2="13"></line>
              <line x1="16" y1="17" x2="8" y2="17"></line>
              <polyline points="10 9 9 9 8 9"></polyline>
            </svg>
            PDF
          </button>
        </div>
      </div>
      
      <div className="slides-grid">
        {slides.map((slide, index) => (
          <div
            key={index}
            className="slide-grid-item"
            onClick={() => handleSlideClick(index)}
          >
            <div className="slide-grid-number">{String(index + 1).padStart(2, '0')}</div>
            
            {slide.type === 'title' ? (
              <div className="grid-title-layout">
                <div className="grid-image-area">
                  {slide.image && (
                    <img 
                      src={slide.image} 
                      alt={slide.title}
                      className="grid-image"
                    />
                  )}
                </div>
                <div className="grid-text-area title-bg">
                  <h3 className="grid-title">{slide.title}</h3>
                  {slide.subtitle && (
                    <p className="grid-subtitle">{slide.subtitle}</p>
                  )}
                </div>
              </div>
            ) : (
              <div className="grid-content-layout">
                <div className="grid-image-column">
                  {slide.image && (
                    <img 
                      src={slide.image} 
                      alt={slide.title}
                      className="grid-image"
                    />
                  )}
                </div>
                <div className="grid-text-column">
                  <h3 className="grid-title">{slide.title}</h3>
                  {slide.subtitle && (
                    <p className="grid-subtitle">{slide.subtitle}</p>
                  )}
                  {slide.content && (
                    <p className="grid-content-preview">
                      {removeMarkdown(slide.content).substring(0, 80)}...
                    </p>
                  )}
                </div>
              </div>
            )}
            
            <button 
              className="grid-edit-button"
              onClick={(e) => {
                e.stopPropagation();
                handleEditSlide(index);
              }}
              title="Edit slide"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
              </svg>
            </button>
          </div>
        ))}
      </div>

      {/* Edit Modal */}
      {editModalOpen && (
        <div className="edit-modal-overlay">
          <div className="edit-modal">
            <div className="edit-modal-header">
              <h3>Edit Slide</h3>
              <button 
                className="close-modal-button"
                onClick={handleCancelEdit}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>
            <div className="edit-modal-content">
              <div className="edit-form-group">
                <label htmlFor="edit-title">Title</label>
                <input
                  id="edit-title"
                  type="text"
                  value={editedSlide.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                />
              </div>
              <div className="edit-form-group">
                <label htmlFor="edit-subtitle">Subtitle</label>
                <input
                  id="edit-subtitle"
                  type="text"
                  value={editedSlide.subtitle}
                  onChange={(e) => handleInputChange('subtitle', e.target.value)}
                />
              </div>
              <div className="edit-form-group">
                <label htmlFor="edit-content">Content</label>
                <textarea
                  id="edit-content"
                  value={editedSlide.content}
                  onChange={(e) => handleInputChange('content', e.target.value)}
                  rows={5}
                />
              </div>
              <div className="edit-ai-section">
                <div className="edit-form-group">
                  <label htmlFor="edit-prompt">Edit with AI</label>
                  <textarea
                    id="edit-prompt"
                    value={editPrompt}
                    onChange={(e) => setEditPrompt(e.target.value)}
                    placeholder="Describe how you want to change this slide..."
                    rows={3}
                  />
                </div>
                <button 
                  className="edit-ai-button"
                  onClick={handleEditWithAI}
                  disabled={isEditing}
                >
                  {isEditing ? 'Editing...' : 'Edit with AI'}
                </button>
              </div>
            </div>
            <div className="edit-modal-footer">
              <button className="cancel-button" onClick={handleCancelEdit}>
                Cancel
              </button>
              <button className="save-button" onClick={handleSaveSlide}>
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};


export default PPTPreview;
