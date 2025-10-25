import React, { useState, useEffect, useRef } from 'react';
import { FiPaperclip, FiSend, FiAlertCircle, FiCheck, FiLoader, FiX, FiRefreshCw, FiClock } from 'react-icons/fi';
import './Chat.css'

const Chat = ({ onSlidesGenerated, onPromptEntered, onMessagesUpdate, slides, setSlides, initialMessages }) => {
  const [messages, setMessages] = useState(initialMessages || []);
  const [userInput, setUserInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [thinkingSteps, setThinkingSteps] = useState([]);
  const [showThinking, setShowThinking] = useState(false);
  const [apiError, setApiError] = useState(null);
  const [attachedFiles, setAttachedFiles] = useState([]);
  const [retryCount, setRetryCount] = useState(0);
  const [isRetryable, setIsRetryable] = useState(false);
  const [retryDelay, setRetryDelay] = useState(0);
  const [retryTimer, setRetryTimer] = useState(0);
  const fileInputRef = useRef(null);
  const messagesEndRef = useRef(null);
  const retryIntervalRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, showThinking]);

  // Update parent component when messages change
  useEffect(() => {
    if (onMessagesUpdate) {
      onMessagesUpdate(messages);
    }
  }, [messages, onMessagesUpdate]);

  // Reset messages when initialMessages changes
  useEffect(() => {
    if (initialMessages) {
      setMessages(initialMessages);
    }
  }, [initialMessages]);

  // Handle retry timer countdown
  useEffect(() => {
    if (retryTimer > 0) {
      retryIntervalRef.current = setInterval(() => {
        setRetryTimer(prev => prev - 1);
      }, 1000);
    } else {
      if (retryIntervalRef.current) {
        clearInterval(retryIntervalRef.current);
      }
    }

    return () => {
      if (retryIntervalRef.current) {
        clearInterval(retryIntervalRef.current);
      }
    };
  }, [retryTimer]);

  const generateThinkingSteps = (prompt) => {
    return [
      {
        title: 'Understanding your request',
        description: `Analyzing your request about "${prompt}"`,
        status: 'completed',
        icon: '✓'
      },
      {
        title: 'Connecting to AI',
        description: 'Establishing connection to Gemini AI',
        status: 'pending',
        icon: '2'
      },
      {
        title: 'Generating content',
        description: 'Creating slide content based on your topic',
        status: 'pending',
        icon: '3'
      },
      {
        title: 'Formatting slides',
        description: 'Structuring the presentation with proper formatting',
        status: 'pending',
        icon: '4'
      }
    ];
  };

  const simulateThinkingProgress = (steps) => {
    let currentStep = 1;
    
    const interval = setInterval(() => {
      if (currentStep < steps.length) {
        setThinkingSteps((prev) => {
          const newSteps = [...prev];
          
          newSteps[currentStep] = {
            ...newSteps[currentStep],
            status: 'in-progress',
            icon: '⚙'
          };
          
          if (currentStep > 0) {
            newSteps[currentStep - 1] = {
              ...newSteps[currentStep - 1],
              status: 'completed',
              icon: '✓'
            };
          }
          
          return newSteps;
        });
        
        currentStep++;
      } else {
        setThinkingSteps((prev) => {
          const newSteps = [...prev];
          newSteps[newSteps.length - 1] = {
            ...newSteps[newSteps.length - 1],
            status: 'completed',
            icon: '✓'
          };
          return newSteps;
        });
        
        clearInterval(interval);
      }
    }, 1500);

    return () => clearInterval(interval);
  };

  // Convert backend slide format to frontend format
  const convertSlidesToFrontendFormat = (backendSlides, prompt) => {
    return backendSlides.map((slide, index) => {
      // Generate a unique seed for each slide image
      const seed = `${prompt.replace(/\s+/g, '-').toLowerCase()}-${index}`;
      
      return {
        title: slide.title,
        subtitle: slide.subtitle || "",
        content: slide.content || "",
        type: index === 0 ? 'title' : 'content',
        image: `https://picsum.photos/seed/${seed}/800/450.jpg`,
        layout: index === 0 ? 'title' : 'content'
      };
    });
  };

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    setAttachedFiles(prev => [...prev, ...files]);
  };

  const handleAttachmentClick = () => {
    fileInputRef.current?.click();
  };

  const removeFile = (index) => {
    setAttachedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (fileName) => {
    const extension = fileName.split('.').pop().toLowerCase();
    
    if (['jpg', 'jpeg', 'png', 'gif', 'svg', 'webp'].includes(extension)) {
      return '🖼️';
    } else if (['pdf'].includes(extension)) {
      return '📄';
    } else if (['doc', 'docx', 'txt', 'rtf'].includes(extension)) {
      return '📝';
    } else if (['xls', 'xlsx', 'csv'].includes(extension)) {
      return '📊';
    } else if (['ppt', 'pptx'].includes(extension)) {
      return '📑';
    } else if (['zip', 'rar', '7z', 'tar', 'gz'].includes(extension)) {
      return '🗜️';
    } else {
      return '📎';
    }
  };

  const handleRetry = () => {
    setRetryCount(prev => prev + 1);
    setApiError(null);
    setRetryTimer(0);
    handleSend(new Event('submit'));
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if ((!userInput.trim() && attachedFiles.length === 0) || isLoading) return;

    // Reset any previous API errors
    setApiError(null);
    setIsRetryable(false);
    setRetryDelay(0);

    // Notify parent component that a prompt was entered
    if (onPromptEntered) {
      onPromptEntered(userInput);
    }

    // Create message content with file information
    let messageContent = userInput;
    if (attachedFiles.length > 0) {
      const fileNames = attachedFiles.map(file => file.name).join(', ');
      messageContent = userInput ? 
        `${userInput}\n\nAttached files: ${fileNames}` : 
        `Attached files: ${fileNames}`;
    }

    const userMsg = { 
      sender: 'user', 
      text: messageContent,
      files: attachedFiles.map(file => ({
        name: file.name,
        size: file.size,
        type: file.type
      }))
    };
    
    setMessages((prev) => [...prev, userMsg]);
    setIsLoading(true);

    const prompt = userInput;
    setUserInput('');
    setAttachedFiles([]);

    const steps = generateThinkingSteps(prompt);
    setThinkingSteps(steps);
    setShowThinking(true);
    simulateThinkingProgress(steps);

    try {
      // Call the backend API
      const response = await fetch('http://localhost:5001/api/generate-slides', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          prompt: prompt,
          conversationHistory: messages.filter(msg => msg.sender !== 'system'),
          hasAttachments: attachedFiles.length > 0
        }),
      });

      if (!response.ok) {
        // Try to get more detailed error information
        let errorMessage = `API request failed with status ${response.status}`;
        let isRetryable = false;
        let retryDelay = 0;
        
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
          isRetryable = errorData.isRetryable || false;
          
          if (errorData.message) {
            errorMessage = errorData.message;
          }
          
          if (errorData.details) {
            errorMessage += `: ${errorData.details}`;
          }
          
          if (errorData.retryDelay) {
            retryDelay = Math.ceil(errorData.retryDelay);
          }
        } catch (e) {
          // If we can't parse the error response, use the status text
          errorMessage += `: ${response.statusText}`;
          
          // 429 and 503 errors are typically retryable
          if (response.status === 429 || response.status === 503) {
            isRetryable = true;
            if (response.status === 429) {
              retryDelay = 30; // Default 30 seconds for rate limit
            }
          }
        }
        
        throw new Error(`${errorMessage}|${isRetryable}|${retryDelay}`);
      }

      const data = await response.json();
      
      // Check if the response has the expected structure
      if (!data.slides || !Array.isArray(data.slides)) {
        throw new Error('Invalid response format from API');
      }
      
      // Convert backend slides to frontend format
      const frontendSlides = convertSlidesToFrontendFormat(data.slides, prompt);
      
      const newChatId = Date.now().toString();
      
      const aiMsg = {
        sender: 'ai',
        text: data.message || `I've created an informative presentation about ${prompt}. The slides contain detailed information about the topic, including key concepts, applications, and future outlook. You can view the slides on the right.`
      };
      
      setMessages((prev) => [...prev, aiMsg]);
      setShowThinking(false);
      setSlides(frontendSlides);
      onSlidesGenerated(frontendSlides, newChatId);
      setIsLoading(false);
      setRetryCount(0); // Reset retry count on success
    } catch (error) {
      console.error('Error calling API:', error);
      
      // Parse the error to get the message, retryable status, and retry delay
      const errorParts = error.message.split('|');
      const errorMessage = errorParts[0];
      const retryable = errorParts[1] === 'true';
      const retryDelay = errorParts[2] ? parseInt(errorParts[2]) : 0;
      
      setApiError(errorMessage);
      setIsRetryable(retryable);
      setRetryDelay(retryDelay);
      setRetryTimer(retryDelay);
      
      // Fallback to local generation if API fails
      try {
        const fallbackSlides = generateFallbackSlides(prompt);
        
        const newChatId = Date.now().toString();
        
        const aiMsg = {
          sender: 'ai',
          text: `I've created an informative presentation about ${prompt}. The slides contain detailed information about the topic, including key concepts, applications, and future outlook. You can view the slides on the right.`
        };
        
        setMessages((prev) => [...prev, aiMsg]);
        setShowThinking(false);
        setSlides(fallbackSlides);
        onSlidesGenerated(fallbackSlides, newChatId);
        setIsLoading(false);
        setRetryCount(0); // Reset retry count on success
      } catch (fallbackError) {
        console.error('Error with fallback generation:', fallbackError);
        
        const errorMsg = {
          sender: 'ai',
          text: `Sorry, I encountered an error while generating your presentation: ${errorMessage}. Please try again later.`
        };
        setMessages((prev) => [...prev, errorMsg]);
        setShowThinking(false);
        setIsLoading(false);
      }
    }
  };

  // Fallback slide generation in case API fails
  const generateFallbackSlides = (prompt) => {
    return [
      {
        title: prompt,
        subtitle: "An Informative Overview",
        content: "",
        type: 'title',
        image: `https://picsum.photos/seed/${prompt.replace(/\s+/g, '-').toLowerCase()}/800/450.jpg`,
        layout: 'title'
      },
      {
        title: "Introduction",
        subtitle: "Understanding the Basics",
        content: `${prompt} represents an important area of study and practice. This presentation explores fundamental concepts, current applications, and future implications.`,
        type: 'content',
        image: `https://picsum.photos/seed/${prompt.replace(/\s+/g, '-').toLowerCase()}-intro/800/450.jpg`,
        layout: 'content'
      },
      {
        title: "Key Concepts",
        subtitle: "Fundamental Principles",
        content: `• Definition and Scope: What ${prompt} encompasses\n• Historical Development: How ${prompt} has evolved\n• Core Components: Essential elements of ${prompt}`,
        type: 'content',
        image: `https://picsum.photos/seed/${prompt.replace(/\s+/g, '-').toLowerCase()}-concepts/800/450.jpg`,
        layout: 'content'
      },
      {
        title: "Future Outlook",
        subtitle: "Trends and Predictions",
        content: `• Emerging Developments: New advances on the horizon\n• Potential Challenges: Obstacles that may need addressing\n• Opportunities: Areas for growth and innovation`,
        type: 'content',
        image: `https://picsum.photos/seed/${prompt.replace(/\s+/g, '-').toLowerCase()}-future/800/450.jpg`,
        layout: 'content'
      }
    ];
  };

  const isSplitView = slides.length > 0;

  return (
    <div className={`chat-container ${isSplitView ? 'split-view' : ''}`}>
      {!isSplitView && (
        <div className="greeting-section">
          <h1 className="greeting-title">Hello, piyuindia4!</h1>
          <p className="greeting-subtitle">What do you want me to generate today?</p>
        </div>
      )}

      <div className="messages-section">
        {messages.map((msg, idx) => (
          <div key={idx} className={`message-bubble message-${msg.sender}`}>
            <div className="message-label">
              {msg.sender === 'user' ? 'You' : 'AI'}
            </div>
            <div className="message-text">{msg.text}</div>
            {msg.files && msg.files.length > 0 && (
              <div className="message-files">
                {msg.files.map((file, fileIdx) => (
                  <div key={fileIdx} className="file-attachment">
                    <span className="file-icon">{getFileIcon(file.name)}</span>
                    <div className="file-info">
                      <div className="file-name">{file.name}</div>
                      <div className="file-size">{formatFileSize(file.size)}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}

        {showThinking && (
          <div className="thinking-container">
            <div className="thinking-header">
              <FiLoader className="thinking-spinner" />
              <span>AI is thinking...</span>
            </div>
            <div className="thinking-steps">
              {thinkingSteps.map((step, idx) => (
                <div key={idx} className={`thinking-step thinking-step-${step.status}`}>
                  <div className="step-icon">
                    {step.status === 'completed' && (
                      <FiCheck className="icon-check" />
                    )}
                    {step.status === 'in-progress' && (
                      <FiLoader className="icon-spinner" />
                    )}
                    {step.status === 'pending' && (
                      <span className="icon-number">{idx + 1}</span>
                    )}
                  </div>
                  <div className="step-content">
                    <div className="step-title">{step.title}</div>
                    <div className="step-description">{step.description}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {apiError && (
          <div className="error-container">
            <div className="error-header">
              <FiAlertCircle className="error-icon" />
              <span>API Error</span>
            </div>
            <div className="error-message">
              {apiError}
            </div>
            <div className="error-footer">
              {apiError.includes('Rate limit exceeded') ? (
                <p>You've reached the daily limit for the free tier. I've generated a presentation using local processing.</p>
              ) : (
                <p>The AI service is currently experiencing issues. I've generated a presentation using local processing.</p>
              )}
              {isRetryable && (
                <button 
                  className="retry-btn"
                  onClick={handleRetry}
                  disabled={isLoading || retryTimer > 0}
                >
                  <FiRefreshCw />
                  <span>{retryTimer > 0 ? `Retry in ${retryTimer}s` : 'Retry'}</span>
                </button>
              )}
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      <div className="input-section">
        {attachedFiles.length > 0 && (
          <div className="attached-files-container">
            {attachedFiles.map((file, index) => (
              <div key={index} className="attached-file">
                <span className="file-icon">{getFileIcon(file.name)}</span>
                <div className="file-info">
                  <div className="file-name">{file.name}</div>
                  <div className="file-size">{formatFileSize(file.size)}</div>
                </div>
                <button 
                  className="remove-file-btn"
                  onClick={() => removeFile(index)}
                  title="Remove file"
                >
                  <FiX />
                </button>
              </div>
            ))}
          </div>
        )}
        
        <form onSubmit={handleSend} className="input-form">
          <div className="input-wrapper">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileSelect}
              multiple
              style={{ display: 'none' }}
            />
            <button
              type="button"
              className="attachment-btn"
              onClick={handleAttachmentClick}
              disabled={isLoading}
            >
              <FiPaperclip />
            </button>
            <input
              type="text"
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              placeholder={isSplitView ? "Ask to edit slides..." : "Start with a topic, we'll turn it into slides!"}
              className="chat-input"
              disabled={isLoading}
            />
            <button
              type="submit"
              className="send-btn"
              disabled={isLoading || (!userInput.trim() && attachedFiles.length === 0)}
            >
              <FiSend />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Chat;