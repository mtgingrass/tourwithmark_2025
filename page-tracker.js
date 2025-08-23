// Page View Tracking System
(function() {
  'use strict';

  // Configuration
  const API_BASE = 'https://api.tourwithmark.com/api';
  const SESSION_KEY = 'tour_session_id';
  const SESSION_DURATION = 30 * 60 * 1000; // 30 minutes
  
  class PageTracker {
    constructor() {
      this.sessionId = this.getOrCreateSession();
      this.trackingEnabled = true;
      this.debugMode = false; // Set to true for console logging
    }

    // Get or create a session ID
    getOrCreateSession() {
      try {
        const stored = sessionStorage.getItem(SESSION_KEY);
        if (stored) {
          const session = JSON.parse(stored);
          // Check if session is still valid
          if (Date.now() - session.created < SESSION_DURATION) {
            return session.id;
          }
        }
        
        // Create new session
        const newSession = {
          id: this.generateSessionId(),
          created: Date.now()
        };
        sessionStorage.setItem(SESSION_KEY, JSON.stringify(newSession));
        return newSession.id;
      } catch (e) {
        // Fallback if sessionStorage is not available
        return this.generateSessionId();
      }
    }

    // Generate a unique session ID
    generateSessionId() {
      return 'sess_' + Date.now() + '_' + Math.random().toString(36).substring(2, 15);
    }

    // Get page information
    getPageInfo() {
      return {
        path: window.location.pathname,
        title: document.title || 'Untitled Page',
        referrer: document.referrer || 'direct',
        sessionId: this.sessionId
      };
    }

    // Send page view to server
    async trackPageView() {
      if (!this.trackingEnabled) return;

      const pageInfo = this.getPageInfo();
      
      if (this.debugMode) {
        console.log('PageTracker: Tracking page view', pageInfo);
      }

      try {
        const response = await fetch(`${API_BASE}/pageview`, {
          method: 'POST',
          mode: 'cors',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(pageInfo)
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        
        if (this.debugMode) {
          console.log('PageTracker: Page view recorded', data);
        }
        
        return data;
      } catch (error) {
        if (this.debugMode) {
          console.error('PageTracker: Failed to track page view', error);
        }
        // Silently fail - don't interrupt user experience
        return null;
      }
    }

    // Check if API is available
    async checkApiHealth() {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 2000);
        
        const response = await fetch(`${API_BASE}/health`, {
          signal: controller.signal,
          mode: 'cors'
        });
        
        clearTimeout(timeoutId);
        return response.ok;
      } catch (e) {
        if (this.debugMode) {
          console.log('PageTracker: API health check failed', e.message);
        }
        return false;
      }
    }

    // Initialize tracking
    async init() {
      // Don't track dashboard pages or admin pages
      const excludedPaths = [
        '/likes-dashboard.html',
        '/admin/',
        '/test-',
        '/_'
      ];
      
      const currentPath = window.location.pathname;
      if (excludedPaths.some(path => currentPath.includes(path))) {
        if (this.debugMode) {
          console.log('PageTracker: Skipping excluded path', currentPath);
        }
        return;
      }

      // Check if API is available
      const isAvailable = await this.checkApiHealth();
      
      if (!isAvailable) {
        if (this.debugMode) {
          console.log('PageTracker: API unavailable - tracking disabled');
        }
        this.trackingEnabled = false;
        return;
      }

      // Track the page view
      await this.trackPageView();

      // Track time on page (send update when user leaves)
      let startTime = Date.now();
      
      window.addEventListener('beforeunload', () => {
        const timeOnPage = Math.round((Date.now() - startTime) / 1000);
        // You could send this data if needed
        if (this.debugMode) {
          console.log(`PageTracker: User spent ${timeOnPage} seconds on page`);
        }
      });

      // Handle single-page app navigation if needed
      if (window.history && window.history.pushState) {
        const originalPushState = window.history.pushState;
        const tracker = this;
        
        window.history.pushState = function() {
          originalPushState.apply(window.history, arguments);
          // Track new page view on navigation
          setTimeout(() => tracker.trackPageView(), 100);
        };

        window.addEventListener('popstate', () => {
          setTimeout(() => this.trackPageView(), 100);
        });
      }
    }

    // Public method to manually track a page view
    track() {
      return this.trackPageView();
    }

    // Enable/disable tracking
    setEnabled(enabled) {
      this.trackingEnabled = enabled;
    }

    // Enable/disable debug mode
    setDebugMode(enabled) {
      this.debugMode = enabled;
    }
  }

  // Create global instance
  window.PageTracker = new PageTracker();

  // Auto-initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      window.PageTracker.init();
    });
  } else {
    window.PageTracker.init();
  }

  // Export for use in other scripts if needed
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = PageTracker;
  }
})();