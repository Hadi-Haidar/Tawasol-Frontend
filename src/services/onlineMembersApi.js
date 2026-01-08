// Online Members API Service - Disabled
// All methods return empty responses to maintain compatibility

import apiService from './apiService';

class OnlineMembersApiService {
  /**
   * Get online members for a room - Disabled
   */
  async getOnlineMembers(roomId) {
    return {
      online_members: [],
      count: 0
    };
  }

  /**
   * Mark user as online in a room - Disabled
   */
  async markOnline(roomId) {
    return {
      message: 'Marked as online',
      online_members: []
    };
  }

  /**
   * Mark user as offline in a room - Disabled
   */
  async markOffline(roomId) {
    return {
      message: 'Marked as offline',
      online_members: []
    };
  }

  /**
   * Update user activity (heartbeat) - Disabled
   */
  async updateActivity(roomId) {
    return {
      message: 'Activity updated'
    };
  }
}

export default new OnlineMembersApiService();
