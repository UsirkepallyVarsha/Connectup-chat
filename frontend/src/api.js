const API_BASE =
  process.env.REACT_APP_API_URL || "http://localhost:5000";

const getToken = () => localStorage.getItem("token");

export const API = {
  // AUTH
  async register(data) {
    const res = await fetch(`${API_BASE}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    return res.json();
  },

  async login(data) {
    const res = await fetch(`${API_BASE}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    return res.json();
  },

  async getMyProfile() {
    const res = await fetch(`${API_BASE}/api/profile/me`, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${getToken()}`,
      },
    });
    return res.json();
  },

  async updateMyProfile(data) {
    const res = await fetch(`${API_BASE}/api/profile/me`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${getToken()}`,
      },
      body: JSON.stringify(data),
    });
    return res.json();
  },

  // PERSONAL MESSAGES
  async getMessagesWith(otherId) {
    const res = await fetch(`${API_BASE}/api/messages/${otherId}`, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${getToken()}`,
      },
    });
    return res.json();
  },

  async deleteConversation(otherId) {
    const res = await fetch(
      `${API_BASE}/api/messages/conversation/${otherId}`,
      {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getToken()}`,
        },
      }
    );
    return res.json();
  },

  async deleteMessage(messageId) {
    const res = await fetch(`${API_BASE}/api/messages/${messageId}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${getToken()}`,
      },
    });
    return res.json();
  },

  // GROUPS
  async getGroups() {
    const res = await fetch(`${API_BASE}/api/groups`, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${getToken()}`,
      },
    });
    return res.json();
  },

  async createGroup(body) {
    const res = await fetch(`${API_BASE}/api/groups`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${getToken()}`,
      },
      body: JSON.stringify(body),
    });
    return res.json();
  },

  async updateGroup(id, body) {
    const res = await fetch(`${API_BASE}/api/groups/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${getToken()}`,
      },
      body: JSON.stringify(body),
    });
    return res.json();
  },

  async getGroupMessages(groupId) {
    const res = await fetch(
      `${API_BASE}/api/groups/${groupId}/messages`,
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getToken()}`,
        },
      }
    );
    return res.json();
  },

  async deleteGroup(groupId) {
    const res = await fetch(`${API_BASE}/api/groups/${groupId}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${getToken()}`,
      },
    });
    return res.json();
  },

  async deleteGroupMessage(messageId) {
    const res = await fetch(
      `${API_BASE}/api/group-messages/${messageId}`,
      {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getToken()}`,
        },
      }
    );
    return res.json();
  },

  async requestJoinGroup(groupId) {
    const res = await fetch(`${API_BASE}/api/groups/${groupId}/join`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${getToken()}`,
      },
    });
    return res.json();
  },

  async approveMember(groupId, userId) {
    const res = await fetch(
      `${API_BASE}/api/groups/${groupId}/approve/${userId}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getToken()}`,
        },
      }
    );
    return res.json();
  },

  async rejectMember(groupId, userId) {
    const res = await fetch(
      `${API_BASE}/api/groups/${groupId}/reject/${userId}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getToken()}`,
        },
      }
    );
    return res.json();
  },

  async addMember(groupId, userId) {
    const res = await fetch(
      `${API_BASE}/api/groups/${groupId}/add-member/${userId}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getToken()}`,
        },
      }
    );
    return res.json();
  },

  async removeMember(groupId, userId) {
    const res = await fetch(
      `${API_BASE}/api/groups/${groupId}/remove-member/${userId}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getToken()}`,
        },
      }
    );
    return res.json();
  },

  async getGroupMembers(groupId) {
    const res = await fetch(`${API_BASE}/api/groups/${groupId}/members`, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${getToken()}`,
      },
    });
    return res.json();
  },

  // CONNECTIONS
  async getPeople() {
    const res = await fetch(`${API_BASE}/api/connections/people`, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${getToken()}`,
      },
    });
    return res.json();
  },

  async sendRequest(id) {
    const res = await fetch(
      `${API_BASE}/api/connections/request/${id}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getToken()}`,
        },
      }
    );
    return res.json();
  },

  async acceptRequest(id) {
    const res = await fetch(
      `${API_BASE}/api/connections/accept/${id}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getToken()}`,
        },
      }
    );
    return res.json();
  },

  async ignoreRequest(id) {
    const res = await fetch(
      `${API_BASE}/api/connections/ignore/${id}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getToken()}`,
        },
      }
    );
    return res.json();
  },
};
