import Echo from 'laravel-echo';
import Pusher from 'pusher-js';

// Make Pusher available globally for Echo
window.Pusher = Pusher;

class WebSocketService {
  constructor() {
    this.echo = null;
    this.isConnected = false;
    this.authToken = null;
    this.channels = new Map();
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.isReconnecting = false;
    this.reconnectTimeout = null;
    this.intentionalDisconnect = false;
  }

  // Initialize Laravel Echo with Reverb broadcaster
  initialize(token) {
    // Prevent multiple initializations
    if (this.echo && this.isConnected) {
      console.log('✅ WebSocket already connected');
      return;
    }

    if (this.echo) {
      this.disconnect();
    }

    this.authToken = token;
    this.intentionalDisconnect = false;

    try {
      // Get configuration from environment variables
      const reverbKey = process.env.REACT_APP_REVERB_APP_KEY || 'local';
      const reverbHost = process.env.REACT_APP_REVERB_HOST || 'localhost';
      const reverbPort = parseInt(process.env.REACT_APP_REVERB_PORT || '8080');
      const reverbScheme = process.env.REACT_APP_REVERB_SCHEME || 'http';
      const authEndpoint = process.env.REACT_APP_AUTH_ENDPOINT || 'http://localhost:8000/api/broadcasting/auth';
      
      // Determine TLS settings based on scheme
      const useTLS = reverbScheme === 'https' || reverbScheme === 'wss';

      console.log('🔌 Initializing Laravel Echo with Reverb:', {
        host: reverbHost,
        port: reverbPort,
        scheme: reverbScheme,
        useTLS,
        key: reverbKey.substring(0, 10) + '...',
      });

      this.echo = new Echo({
        broadcaster: 'reverb',
        key: reverbKey,
        client: Pusher,  // 🔴 CRITICAL: Pusher-js as transport layer
        wsHost: reverbHost,
        wsPort: reverbPort,
        wssPort: reverbPort,
        forceTLS: useTLS,
        encrypted: useTLS,
        disableStats: true,
        enabledTransports: ['ws', 'wss'],
        authEndpoint: authEndpoint,
        auth: {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: 'application/json',
          },
        },
      });

      // Listen for connection events
      if (this.echo.connector && this.echo.connector.pusher) {
        this.echo.connector.pusher.connection.bind('connected', () => {
          console.log('✅ WebSocket connected successfully');
          this.isConnected = true;
          this.reconnectAttempts = 0;
          this.isReconnecting = false;
        });

        this.echo.connector.pusher.connection.bind('disconnected', () => {
          console.log('⚠️  WebSocket disconnected');
          this.isConnected = false;
          this.handleReconnect();
        });

        this.echo.connector.pusher.connection.bind('failed', (error) => {
          console.error('❌ WebSocket connection failed:', error);
          this.isConnected = false;
          this.handleReconnect();
        });

        this.echo.connector.pusher.connection.bind('error', (error) => {
          console.error('❌ WebSocket error:', error);
          if (!this.isReconnecting) {
            this.handleReconnect();
          }
        });
      }

    } catch (error) {
      console.error('❌ Failed to initialize WebSocket:', error);
    }
  }

  // Handle reconnection with exponential backoff
  handleReconnect() {
    if (this.intentionalDisconnect) {
      return;
    }

    if (this.isReconnecting) {
      return;
    }

    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('❌ Max reconnection attempts reached');
      this.isReconnecting = false;
      return;
    }

    this.isReconnecting = true;
    this.reconnectAttempts++;
    
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
    }

    const delay = Math.min(Math.pow(2, this.reconnectAttempts) * 1000, 30000);
    console.log(`🔄 Reconnecting in ${delay/1000}s (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
    
    this.reconnectTimeout = setTimeout(() => {
      if (this.authToken && this.isReconnecting && !this.intentionalDisconnect) {
        this.initialize(this.authToken);
      }
      this.isReconnecting = false;
    }, delay);
  }

  // Join a chat room
  joinRoom(roomId, callbacks = {}) {
    if (!this.echo) {
      console.error('❌ WebSocket not initialized');
      return null;
    }

    const channelName = `private-chat.room.${roomId}`;
    
    // Leave existing channel if already joined
    if (this.channels.has(channelName)) {
      this.leaveRoom(roomId);
    }

    try {
      const channel = this.echo.private(`chat.room.${roomId}`);

      // Listen for new messages
      if (callbacks.onMessage) {
        channel.listen('message.sent', (data) => {
          callbacks.onMessage(data);
        });
      }

      // Listen for message edited events
      if (callbacks.onMessageEdited) {
        channel.listen('message.edited', (data) => {
          callbacks.onMessageEdited(data);
        });
      }

      // Listen for message deleted events
      if (callbacks.onMessageDeleted) {
        channel.listen('message.deleted', (data) => {
          callbacks.onMessageDeleted(data);
        });
      }

      // Listen for typing indicators
      if (callbacks.onTyping) {
        channel.listen('user.typing', (data) => {
          callbacks.onTyping(data);
        });
      }

      // Listen for user joined events
      if (callbacks.onUserJoined) {
        channel.listen('user.joined', (data) => {
          callbacks.onUserJoined(data);
        });
      }

      // Listen for user left events
      if (callbacks.onUserLeft) {
        channel.listen('user.left', (data) => {
          callbacks.onUserLeft(data);
        });
      }

      // Listen for online status changes
      if (callbacks.onOnlineStatusChange) {
        channel.listen('user.online.status', (data) => {
          callbacks.onOnlineStatusChange(data);
        });
      }

      console.log(`✅ Joined room: ${roomId}`);
      this.channels.set(channelName, channel);
      
      return channel;
    } catch (error) {
      console.error(`❌ Failed to join room ${roomId}:`, error);
      return null;
    }
  }

  // Leave a chat room
  leaveRoom(roomId) {
    const channelName = `private-chat.room.${roomId}`;
    const channel = this.channels.get(channelName);
    
    if (channel) {
      this.echo.leave(`chat.room.${roomId}`);
      this.channels.delete(channelName);
      console.log(`👋 Left room: ${roomId}`);
    }
    
    if (this.channels.size === 0) {
      this.intentionalDisconnect = true;
    }
  }

  // Send typing indicator
  sendTypingIndicator(roomId, isTyping = true) {
    if (!this.echo) return;

    const channelName = `private-chat.room.${roomId}`;
    const channel = this.channels.get(channelName);
    
    if (channel) {
      channel.whisper('typing', {
        user_id: this.getCurrentUserId(),
        is_typing: isTyping,
      });
    }
  }

  // Listen for typing indicators
  listenForTyping(roomId, callback) {
    if (!this.echo) return;

    const channelName = `private-chat.room.${roomId}`;
    const channel = this.channels.get(channelName);
    
    if (channel) {
      channel.listenForWhisper('typing', callback);
    }
  }

  // Get current user ID
  getCurrentUserId() {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    return user.id;
  }

  // Disconnect from WebSocket
  disconnect() {
    this.intentionalDisconnect = true;
    
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
    
    this.isReconnecting = false;
    
    if (this.echo) {
      // Leave all channels
      this.channels.forEach((channel, channelName) => {
        const roomIdMatch = channelName.match(/private-chat\.room\.(\d+)/);
        if (roomIdMatch) {
          this.echo.leave(`chat.room.${roomIdMatch[1]}`);
        }
      });
      this.channels.clear();
      
      this.echo.disconnect();
      this.echo = null;
      this.isConnected = false;
      console.log('👋 WebSocket disconnected');
    }
  }

  // Check connection status
  isConnectedToSocket() {
    return this.isConnected;
  }

  // Subscribe to user's private notification channel
  subscribeToUserChannel(userId, callbacks = {}) {
    if (!this.echo) {
      console.error('❌ WebSocket not initialized');
      return null;
    }

    const channelName = `private-user.${userId}`;
    
    if (this.channels.has(channelName)) {
      this.unsubscribeFromUserChannel(userId);
    }

    try {
      const channel = this.echo.private(`user.${userId}`);

      // Listen for new notifications
      if (callbacks.onNotificationReceived) {
        channel.listen('notification.created', (data) => {
          callbacks.onNotificationReceived(data);
        });
      }

      // Listen for notification read events
      if (callbacks.onNotificationRead) {
        channel.listen('notification.read', (data) => {
          callbacks.onNotificationRead(data);
        });
      }

      // Listen for notification deleted events
      if (callbacks.onNotificationDeleted) {
        channel.listen('notification.deleted', (data) => {
          callbacks.onNotificationDeleted(data);
        });
      }

      console.log(`✅ Subscribed to user channel: ${userId}`);
      this.channels.set(channelName, channel);
      
      return channel;
    } catch (error) {
      console.error(`❌ Failed to subscribe to user channel ${userId}:`, error);
      return null;
    }
  }

  // Unsubscribe from user's notification channel
  unsubscribeFromUserChannel(userId) {
    const channelName = `private-user.${userId}`;
    
    if (this.channels.has(channelName)) {
      this.echo.leave(`user.${userId}`);
      this.channels.delete(channelName);
      console.log(`👋 Unsubscribed from user channel: ${userId}`);
    }
  }

  // Subscribe to specific product stock updates
  subscribeToProductStock(productId, callbacks = {}) {
    if (!this.echo) {
      console.error('❌ WebSocket not initialized');
      return null;
    }

    const channelName = `product.${productId}`;
    
    if (this.channels.has(channelName)) {
      this.unsubscribeFromProductStock(productId);
    }

    try {
      const channel = this.echo.channel(`product.${productId}`);

      // Listen for stock updates
      if (callbacks.onStockUpdated) {
        channel.listen('product.stock.updated', (data) => {
          callbacks.onStockUpdated(data);
        });
      }

      // Listen for rating updates
      if (callbacks.onRatingUpdated) {
        channel.listen('product.rating.updated', (data) => {
          callbacks.onRatingUpdated(data);
        });
      }

      this.channels.set(channelName, channel);
      return channel;
    } catch (error) {
      console.error(`❌ Failed to subscribe to product ${productId}:`, error);
      return null;
    }
  }

  // Subscribe to store-wide product updates
  subscribeToStoreProducts(callbacks = {}) {
    if (!this.echo) {
      console.error('❌ WebSocket not initialized');
      return null;
    }

    const channelName = 'store.products';
    
    if (this.channels.has(channelName)) {
      this.unsubscribeFromStoreProducts();
    }

    try {
      const channel = this.echo.channel('store.products');

      // Listen for stock updates
      if (callbacks.onStockUpdated) {
        channel.listen('product.stock.updated', (data) => {
          callbacks.onStockUpdated(data);
        });
      }

      // Listen for rating updates
      if (callbacks.onRatingUpdated) {
        channel.listen('product.rating.updated', (data) => {
          callbacks.onRatingUpdated(data);
        });
      }

      this.channels.set(channelName, channel);
      return channel;
    } catch (error) {
      console.error('❌ Failed to subscribe to store products:', error);
      return null;
    }
  }

  // Unsubscribe from specific product updates
  unsubscribeFromProductStock(productId) {
    const channelName = `product.${productId}`;
    
    if (this.channels.has(channelName)) {
      this.echo.leave(`product.${productId}`);
      this.channels.delete(channelName);
    }
  }

  // Unsubscribe from store-wide product updates
  unsubscribeFromStoreProducts() {
    const channelName = 'store.products';
    
    if (this.channels.has(channelName)) {
      this.echo.leave('store.products');
      this.channels.delete(channelName);
    }
  }

  // Get Echo instance for custom operations (compatibility with old code)
  getPusher() {
    return this.echo?.connector?.pusher;
  }

  // Get Echo instance
  getEcho() {
    return this.echo;
  }
}

// Export singleton instance
const websocketService = new WebSocketService();
export default websocketService;
