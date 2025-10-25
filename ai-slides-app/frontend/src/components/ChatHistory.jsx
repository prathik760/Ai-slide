import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { FiMessageSquare, FiChevronLeft, FiChevronRight, FiTrash2, FiPlus, FiClock, FiFileText } from 'react-icons/fi';
import './ChatHistory.css';


const ChatHistory = ({ 
  onLoadHistory, 
  currentSlideId, 
  onNewChat, 
  onClearHistory, 
  currentMessages, 
  currentPrompt, 
  currentSlides,
  onSaveCurrentChat
}) => {
  const [history, setHistory] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const [collapsed, setCollapsed] = useState(false);
  const lastSavedState = useRef({
    slideId: null,
    messageCount: 0,
    prompt: '',
    slideCount: 0
  });
  
  // Track if we're loading from history to prevent save override
  const isLoadingFromHistory = useRef(false);
  
  // Debounce timer to prevent rapid updates
  const saveTimerRef = useRef(null);


  // Load history from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('pptChatHistory');
    if (saved) {
      try {
        const parsedHistory = JSON.parse(saved);
        // Filter out any items that don't have the required properties
        const validHistory = parsedHistory.filter(item => item && item.id && item.prompt);
        setHistory(validHistory);
      } catch (error) {
        console.error('Error loading chat history:', error);
        setHistory([]);
      }
    }
  }, []);


  // Update active ID when currentSlideId changes (but not from history load)
  useEffect(() => {
    if (currentSlideId && !isLoadingFromHistory.current) {
      setActiveId(currentSlideId);
    }
  }, [currentSlideId]);


  // Save current chat to history when slides are generated
  useEffect(() => {
    // Clear any pending save timer
    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
    }

    // Don't save if we're loading from history
    if (isLoadingFromHistory.current) {
      isLoadingFromHistory.current = false;
      return;
    }

    const messageCount = currentMessages ? currentMessages.length : 0;
    const slideCount = currentSlides ? currentSlides.length : 0;
    
    // Extract the actual user prompt from messages
    let actualPrompt = currentPrompt;
    if (currentMessages && currentMessages.length > 0) {
      const userMessage = currentMessages.find(msg => msg.sender === 'user');
      if (userMessage && userMessage.text) {
        actualPrompt = userMessage.text;
      }
    }
    
    // Check if we should save (must have complete data and different from last save)
    const shouldSave = currentSlideId && 
      actualPrompt && 
      messageCount > 0 &&
      slideCount > 0 &&
      (
        lastSavedState.current.slideId !== currentSlideId ||
        lastSavedState.current.messageCount !== messageCount ||
        lastSavedState.current.prompt !== actualPrompt ||
        lastSavedState.current.slideCount !== slideCount
      );
    
    if (!shouldSave) {
      return;
    }

    // Debounce the save operation
    saveTimerRef.current = setTimeout(() => {
      const newHistoryItem = {
        id: currentSlideId,
        prompt: actualPrompt,
        slides: [...(currentSlides || [])], // Create new array reference
        messages: [...(currentMessages || [])], // Create new array reference
        timestamp: new Date().toISOString(),
      };
      
      // Use functional state update
      setHistory(prevHistory => {
        const existingItemIndex = prevHistory.findIndex(item => item.id === currentSlideId);
        
        let updatedHistory;
        if (existingItemIndex >= 0) {
          // Update existing item - preserve the original prompt
          const existingItem = prevHistory[existingItemIndex];
          updatedHistory = [...prevHistory];
          updatedHistory[existingItemIndex] = {
            ...newHistoryItem,
            prompt: existingItem.prompt // Keep the original prompt
          };
        } else {
          // Add new item
          updatedHistory = [newHistoryItem, ...prevHistory];
        }
        
        localStorage.setItem('pptChatHistory', JSON.stringify(updatedHistory));
        return updatedHistory;
      });
      
      // Update the last saved state AFTER successful save
      lastSavedState.current = {
        slideId: currentSlideId,
        messageCount,
        prompt: actualPrompt,
        slideCount
      };
    }, 500); // 500ms debounce

    // Cleanup function
    return () => {
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current);
      }
    };
  }, [currentSlideId, currentPrompt, currentSlides?.length, currentMessages?.length]);
  // Only depend on lengths, not the full arrays


  const clearHistory = useCallback(() => {
    if (window.confirm('Are you sure you want to clear all presentation history?')) {
      setHistory([]);
      localStorage.removeItem('pptChatHistory');
      setActiveId(null);
      if (onClearHistory) onClearHistory();
    }
  }, [onClearHistory]);


  const deleteHistoryItem = useCallback((id, e) => {
    e.stopPropagation();
    
    setHistory(prevHistory => {
      const updatedHistory = prevHistory.filter(item => item.id !== id);
      localStorage.setItem('pptChatHistory', JSON.stringify(updatedHistory));
      return updatedHistory;
    });
    
    if (activeId === id) {
      setActiveId(null);
    }
  }, [activeId]);


  const loadHistory = useCallback((item) => {
    console.log('Loading history item:', item);
    
    // Set flag to prevent save override
    isLoadingFromHistory.current = true;
    
    // Set active ID immediately
    setActiveId(item.id);
    
    // Update last saved state to match what we're loading
    lastSavedState.current = {
      slideId: item.id,
      messageCount: item.messages ? item.messages.length : 0,
      prompt: item.prompt,
      slideCount: item.slides ? item.slides.length : 0
    };
    
    // Call onLoadHistory with all the necessary data
    if (onLoadHistory) {
      onLoadHistory(
        item.slides || [], 
        item.id, 
        item.messages || [], 
        item.prompt || ''
      );
    }
  }, [onLoadHistory]);


  const handleNewChat = useCallback(() => {
    // Clear any pending save
    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
    }
    
    // Reset the loading flag
    isLoadingFromHistory.current = false;
    
    // Reset active ID
    setActiveId(null);
    
    // Reset last saved state
    lastSavedState.current = {
      slideId: null,
      messageCount: 0,
      prompt: '',
      slideCount: 0
    };
    
    // Then start a new chat
    if (onNewChat) {
      onNewChat();
    }
  }, [onNewChat]);


  const formatDate = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      return `Today at ${date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}`;
    } else if (diffDays === 1) {
      return `Yesterday at ${date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}`;
    } else if (diffDays < 7) {
      return date.toLocaleDateString('en-US', { weekday: 'short' });
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
  };


  // Separate today's chats from older history
  const today = useMemo(() => {
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    return date;
  }, []);
  
  const todayChats = useMemo(() => {
    return history.filter(item => {
      const itemDate = new Date(item.timestamp);
      return itemDate >= today;
    });
  }, [history, today]);
  
  const olderHistory = useMemo(() => {
    return history.filter(item => {
      const itemDate = new Date(item.timestamp);
      return itemDate < today;
    });
  }, [history, today]);


  return (
    <div className={`history-panel ${collapsed ? 'collapsed' : ''}`}>
      <div className="history-panel-header">
        <div className="history-title">
          <FiMessageSquare className="history-icon" />
          <span>{collapsed ? '' : 'Chat History'}</span>
        </div>
        <button 
          className="toggle-history-btn"
          onClick={() => setCollapsed(!collapsed)}
          title={collapsed ? 'Expand history' : 'Collapse history'}
        >
          {collapsed ? <FiChevronRight /> : <FiChevronLeft />}
        </button>
      </div>
      
      {!collapsed && (
        <>
          {/* New Chat Button */}
          <div className="new-chat-section">
            <button 
              className="new-prompt-btn"
              onClick={handleNewChat}
            >
              <FiPlus />
              <span>New Chat</span>
            </button>
          </div>
          
          {/* Today's Chats */}
          {todayChats.length > 0 && (
            <>
              <div className="history-section-title">
                <span>Today</span>
              </div>
              <div className="history-list">
                {todayChats.map((item) => (
                  <div
                    key={item.id}
                    className={`history-item ${activeId === item.id ? 'active' : ''}`}
                    onClick={() => loadHistory(item)}
                    data-title={item.prompt ? (item.prompt.substring(0, 15) + (item.prompt.length > 15 ? '...' : '')) : 'Untitled Chat'}
                  >
                    <div className="history-item-content">
                      <strong>{item.prompt || 'Untitled Chat'}</strong>
                      <div className="history-item-meta">
                        <span className="history-date">
                          <FiClock className="meta-icon" />
                          {formatDate(item.timestamp)}
                        </span>
                        <span className="slide-count">
                          <FiFileText className="meta-icon" />
                          {item.slides ? item.slides.length : 0} slides
                        </span>
                      </div>
                    </div>
                    <button 
                      className="delete-button"
                      onClick={(e) => deleteHistoryItem(item.id, e)}
                      title="Delete presentation"
                    >
                      <FiTrash2 />
                    </button>
                  </div>
                ))}
              </div>
            </>
          )}
          
          {/* Older History */}
          {olderHistory.length > 0 && (
            <>
              <div className="history-section-title">
                <span>Previous 7 Days</span>
              </div>
              <div className="history-list">
                {olderHistory.map((item) => (
                  <div
                    key={item.id}
                    className={`history-item ${activeId === item.id ? 'active' : ''}`}
                    onClick={() => loadHistory(item)}
                    data-title={item.prompt ? (item.prompt.substring(0, 15) + (item.prompt.length > 15 ? '...' : '')) : 'Untitled Chat'}
                  >
                    <div className="history-item-content">
                      <strong>{item.prompt || 'Untitled Chat'}</strong>
                      <div className="history-item-meta">
                        <span className="history-date">
                          <FiClock className="meta-icon" />
                          {formatDate(item.timestamp)}
                        </span>
                        <span className="slide-count">
                          <FiFileText className="meta-icon" />
                          {item.slides ? item.slides.length : 0} slides
                        </span>
                      </div>
                    </div>
                    <button 
                      className="delete-button"
                      onClick={(e) => deleteHistoryItem(item.id, e)}
                      title="Delete presentation"
                    >
                      <FiTrash2 />
                    </button>
                  </div>
                ))}
              </div>
            </>
          )}
          
          {/* Clear History Button */}
          {history.length > 0 && (
            <div className="history-actions">
              <button 
                className="clear-history-btn"
                onClick={clearHistory}
              >
                <FiTrash2 />
                <span>Clear History</span>
              </button>
            </div>
          )}
          
          {/* Empty State */}
          {history.length === 0 && (
            <div className="empty-history">
              <FiMessageSquare className="empty-icon" />
              <p>No chat history yet</p>
              <p>Start a new chat to see it here</p>
            </div>
          )}
        </>
      )}
    </div>
  );
};


export default ChatHistory;
