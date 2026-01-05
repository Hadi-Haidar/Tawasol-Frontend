import apiService from './apiService';

class OnlineMembersApiService {
  /**
   * Get online members for a room
   */
  async getOnlineMembers(roomId) {try {
      const response = await apiService.get(`/chat-rooms/${roomId}/online-members`);return response;
    } catch (error) {
      console.error('❌ OnlineMembersApi: Error fetching online members:', error);
      throw error;
    }
  }

  /**
   * Mark user as online in a room
   */
  async markOnline(roomId) {try {
      const response = await apiService.post(`/chat-rooms/${roomId}/mark-online`);return response;
    } catch (error) {
      console.error('❌ OnlineMembersApi: Error marking user as online:', error);
      throw error;
    }
  }

  /**
   * Mark user as offline in a room
   */
  async markOffline(roomId) {try {
      const response = await apiService.post(`/chat-rooms/${roomId}/mark-offline`);return response;
    } catch (error) {
      console.error('❌ OnlineMembersApi: Error marking user as offline:', error);
      throw error;
    }
  }

  /**
   * Update user activity (heartbeat)
   */
  async updateActivity(roomId) {try {
      const response = await apiService.post(`/chat-rooms/${roomId}/update-activity`);return response;
    } catch (error) {
      console.error('❌ OnlineMembersApi: Error updating user activity:', error);
      throw error;
    }
  }

}

export default new OnlineMembersApiService(); 