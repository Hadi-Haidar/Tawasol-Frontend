import { createEcho, getEcho, disconnectEcho, isEchoConnected } from '../lib/echo';

class WebSocketService {
  constructor() {
    this.channels = new Map();
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectTimeout = null;
    this.isInitialized = false;
  }

  // Initialize WebSocket with auth token
  initialize(token) {
    if (!token) {
      console.warn('No token provided for WebSocket initialization');
      return;
    }
    
    // Create the singleton Echo instance with token
    // Echo auto-connects, no need to wait
    createEcho(token);
    
    this.isInitialized = true;
    this.reconnectAttempts = 0;
  }

  // Check if connected
  isConnectedToSocket() {
    return isEchoConnected();
  }

  // Get the Echo instance
  getEcho() {
    return getEcho();
  }

  // Get Pusher instance (for compatibility)
  getPusher() {
    const echo = getEcho();
    return echo?.connector?.pusher || null;
  }

  // Disconnect (rarely needed, Echo stays alive)
  disconnect() {
    // Clear reconnect timeout if any
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
    
    // Leave all channels
    this.channels.forEach((channel, channelName) => {
      try {
        this.leaveChannelByName(channelName);
      } catch (err) {
        console.warn('Error leaving channel:', channelName, err);
      }
    });
    this.channels.clear();
    
    // Note: We don't disconnect Echo itself as it's a singleton
  }

  // Helper to leave a channel by its name
  leaveChannelByName(channelName) {
    const echo = getEcho();
    if (!echo) return;

    // Extract the actual channel name from our prefixed version
    const roomIdMatch = channelName.match(/^private-chat\.room\.(\d+)$/);
    if (roomIdMatch) {
      echo.leave(`chat.room.${roomIdMatch[1]}`);
    } else {
      const userMatch = channelName.match(/^private-user\.(\d+)$/);
      if (userMatch) {
        echo.leave(`user.${userMatch[1]}`);
      } else {
        // Generic channel
        const match = channelName.match(/^(?:private-)?(.+)$/);
        if (match) {
          echo.leave(match[1]);
        }
      }
    }
  }

