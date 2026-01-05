// import Echo from 'laravel-echo'; // Commented out as it's not currently used
import Pusher from 'pusher-js';

// Configure Pusher
window.Pusher = Pusher;

class WebSocketService {
  constructor() {
    this.pusher = null;
    this.isConnected = false;
    this.authToken = null;
    this.channels = new Map();
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.isReconnecting = false; // Prevent multiple reconnection attempts
    this.reconnectTimeout = null; // Track timeout for cleanup
    this.intentionalDisconnect = false; // Flag to prevent reconnection on intentional disconnect
  }

  // Initialize Pusher instance
  initialize(token) {
    // Prevent multiple initializations
    if (this.pusher && this.isConnected) {
      return;
    }

    if (this.pusher) {
      this.disconnect();
    }

    this.authToken = token;
    this.intentionalDisconnect = false; // Reset flag for new connection

    try {
      // Use configuration that matches the working HTML test
      this.pusher = new Pusher('mysipvrzcwc0i8xemtua', {
        wsHost: 'localhost',
        wsPort: 8080,
        wssPort: 8080,
        forceTLS: false,
        enabledTransports: ['ws', 'wss'],
        cluster: 'mt1',
        disableStats: true,
        authEndpoint: 'http://localhost:8000/api/broadcasting/auth',
        auth: {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: 'application/json',
          },
        },
      });

      // Handle connection events
      this.pusher.connection.bind('connected', () => {
        this.isConnected = true;
        this.reconnectAttempts = 0;
        this.isReconnecting = false;
      });

      this.pusher.connection.bind('disconnected', () => {
        this.isConnected = false;
        this.handleReconnect();
      });

      this.pusher.connection.bind('failed', (error) => {
        this.isConnected = false;
        this.handleReconnect();
      });

      this.pusher.connection.bind('error', (error) => {
        // Don't auto-reconnect on every error to prevent loops
        if (!this.isReconnecting) {
          this.handleReconnect();
        }
      });

    } catch (error) {
      console.error('❌ Failed to initialize WebSocket:', error);
    }
  }

  // Handle reconnection with better logic
  handleReconnect() {
    // Don't reconnect if this was an intentional disconnect
    if (this.intentionalDisconnect) {
      return;
    }

    // Prevent multiple simultaneous reconnection attempts
    if (this.isReconnecting) {
      return;
    }

    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      this.isReconnecting = false;
      return;
    }

    this.isReconnecting = true;
    this.reconnectAttempts++;
    
    // Clear any existing timeout
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
    }

    const delay = Math.min(Math.pow(2, this.reconnectAttempts) * 1000, 30000); // Cap at 30 seconds
    
    this.reconnectTimeout = setTimeout(() => {
      if (this.authToken && this.isReconnecting && !this.intentionalDisconnect) {
        this.initialize(this.authToken);
      }
      this.isReconnecting = false;
    }, delay);
  }

  // Join a chat room - Fixed channel naming to match backend
  joinRoom(roomId, callbacks = {}) {
    if (!this.pusher) {
      console.error('WebSocket not initialized');
      return null;
    }

    // Fix: Use the correct channel name that matches the backend
    const channelName = `private-chat.room.${roomId}`;
    
    // Leave existing channel if already joined
    if (this.channels.has(channelName)) {
      this.leaveRoom(roomId);
    }

    try {
      const channel = this.pusher.subscribe(channelName);

      // Listen for new messages
      if (callbacks.onMessage) {
        channel.bind('message.sent', (data) => {
          callbacks.onMessage(data);
        });
      }

      // Listen for message edited events
      if (callbacks.onMessageEdited) {
        channel.bind('message.edited', (data) => {
          callbacks.onMessageEdited(data);
        });
      }

      // Listen for message deleted events
      if (callbacks.onMessageDeleted) {
        channel.bind('message.deleted', (data) => {
          callbacks.onMessageDeleted(data);
        });
      }

      // Listen for typing indicators
      if (callbacks.onTyping) {
        channel.bind('user.typing', (data) => {
          callbacks.onTyping(data);
        });
      }

      // Listen for user joined events
      if (callbacks.onUserJoined) {
        channel.bind('user.joined', (data) => {
          callbacks.onUserJoined(data);
        });
      }

      // Listen for user left events
      if (callbacks.onUserLeft) {
        channel.bind('user.left', (data) => {
          callbacks.onUserLeft(data);
        });
      }

      // Listen for online status changes
      if (callbacks.onOnlineStatusChange) {
        channel.bind('user.online.status', (data) => {
          callbacks.onOnlineStatusChange(data);
        });
      }

      // Handle subscription events
      channel.bind('pusher:subscription_succeeded', () => {
      });

      channel.bind('pusher:subscription_error', (error) => {
        console.error(`❌ Subscription error for ${channelName}:`, error);
      });

      this.channels.set(channelName, channel);
      
      return channel;
    } catch (error) {
      console.error(`Failed to join room ${roomId}:`, error);
      return null;
    }
  }

  // Leave a chat room
  leaveRoom(roomId) {
    const channelName = `private-chat.room.${roomId}`;
    const channel = this.channels.get(channelName);
    
    if (channel) {
      channel.unbind('message.sent');
      channel.unbind('message.edited');
      channel.unbind('message.deleted');
      channel.unbind('user.typing');
      channel.unbind('user.joined');
      channel.unbind('user.left');
      channel.unbind('user.online.status');
      
      this.pusher.unsubscribe(channelName);
      this.channels.delete(channelName);
    }
    
    // If no more channels are active, mark as intentional disconnect
    if (this.channels.size === 0) {
      this.intentionalDisconnect = true;
    }
  }

  // Send typing indicator
  sendTypingIndicator(roomId, isTyping = true) {
    if (!this.pusher) return;

    const channel = this.channels.get(`private-chat.room.${roomId}`);
    if (channel) {
      channel.trigger('client-typing', {
        user_id: this.getCurrentUserId(),
        is_typing: isTyping,
      });
    }
  }

  // Listen for typing indicators via whisper
  listenForTyping(roomId, callback) {
    if (!this.pusher) return;

    const channel = this.channels.get(`private-chat.room.${roomId}`);
    if (channel) {
      channel.bind('client-typing', callback);
    }
  }

  // Get current user ID (you'll need to implement this based on your auth system)
  getCurrentUserId() {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    return user.id;
  }

  // Disconnect from WebSocket
  disconnect() {
    // Mark as intentional disconnect to prevent reconnection
    this.intentionalDisconnect = true;
    
    // Clear any pending reconnection
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
    
    this.isReconnecting = false;
    
    if (this.pusher) {
      // Leave all channels
      this.channels.forEach((channel, channelName) => {
        this.pusher.unsubscribe(channelName);
      });
      this.channels.clear();
      
      this.pusher.disconnect();
      this.pusher = null;
      this.isConnected = false;
      
    }
  }

  // Check connection status
  isConnectedToSocket() {
    return this.isConnected;
  }

  // Subscribe to user's private notification channel
  subscribeToUserChannel(userId, callbacks = {}) {
    if (!this.pusher) {
      console.error('WebSocket not initialized');
      return null;
    }

    const channelName = `private-user.${userId}`;
    
    // Leave existing user channel if already subscribed
    if (this.channels.has(channelName)) {
      this.unsubscribeFromUserChannel(userId);
    }

    try {
      const channel = this.pusher.subscribe(channelName);

      // Listen for new notifications
      if (callbacks.onNotificationReceived) {
        channel.bind('notification.created', (data) => {
  
          callbacks.onNotificationReceived(data);
        });
      }

      // Listen for notification read events
      if (callbacks.onNotificationRead) {
        channel.bind('notification.read', (data) => {
  
          callbacks.onNotificationRead(data);
        });
      }

      // Listen for notification deleted events
      if (callbacks.onNotificationDeleted) {
        channel.bind('notification.deleted', (data) => {
  
          callbacks.onNotificationDeleted(data);
        });
      }

      // Handle subscription events
      channel.bind('pusher:subscription_succeeded', () => {

        if (callbacks.onSubscribed) {
          callbacks.onSubscribed();
        }
      });

      channel.bind('pusher:subscription_error', (error) => {
        console.error(`❌ Subscription error for user channel ${channelName}:`, error);
        if (callbacks.onError) {
          callbacks.onError(error);
        }
      });

      this.channels.set(channelName, channel);
      
      return channel;
    } catch (error) {
      console.error(`Failed to subscribe to user channel ${userId}:`, error);
      return null;
    }
  }

  // Unsubscribe from user's notification channel
  unsubscribeFromUserChannel(userId) {
    const channelName = `private-user.${userId}`;
    const channel = this.channels.get(channelName);
    
    if (channel) {
      channel.unbind('notification.created');
      channel.unbind('notification.read');
      channel.unbind('notification.deleted');
      this.pusher.unsubscribe(channelName);
      this.channels.delete(channelName);

    }
  }

  // Subscribe to specific product stock updates
  subscribeToProductStock(productId, callbacks = {}) {
    if (!this.pusher) {
      console.error('WebSocket not initialized');
      return null;
    }

    const channelName = `product.${productId}`;
    
    // Leave existing product channel if already subscribed
    if (this.channels.has(channelName)) {
      this.unsubscribeFromProductStock(productId);
    }

    try {
      const channel = this.pusher.subscribe(channelName);

      // Listen for stock updates
      if (callbacks.onStockUpdated) {
        channel.bind('product.stock.updated', (data) => {
  
          callbacks.onStockUpdated(data);
        });
      }

      // Listen for rating updates
      if (callbacks.onRatingUpdated) {
        channel.bind('product.rating.updated', (data) => {
  
          callbacks.onRatingUpdated(data);
        });
      }

      // Handle subscription events
      channel.bind('pusher:subscription_succeeded', () => {

        if (callbacks.onSubscribed) {
          callbacks.onSubscribed();
        }
      });

      channel.bind('pusher:subscription_error', (error) => {
        console.error(`❌ Subscription error for product ${productId}:`, error);
        if (callbacks.onError) {
          callbacks.onError(error);
        }
      });

      this.channels.set(channelName, channel);
      
      return channel;
    } catch (error) {
      console.error(`Failed to subscribe to product ${productId} updates:`, error);
      return null;
    }
  }

  // Subscribe to store-wide product updates
  subscribeToStoreProducts(callbacks = {}) {
    if (!this.pusher) {
      console.error('WebSocket not initialized');
      return null;
    }

    const channelName = 'store.products';
    
    // Leave existing store channel if already subscribed
    if (this.channels.has(channelName)) {
      this.unsubscribeFromStoreProducts();
    }

    try {
      const channel = this.pusher.subscribe(channelName);

      // Listen for stock updates
      if (callbacks.onStockUpdated) {
        channel.bind('product.stock.updated', (data) => {
  
          callbacks.onStockUpdated(data);
        });
      }

      // Listen for rating updates
      if (callbacks.onRatingUpdated) {
        channel.bind('product.rating.updated', (data) => {
  
          callbacks.onRatingUpdated(data);
        });
      }

      // Handle subscription events
      channel.bind('pusher:subscription_succeeded', () => {

        if (callbacks.onSubscribed) {
          callbacks.onSubscribed();
        }
      });

      channel.bind('pusher:subscription_error', (error) => {
        console.error('❌ Subscription error for store products:', error);
        if (callbacks.onError) {
          callbacks.onError(error);
        }
      });

      this.channels.set(channelName, channel);
      
      return channel;
    } catch (error) {
      console.error('Failed to subscribe to store product updates:', error);
      return null;
    }
  }

  // Unsubscribe from specific product updates
  unsubscribeFromProductStock(productId) {
    const channelName = `product.${productId}`;
    const channel = this.channels.get(channelName);
    
    if (channel) {
      channel.unbind('product.stock.updated');
      channel.unbind('product.rating.updated');
      this.pusher.unsubscribe(channelName);
      this.channels.delete(channelName);

    }
  }

  // Unsubscribe from store-wide product updates
  unsubscribeFromStoreProducts() {
    const channelName = 'store.products';
    const channel = this.channels.get(channelName);
    
    if (channel) {
      channel.unbind('product.stock.updated');
      channel.unbind('product.rating.updated');
      this.pusher.unsubscribe(channelName);
      this.channels.delete(channelName);

    }

  }

  // Get Pusher instance for custom operations
  getPusher() {
    return this.pusher;
  }
}

// Export singleton instance
const websocketService = new WebSocketService();
export default websocketService;