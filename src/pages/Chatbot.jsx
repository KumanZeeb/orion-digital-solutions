import React, { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import DOMPurify from 'dompurify';
import { motion, AnimatePresence } from 'framer-motion';

const ChatBot = () => {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isBotTyping, setIsBotTyping] = useState(false);
  const [showTemplateButtons, setShowTemplateButtons] = useState(true);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
      });
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const createMessageObject = (text, isBot, duration = 0) => ({
    id: Date.now() + Math.random().toString(36).substr(2, 9),
    text: DOMPurify.sanitize(text),
    isBot,
    time: new Date().toLocaleTimeString(),
    duration,
  });

  const handleSendMessage = async (messageText) => {
    const trimmedMessage = messageText.trim();
    if (!trimmedMessage || isBotTyping) return;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 300000);

    try {
      setMessages(prev => [...prev, createMessageObject(trimmedMessage, false)]);
      setInputMessage('');
      setIsBotTyping(true);
      setShowTemplateButtons(false);

      const startTime = Date.now();
      const response = await fetch(
        `https://api.ryzendesu.vip/api/ai/deepseek?text=${encodeURIComponent(trimmedMessage)}`,
        {
          method: 'GET',
          headers: { 
            accept: 'application/json',
          },
          signal: controller.signal,
        }
      );

      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      
      const data = await response.json();
      const botResponse = data.response || data.answer || data.message || 'can`t proceed';
      const processedResponse = processSpecialChars(botResponse);
      const duration = Date.now() - startTime;

      setMessages(prev => [...prev, createMessageObject(processedResponse, true, duration)]);
    } catch (error) {
      const errorMessage = error.name === 'AbortError' 
        ? 'request timeout after 30s. Try again.'
        : 'Waduh, ada yang salah nih sama Orion! gak konek ke servernya...i have problem here, im so sorry...哎呀，发生错误了。请稍后再试';
      
      setMessages(prev => [...prev, createMessageObject(errorMessage, true)]);
    } finally {
      setIsBotTyping(false);
      clearTimeout(timeoutId);
    }
  };

  const handleTemplateButtonClick = (templateMessage) => {
    handleSendMessage(templateMessage);
  };

  const processSpecialChars = (text) => {
    return text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/_(.*?)_/g, '<u>$1</u>')
      .replace(/~~(.*?)~~/g, '<s>$1</s>')
      .replace(/`(.*?)`/g, '<code>$1</code>');
  };

  return (
    <div className="flex flex-col h-screen text-white relative opacity-90 z-10 bg-gradient-to-br from-gray-900 to-gray-800">
      {/* Header */}
      <div className="bg-gray-700 p-4 flex items-center justify-between">
        <div className="flex items-center">
          <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center mr-3">
            <span className="text-xl">🤖</span>
          </div>
          <div>
            <h2 className="font-bold">Hey, I'm Orion! Here to brighten your day! ✨</h2>
            <p className="text-sm opacity-75">
              {isBotTyping ? 'Typing...' : 'Online'}
            </p>
          </div>
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800">
        {messages.length === 0 && (
          <>
            <div className="flex justify-center mb-4">
              <img 
                src="/orion.png" 
                alt="Orion Logo" 
                className="h-24 md:h-32"
              />
            </div>

            <h1 className="text-3xl md:text-5xl font-bold text-center mb-6">
              Orion Chat Bot
            </h1>
          </>
        )}

        {showTemplateButtons && messages.length === 0 && (
          <div className="flex flex-wrap gap-2 justify-center mb-6">
            <button
              onClick={() => handleTemplateButtonClick("Hello Orion")}
              className="bg-gray-500 text-white px-4 py-2 rounded-full hover:bg-gray-600 transition-colors"
            >
              Hallo
            </button>
            <button
              onClick={() => handleTemplateButtonClick("Brainstorm some ideas for me.")}
              className="bg-gray-500 text-white px-4 py-2 rounded-full hover:bg-gray-600 transition-colors"
            >
              Brainstorm
            </button>
            <button
              onClick={() => handleTemplateButtonClick("Give me simple random knowledge for")}
              className="bg-gray-500 text-white px-4 py-2 rounded-full hover:bg-gray-600 transition-colors"
            >
              Explain
            </button>
            <button
              onClick={() => handleTemplateButtonClick("Help me with a problem.")}
              className="bg-gray-500 text-white px-4 py-2 rounded-full hover:bg-gray-600 transition-colors"
            >
              Help
            </button>
          </div>
        )}

        <AnimatePresence>
          {messages.map((message) => (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className={`flex ${message.isBot ? 'items-start' : 'justify-end'}`}
            >
              {message.isBot && (
                <img 
                  src="/orion.png" 
                  alt="Orion Logo" 
                  className="h-12 mr-3" 
                />
              )}
              {message.isBot ? (
                <div className="flex-1">
                  <div dangerouslySetInnerHTML={{ __html: message.text }} />
                  <p className="text-xs mt-1 opacity-70">
                    {message.time}
                    {message.isBot && ` • ${(message.duration / 1000).toFixed(1)} sec`}
                  </p>
                </div>
              ) : (
                <div className="max-w-[70%] rounded-lg p-3 bg-blue-600 shadow-md">
                  <div dangerouslySetInnerHTML={{ __html: message.text }} />
                  <p className="text-xs mt-1 opacity-70">
                    {message.time}
                  </p>
                </div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
        
        {isBotTyping && (
          <div className="flex justify-start">
            <div className="bg-gray-600 text-white rounded-lg p-3 shadow-md">
              <div className="flex space-x-2">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" 
                     style={{ animationDelay: '0.2s' }} />
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" 
                     style={{ animationDelay: '0.4s' }} />
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Form */}
      <div className="border-t border-gray-700 p-4 bg-gray-800">
        <form onSubmit={(e) => {
          e.preventDefault();
          handleSendMessage(inputMessage);
        }} className="space-y-2">
          <div className="flex space-x-2">
            <textarea
              value={inputMessage}
              onChange={(e) => {
                setInputMessage(e.target.value);
                e.target.style.height = "auto";
                e.target.style.height = `${e.target.scrollHeight}px`;
              }}
              placeholder="Message Orion...."
              className="flex-1 border border-gray-600 rounded-full px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-1000 bg-gray-700 text-white resize-none overflow-hidden transition-all duration-500 ease-in-out hover:border-blue-500"
              rows={1}
              autoFocus
            />
            <button
              type="submit"
              disabled={!inputMessage.trim() || isBotTyping}
              className="flex items-center justify-center bg-gradient-to-r from-blue-500 to-blue-700 text-white px-6 py-2 rounded-full font-semibold shadow-md hover:from-blue-600 hover:to-blue-800 hover:shadow-lg active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

ChatBot.propTypes = {
  messages: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      text: PropTypes.string.isRequired,
      isBot: PropTypes.bool.isRequired,
      time: PropTypes.string.isRequired,
      duration: PropTypes.number,
    })
  ),
};

export default ChatBot;