  // Join a chat room
  joinRoom(roomId, callbacks = {}) {
    const echo = getEcho();
    if (!echo) {
      console.error('Echo not initialized');
      return null;
    }

    const channelName = `private-chat.room.${roomId}`;
    
    // Leave existing channel if already joined
    if (this.channels.has(channelName)) {
      this.leaveRoom(roomId);
    }

    try {
      const channel = echo.private(`chat.room.${roomId}`);

      // Bind events - use dot prefix because backend uses broadcastAs()
      if (callbacks.onMessage) {
        channel.listen('.message.sent', callbacks.onMessage);
      }
      if (callbacks.onMessageEdited) {
        channel.listen('.message.edited', callbacks.onMessageEdited);
      }
      if (callbacks.onMessageDeleted) {
        channel.listen('.message.deleted', callbacks.onMessageDeleted);
      }
      if (callbacks.onTyping) {
        channel.listen('.user.typing', callbacks.onTyping);
      }
      if (callbacks.onUserJoined) {
        channel.listen('.user.joined', callbacks.onUserJoined);
      }
      if (callbacks.onUserLeft) {
        channel.listen('.user.left', callbacks.onUserLeft);
      }

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
    
    if (this.channels.has(channelName)) {
      this.leaveChannelByName(channelName);
      this.channels.delete(channelName);
    }
  }

  // Send typing indicator
  sendTypingIndicator(roomId, isTyping = true) {
    const channelName = `private-chat.room.${roomId}`;
    const channel = this.channels.get(channelName);
    
    if (channel && channel.whisper) {
      channel.whisper('typing', {
        user_id: this.getCurrentUserId(),
        is_typing: isTyping,
      });
    }
  }

  // Listen for typing
  listenForTyping(roomId, callback) {
    const channelName = `private-chat.room.${roomId}`;
    const channel = this.channels.get(channelName);
    
    if (channel && channel.listenForWhisper) {
      channel.listenForWhisper('typing', callback);
    }
  }

  // Get current user ID
  getCurrentUserId() {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    return user.id;
  }

  // Subscribe to user channel for notifications
  subscribeToUserChannel(userId, callbacks = {}) {
    const echo = getEcho();
    if (!echo) {
      console.error('Echo not initialized');
      return null;
    }

    const channelName = `private-user.${userId}`;
    
    if (this.channels.has(channelName)) {
      this.unsubscribeFromUserChannel(userId);
    }

    try {
      const channel = echo.private(`user.${userId}`);

      if (callbacks.onNotificationReceived) {
        channel.listen('notification.created', callbacks.onNotificationReceived);
      }
      if (callbacks.onNotificationRead) {
        channel.listen('notification.read', callbacks.onNotificationRead);
      }
      if (callbacks.onNotificationDeleted) {
        channel.listen('notification.deleted', callbacks.onNotificationDeleted);
      }

      this.channels.set(channelName, channel);
      
      return channel;
    } catch (error) {
      console.error(`Failed to subscribe to user channel ${userId}:`, error);
      return null;
    }
  }

  // Unsubscribe from user channel
  unsubscribeFromUserChannel(userId) {
    const channelName = `private-user.${userId}`;
    
    if (this.channels.has(channelName)) {
      this.leaveChannelByName(channelName);
      this.channels.delete(channelName);
    }
  }

  // Subscribe to product stock updates
  subscribeToProductStock(productId, callbacks = {}) {
    const echo = getEcho();
    if (!echo) {
      console.error('❌ Echo not initialized');
      return null;
    }

    const channelName = `product.${productId}`;
    
    if (this.channels.has(channelName)) {
      this.unsubscribeFromProductStock(productId);
    }

    try {
      const channel = echo.channel(`product.${productId}`);

      if (callbacks.onStockUpdated) {
        channel.listen('product.stock.updated', callbacks.onStockUpdated);
      }
      if (callbacks.onRatingUpdated) {
        channel.listen('product.rating.updated', callbacks.onRatingUpdated);
      }

      this.channels.set(channelName, channel);
      return channel;
    } catch (error) {
      console.error(`❌ Failed to subscribe to product ${productId}:`, error);
      return null;
    }
  }

  // Unsubscribe from product stock
  unsubscribeFromProductStock(productId) {
    const channelName = `product.${productId}`;
    
    if (this.channels.has(channelName)) {
      const echo = getEcho();
      if (echo) {
        echo.leave(`product.${productId}`);
      }
      this.channels.delete(channelName);
    }
  }

  // Subscribe to store products
  subscribeToStoreProducts(callbacks = {}) {
    const echo = getEcho();
    if (!echo) {
      console.error('❌ Echo not initialized');
      return null;
    }

    const channelName = 'store.products';
    
    if (this.channels.has(channelName)) {
      this.unsubscribeFromStoreProducts();
    }

    try {
      const channel = echo.channel('store.products');

      if (callbacks.onStockUpdated) {
        channel.listen('product.stock.updated', callbacks.onStockUpdated);
      }
      if (callbacks.onRatingUpdated) {
        channel.listen('product.rating.updated', callbacks.onRatingUpdated);
      }

      this.channels.set(channelName, channel);
      return channel;
    } catch (error) {
      console.error('❌ Failed to subscribe to store products:', error);
      return null;
    }
  }

  // Unsubscribe from store products
  unsubscribeFromStoreProducts() {
    const channelName = 'store.products';
    
    if (this.channels.has(channelName)) {
      const echo = getEcho();
      if (echo) {
        echo.leave('store.products');
      }
      this.channels.delete(channelName);
    }
  }
}

// Export singleton instance
const websocketService = new WebSocketService();
export default websocketService;
