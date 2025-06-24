import { defineStore } from 'pinia';

interface User {
  id: string;
  name: string;
  // add other user properties as needed
}

const baseURL = 'http://localhost:41812/API'; // Replace with your actual backend URL

export const useAuthStore = defineStore('auth', {
  state: () => ({
    isAuthenticated: false,
    user: null as User | null,
  }),
  actions: {
    setAuthenticated(authenticated: boolean) {
      this.isAuthenticated = authenticated;
    },
    setUser(user: User | null) {
      this.user = user;
    },

    async checkAuth() {
      try {
        const response = await fetch(`${baseURL}/CheckAuth`, {
          credentials: 'include',
        });
        if (response.ok) {
          const responseData = await response.json();
          this.setAuthenticated(responseData.isAuthenticated);
          this.setUser(responseData.user);
          // Optionally, retrieve user info here and update the store
        } else {
          this.setAuthenticated(false);
          this.setUser(null);
        }
      } catch {
        this.setAuthenticated(false);
        this.setUser(null);
      }
    },

    async login(username: string, password: string) {
      try {
        const response = await fetch(`${baseURL}/Login`, {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username, password }),
        });
        if (response.ok) {
          this.setAuthenticated(true);
          // Optionally, retrieve user info here and update the store
          return true;
        }
        return false;
      } catch (error) {
        console.error('Login error:', error);
        return false;
      }
    },

    async logout() {
      try {
        const response = await fetch(`${baseURL}/Logout`, {
          method: 'POST',
          credentials: 'include',
        });
        if (response.ok) {
          this.setAuthenticated(false);
          this.setUser(null);
        }
      } catch (error) {
        console.error('Logout error:', error);
      }
    },
  },
});
