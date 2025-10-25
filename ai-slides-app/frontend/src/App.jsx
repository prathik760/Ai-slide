import React, { useState, useCallback, useRef } from 'react';
import Chat from './components/Chat';
import PPTPreview from './components/PPTPreview';
import ChatHistory from './components/ChatHistory';
import './App.css';


const App = () => {
  const [slides, setSlides] = useState([]);
  const [showSplitView, setShowSplitView] = useState(false);
  const [currentSlideId, setCurrentSlideId] = useState(null);
  const [currentPrompt, setCurrentPrompt] = useState('');
  const [activeHistoryId, setActiveHistoryId] = useState(null);
  const [isHistoryOpen, setIsHistoryOpen] = useState(true);
  const [currentMessages, setCurrentMessages] = useState([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const chatPanelRef = useRef(null);


  // ✅ FIXED: Memoize all callbacks to prevent infinite loops
  const handleSlidesGenerated = useCallback((newSlides, slideId) => {
    setSlides(newSlides);
    setCurrentSlideId(slideId);
    if (newSlides.length > 0) {
      setShowSplitView(true);
    }
    setIsGenerating(false);
  }, []);


  const handlePromptEntered = useCallback((prompt) => {
    setCurrentPrompt(prompt);
    setIsGenerating(true);
  }, []);


  const handleMessagesUpdate = useCallback((messages) => {
    setCurrentMessages(messages);
  }, []);


  const handleHistoryItemClick = useCallback((slidesData, id, messagesData, prompt) => {
    console.log('History item clicked:', { slidesData, id, messagesData, prompt });
    
    setSlides(slidesData || []);
    setCurrentSlideId(id);
    setActiveHistoryId(id);
    setShowSplitView(true);
    setCurrentPrompt(prompt || '');
    setCurrentMessages(messagesData || []);
    
    if (chatPanelRef.current) {
      chatPanelRef.current.scrollTop = 0;
    }
  }, []);


  const handleClearHistory = useCallback(() => {
    // ChatHistory component handles localStorage removal
    setActiveHistoryId(null);
  }, []);


  const handleNewChat = useCallback(() => {
    setSlides([]);
    setCurrentSlideId(null);
    setCurrentPrompt('');
    setActiveHistoryId(null);
    setShowSplitView(false);
    setIsHistoryOpen(true);
    setCurrentMessages([]);
    setIsGenerating(false);
  }, []);


  const toggleHistoryPanel = useCallback(() => {
    setIsHistoryOpen(prev => !prev);
  }, []);


  const handlePptxGenerated = useCallback(() => {
    console.log('PPTX generated successfully');
  }, []);


  const handlePdfGenerated = useCallback(() => {
    console.log('PDF generated successfully');
  }, []);


  return (
    <div className="app">
      <button 
        className={`history-toggle-btn ${isHistoryOpen ? 'open' : ''}`}
        onClick={toggleHistoryPanel}
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 12h18m-9-9v18"/>
        </svg>
      </button>
      
      <div className={`history-panel-slider ${isHistoryOpen ? 'open' : ''}`}>
        <ChatHistory
          onLoadHistory={handleHistoryItemClick}
          currentSlideId={currentSlideId}
          activeHistoryId={activeHistoryId}
          onClearHistory={handleClearHistory}
          onNewChat={handleNewChat}
          currentMessages={currentMessages}
          currentPrompt={currentPrompt}
          currentSlides={slides}
        />
      </div>
      
      {!showSplitView ? (
        <div className={`initial-view ${isHistoryOpen ? 'with-history' : ''}`}>
          <div className="chat-panel" ref={chatPanelRef}>
            <Chat
              onSlidesGenerated={handleSlidesGenerated}
              onPromptEntered={handlePromptEntered}
              onMessagesUpdate={handleMessagesUpdate}
              slides={slides}
              setSlides={setSlides}
              initialMessages={currentMessages}
              onPptxGenerated={handlePptxGenerated}
              onPdfGenerated={handlePdfGenerated}
            />
          </div>
        </div>
      ) : (
        <div className="split-view">
          <div className={`main-content ${isHistoryOpen ? 'with-history' : ''}`}>
            <div className="chat-panel" ref={chatPanelRef}>
              <Chat
                onSlidesGenerated={handleSlidesGenerated}
                onPromptEntered={handlePromptEntered}
                onMessagesUpdate={handleMessagesUpdate}
                slides={slides}
                setSlides={setSlides}
                initialMessages={currentMessages}
                onPptxGenerated={handlePptxGenerated}
                onPdfGenerated={handlePdfGenerated}
              />
            </div>
            <div className="slides-panel">
              <PPTPreview 
                slides={slides} 
                setSlides={setSlides} 
                prompt={currentPrompt}
                onPromptChange={setCurrentPrompt}
                isGenerating={isGenerating}
                onSlidesGenerated={handleSlidesGenerated}
                onPptxGenerated={handlePptxGenerated}
                onPdfGenerated={handlePdfGenerated}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};


export default App;
