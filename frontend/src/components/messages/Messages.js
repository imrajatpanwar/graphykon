import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-toastify';
import io from 'socket.io-client';
import VerificationTick from '../common/VerificationTick';
import getApiConfig from '../../config/api';
import './Messages.css';

const Messages = () => {
  const { user } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [filteredConversations, setFilteredConversations] = useState([]);
  const [searchResults, setSearchResults] = useState([]);
  const [isSearchingUsers, setIsSearchingUsers] = useState(false);
  const [showUserSearch, setShowUserSearch] = useState(false);
  const [typingUsers, setTypingUsers] = useState([]);
  const [socket, setSocket] = useState(null);
  const [attachment, setAttachment] = useState(null);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  // Initialize socket connection
  useEffect(() => {
    if (user) {
      console.log('Initializing socket connection for user:', user);
      const apiConfig = getApiConfig();
      const newSocket = io(apiConfig.socketURL, {
        withCredentials: true,
        transports: ['polling', 'websocket'],
        timeout: 20000,
        forceNew: true,
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000
      });

      // Socket event handlers
      newSocket.on('connect', () => {
        console.log('Messages Socket.IO connected:', newSocket.id);
        // Join user's messages room after connection
        newSocket.emit('join-messages-room', user.id);
        console.log('Joined messages room for user:', user.id);
      });

      newSocket.on('connect_error', (error) => {
        console.error('Messages Socket.IO connection error:', error);
      });

      newSocket.on('disconnect', (reason) => {
        console.log('Messages Socket.IO disconnected:', reason);
      });

      newSocket.on('reconnect', (attemptNumber) => {
        console.log('Messages Socket.IO reconnected after', attemptNumber, 'attempts');
        // Rejoin room after reconnection
        newSocket.emit('join-messages-room', user.id);
      });

      setSocket(newSocket);

      // Listen for new messages
      newSocket.on('new-message', (data) => {
        console.log('Received new message:', data);
        // Only add message if it's not from the current user (to avoid duplicates)
        if (data.conversationId === selectedConversation?.conversationId && data.message.sender._id !== user.id) {
          setMessages(prev => [...prev, data.message]);
          scrollToBottom();
        }
        // Update conversations list
        fetchConversations();
      });

      // Listen for message notifications
      newSocket.on('message-notification', (data) => {
        if (data.conversationId !== selectedConversation?.conversationId) {
          setUnreadCount(prev => prev + 1);
          toast.info(`New message from ${data.message.sender.name}`);
        }
      });

      // Listen for typing indicators
      newSocket.on('user-typing', (data) => {
        if (data.conversationId === selectedConversation?.conversationId && data.userId !== user.id) {
          setTypingUsers(prev => [...prev.filter(u => u.userId !== data.userId), data]);
        }
      });

      newSocket.on('user-stopped-typing', (data) => {
        if (data.conversationId === selectedConversation?.conversationId) {
          setTypingUsers(prev => prev.filter(u => u.userId !== data.userId));
        }
      });

      // Listen for read receipts
      newSocket.on('messages-marked-read', (data) => {
        if (data.conversationId === selectedConversation?.conversationId) {
          setMessages(prev => prev.map(msg => 
            msg.receiver._id === data.userId ? { ...msg, isRead: true } : msg
          ));
        }
      });

      return () => {
        newSocket.disconnect();
      };
    }
  }, [user, selectedConversation]);

  // Fetch conversations
  const fetchConversations = async () => {
    try {
      console.log('Fetching conversations...');
      const apiConfig = getApiConfig();
      const response = await fetch(`${apiConfig.baseURL}/api/messages/conversations`, {
        credentials: 'include'
      });
      console.log('Conversations response status:', response.status);
      const data = await response.json();
      console.log('Conversations data:', data);
      
      if (response.ok) {
        setConversations(data.conversations);
        setFilteredConversations(data.conversations);
        console.log('Conversations loaded:', data.conversations.length);
      } else {
        console.error('Failed to fetch conversations:', data);
        if (response.status === 401) {
          toast.error('Please log in to access messages');
        }
      }
    } catch (error) {
      console.error('Error fetching conversations:', error);
      toast.error('Unable to load conversations');
    }
  };

  // Fetch unread count
  const fetchUnreadCount = async () => {
    try {
      console.log('Fetching unread count...');
      const apiConfig = getApiConfig();
      const response = await fetch(`${apiConfig.baseURL}/api/messages/unread-count`, {
        credentials: 'include'
      });
      console.log('Unread count response status:', response.status);
      const data = await response.json();
      console.log('Unread count data:', data);
      
      if (response.ok) {
        setUnreadCount(data.count);
      } else {
        console.error('Failed to fetch unread count:', data);
      }
    } catch (error) {
      console.error('Error fetching unread count:', error);
    }
  };

  // Initial data fetch
  useEffect(() => {
    console.log('Messages useEffect triggered, user:', user);
    if (user) {
      console.log('User authenticated, fetching initial data...');
      fetchConversations();
      fetchUnreadCount();
    } else {
      console.log('No user found, user needs to log in');
    }
  }, [user]);

  // Scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Search users
  const searchUsers = useCallback(async (query) => {
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }

    setIsSearchingUsers(true);
    try {
      const apiConfig = getApiConfig();
      const response = await fetch(`${apiConfig.baseURL}/api/messages/search-users?query=${encodeURIComponent(query)}`, {
        credentials: 'include'
      });
      const data = await response.json();
      
      if (response.ok) {
        setSearchResults(data.users);
      }
    } catch (error) {
      console.error('Error searching users:', error);
    } finally {
      setIsSearchingUsers(false);
    }
  }, []);

  // Search conversations
  const searchConversations = useCallback((query) => {
    if (!query.trim()) {
      setFilteredConversations(conversations);
      setShowUserSearch(false);
      return;
    }

    const filtered = conversations.filter(conversation => {
      const userName = conversation.otherUser?.displayName || conversation.otherUser?.name || '';
      const username = conversation.otherUser?.username || '';
      const lastMessage = conversation.lastMessage?.content || '';
      
      const searchTerm = query.toLowerCase();
      
      return (
        userName.toLowerCase().includes(searchTerm) ||
        username.toLowerCase().includes(searchTerm) ||
        lastMessage.toLowerCase().includes(searchTerm)
      );
    });
    
    setFilteredConversations(filtered);
    
    // If no conversations found, show user search option
    if (filtered.length === 0 && query.trim().length >= 2) {
      setShowUserSearch(true);
      searchUsers(query);
    } else {
      setShowUserSearch(false);
      setSearchResults([]);
    }
  }, [conversations, searchUsers]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Update filtered conversations when conversations change
  useEffect(() => {
    if (searchQuery.trim()) {
      searchConversations(searchQuery);
    } else {
      setFilteredConversations(conversations);
      setShowUserSearch(false);
      setSearchResults([]);
    }
  }, [conversations, searchQuery, searchConversations]);

  // Select conversation
  const selectConversation = async (conversation) => {
    setSelectedConversation(conversation);
    setLoading(true);
    
    try {
      // Join conversation socket room
      if (socket) {
        socket.emit('join-conversation', conversation.conversationId);
      }

      // Fetch messages
      const apiConfig = getApiConfig();
      const response = await fetch(`${apiConfig.baseURL}/api/messages/conversations/${conversation.conversationId}/messages`, {
        credentials: 'include'
      });
      const data = await response.json();
      
      if (response.ok) {
        setMessages(data.messages);
        
        // Mark messages as read
        await fetch(`${apiConfig.baseURL}/api/messages/conversations/${conversation.conversationId}/read`, {
          method: 'PUT',
          credentials: 'include'
        });
        
        // Emit read receipt
        if (socket) {
          socket.emit('messages-read', {
            conversationId: conversation.conversationId,
            userId: user.id
          });
        }
        
        fetchUnreadCount();
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setLoading(false);
    }
  };

  // Send message
  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() && !attachment) return;

    // Debug logging
    console.log('Sending message:', {
      selectedConversation,
      user,
      newMessage: newMessage.trim()
    });

    if (!selectedConversation || !selectedConversation.otherUser) {
      console.error('No conversation selected or missing other user');
      toast.error('Please select a conversation first');
      return;
    }

    const messageData = {
      receiverId: selectedConversation.otherUser._id,
      content: newMessage.trim(),
      messageType: attachment ? 'file' : 'text'
    };

    console.log('Message data to send:', messageData);

    try {
      let response;
      
      if (attachment) {
        // Send with attachment
        const formData = new FormData();
        formData.append('receiverId', selectedConversation.otherUser._id);
        formData.append('content', newMessage.trim());
        formData.append('messageType', 'file');
        formData.append('attachment', attachment);

        const apiConfig = getApiConfig();
        console.log('Sending message with attachment to:', `${apiConfig.baseURL}/api/messages/send-with-attachment`);
        response = await fetch(`${apiConfig.baseURL}/api/messages/send-with-attachment`, {
          method: 'POST',
          credentials: 'include',
          body: formData
        });
      } else {
        // Send text message
        const apiConfig = getApiConfig();
        console.log('Sending text message to:', `${apiConfig.baseURL}/api/messages/send`);
        response = await fetch(`${apiConfig.baseURL}/api/messages/send`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify(messageData)
        });
      }

      console.log('Message response status:', response.status);
      console.log('Message response headers:', Object.fromEntries(response.headers.entries()));
      
      let data;
      try {
        const responseText = await response.text();
        console.log('Raw response text:', responseText);
        data = JSON.parse(responseText);
      } catch (parseError) {
        console.error('Error parsing response JSON:', parseError);
        toast.error('Server returned invalid response');
        return;
      }
      
      console.log('Message response data:', data);
      
      if (response.ok) {
        setMessages(prev => [...prev, data.data]);
        setNewMessage('');
        setAttachment(null);
        
        // Emit message via socket
        if (socket) {
          socket.emit('send-message', {
            conversationId: selectedConversation.conversationId,
            receiverId: selectedConversation.otherUser._id,
            message: data.data
          });
        }
        
        fetchConversations();
        // toast.success('Message sent!');
      } else {
        console.error('Message send failed. Status:', response.status, 'Data:', data);
        toast.error(data.message || `Server error: ${response.status}`);
      }
    } catch (error) {
      console.error('Network error sending message:', error);
      toast.error(`Failed to send message: ${error.message}`);
    }
  };

  // Handle typing
  const handleTyping = (e) => {
    setNewMessage(e.target.value);
    
    if (socket && selectedConversation) {
      socket.emit('typing-start', {
        conversationId: selectedConversation.conversationId,
        userId: user.id,
        userName: user.name
      });
      
      // Clear previous timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      
      // Set new timeout to stop typing
      typingTimeoutRef.current = setTimeout(() => {
        socket.emit('typing-stop', {
          conversationId: selectedConversation.conversationId,
          userId: user.id
        });
      }, 1000);
    }
  };



  // Start conversation with searched user
  const startConversationWithUser = async (receiverId) => {
    console.log('Starting conversation with user:', receiverId);
    
    try {
      const apiConfig = getApiConfig();
      const response = await fetch(`${apiConfig.baseURL}/api/messages/conversations/start`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ receiverId })
      });
      
      console.log('Start conversation response status:', response.status);
      const data = await response.json();
      console.log('Start conversation response data:', data);
      
      if (response.ok) {
        setSearchQuery('');
        setSearchResults([]);
        setShowUserSearch(false);
        
        if (data.exists) {
          // Conversation exists, select it
          console.log('Conversation exists, selecting it');
          const conversation = {
            conversationId: data.conversationId,
            otherUser: data.receiver,
            unreadCount: 0,
            lastMessage: null
          };
          setSelectedConversation(conversation);
          // toast.success('Conversation opened!');
        } else {
          // New conversation, refresh list
          console.log('New conversation created, refreshing list');
          await fetchConversations();
          // toast.success('New conversation started!');
          
          // Select the new conversation
          const newConversationId = data.conversationId;
          const newConversation = {
            conversationId: newConversationId,
            otherUser: data.receiver,
            unreadCount: 0,
            lastMessage: null
          };
          setSelectedConversation(newConversation);
        }
      } else {
        console.error('Start conversation failed:', data);
        toast.error(data.message || 'Failed to start conversation');
      }
    } catch (error) {
      console.error('Error starting conversation:', error);
      toast.error('Failed to start conversation');
    }
  };

  // Handle search input change
  const handleSearchChange = (e) => {
    const query = e.target.value;
    setSearchQuery(query);
    
    if (query.trim()) {
      searchConversations(query);
    } else {
      setFilteredConversations(conversations);
      setShowUserSearch(false);
      setSearchResults([]);
    }
  };

  // Handle file attachment
  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      setAttachment(file);
    }
  };

  // Format time
  const formatTime = (date) => {
    return new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Format date
  const formatDate = (date) => {
    const messageDate = new Date(date);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (messageDate.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (messageDate.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return messageDate.toLocaleDateString();
    }
  };

  if (!user) {
    return (
      <div className="messages-container">
        <div className="messages-login-required">
          <h3>Please log in to access messages</h3>
        </div>
      </div>
    );
  }

  return (
    <div className="messages-container">
      <div className="messages-sidebar">
        <div className="messages-header">
          <h2>Messages</h2>
          {unreadCount > 0 && (
            <span className="unread-badge">{unreadCount}</span>
          )}
        </div>

        <div className="search-container">
          <input
            type="text"
            placeholder="Search conversations or find users by username..."
            value={searchQuery}
            onChange={handleSearchChange}
            className="form-control search-input"
          />
          <i className="fas fa-search search-icon"></i>
        </div>



        <div className="conversations-list">
          {filteredConversations.length === 0 && searchQuery.trim() && !showUserSearch && (
            <div className="no-results">
              <p>No conversations found for "{searchQuery}"</p>
              <small className="text-muted">Searching for users to start new conversations...</small>
            </div>
          )}
          
          {/* Show user search results when no conversations found */}
          {showUserSearch && (
            <div className="user-search-section">
              <div className="search-section-header">
                <h6 className="mb-2">Start New Conversation</h6>
                {isSearchingUsers && (
                  <small className="text-muted">Searching users...</small>
                )}
              </div>
              
              {searchResults.length === 0 && !isSearchingUsers && (
                <div className="no-results">
                  <p>No users found for "{searchQuery}"</p>
                </div>
              )}
              
              {searchResults.map(user => (
                <div 
                  key={user._id} 
                  className="search-result-item"
                  onClick={() => {
                    console.log('Search result clicked! User:', user);
                    startConversationWithUser(user._id);
                  }}
                  style={{ cursor: 'pointer' }}
                >
                  <img 
                    src={user.profileImage || '/default-avatar.png'} 
                    alt={user.name}
                    className="user-avatar"
                  />
                  <div className="user-info">
                    <div className="user-name">
                      {user.displayName || user.name}
                      <VerificationTick user={user} size={16} />
                    </div>
                    <div className="user-username">@{user.username || user.name}</div>
                  </div>
                  <div 
                    className="start-chat-icon"
                    onClick={(e) => {
                      e.stopPropagation();
                      console.log('Chat icon clicked! User:', user);
                      startConversationWithUser(user._id);
                    }}
                    style={{ cursor: 'pointer', zIndex: 10 }}
                  >
                    <i className="fas fa-comment-dots"></i>
                  </div>
                </div>
              ))}
              
              {searchResults.length > 0 && (
                <div className="search-divider">
                  <hr />
                  <small className="text-muted">Your Conversations</small>
                </div>
              )}
            </div>
          )}
          
          {filteredConversations.map(conversation => (
            <div 
              key={conversation.conversationId}
              className={`conversation-item ${selectedConversation?.conversationId === conversation.conversationId ? 'active' : ''}`}
              onClick={() => selectConversation(conversation)}
            >
              <img 
                src={conversation.otherUser.profileImage || '/default-avatar.png'} 
                alt={conversation.otherUser.name}
                className="user-avatar"
              />
              <div className="conversation-info">
                <div className="conversation-name">
                  {conversation.otherUser.displayName || conversation.otherUser.name}
                  <VerificationTick user={conversation.otherUser} size={16} />
                </div>
                <div className="last-message">
                  {conversation.lastMessage?.content || 'No messages yet'}
                </div>
                <div className="conversation-time">
                  {conversation.lastMessage && formatTime(conversation.lastMessage.createdAt)}
                </div>
              </div>
              {conversation.unreadCount > 0 && (
                <span className="unread-count">{conversation.unreadCount}</span>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="messages-main">
        {selectedConversation ? (
          <>
            <div className="messages-header">
              <img 
                src={selectedConversation.otherUser.profileImage || '/default-avatar.png'} 
                alt={selectedConversation.otherUser.name}
                className="user-avatar"
              />
              <div className="user-info">
                <div className="user-name">
                  {selectedConversation.otherUser.displayName || selectedConversation.otherUser.name}
                  <VerificationTick user={selectedConversation.otherUser} size={16} />
                </div>
                <div className="user-status">
                  {typingUsers.length > 0 && (
                    <span className="typing-indicator">
                      {typingUsers.map(u => u.userName).join(', ')} {typingUsers.length === 1 ? 'is' : 'are'} typing...
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="messages-body">
              {loading ? (
                <div className="text-center">Loading messages...</div>
              ) : (
                messages.map((message, index) => {
                  const isOwnMessage = message.sender._id === user.id;
                  const showDate = index === 0 || 
                    formatDate(message.createdAt) !== formatDate(messages[index - 1].createdAt);
                  
                  return (
                    <div key={message._id}>
                      {showDate && (
                        <div className="message-date">
                          {formatDate(message.createdAt)}
                        </div>
                      )}
                      <div className={`message ${isOwnMessage ? 'own-message' : 'other-message'}`}>
                        {!isOwnMessage && (
                          <img 
                            src={message.sender.profileImage || '/default-avatar.png'} 
                            alt={message.sender.name}
                            className="message-avatar"
                          />
                        )}
                        <div className="message-content">
                          <div className="message-text">
                            {message.content}
                            {message.attachments && message.attachments.length > 0 && (
                              <div className="message-attachments">
                                {message.attachments.map((attachment, idx) => (
                                  <div key={idx} className="attachment">
                                    <a href={attachment.url} target="_blank" rel="noopener noreferrer">
                                      <i className="fas fa-file"></i> {attachment.originalName}
                                    </a>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                          <div className="message-meta">
                            <span className="message-time">{formatTime(message.createdAt)}</span>
                            {isOwnMessage && (
                              <span className="message-status">
                                <i className={`fas ${message.isRead ? 'fa-check-double' : 'fa-check'}`}></i>
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            <div className="messages-footer">
              <form onSubmit={sendMessage} className="message-form">
                {attachment && (
                  <div className="attachment-preview">
                    <span>{attachment.name}</span>
                    <button 
                      type="button" 
                      onClick={() => setAttachment(null)}
                      className="btn-remove-attachment"
                    >
                      ×
                    </button>
                  </div>
                )}
                <div className="message-input-container">
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileSelect}
                    style={{ display: 'none' }}
                  />
                  <button
                    type="button"
                    className="btn-attachment"
                    onClick={() => fileInputRef.current.click()}
                  >
                    <i className="fas fa-paperclip"></i>
                  </button>
                  <input
                    type="text"
                    value={newMessage}
                    onChange={handleTyping}
                    placeholder="Type a message..."
                    className="message-input"
                  />
                  <button type="submit" className="btn-send">
                    <i className="fas fa-paper-plane"></i>
                  </button>
                </div>
              </form>
            </div>
          </>
        ) : (
          <div className="no-conversation-selected">
            <h3>Select a conversation to start messaging</h3>
            <p>Choose from your existing conversations or use the search to find specific chats</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Messages; 