// Tour Likes System - Frontend JavaScript with Graceful Degradation
(function() {
  'use strict';

  // Configuration
  const API_BASE = 'http://159.203.106.224:3000/api';
  const HEALTH_CHECK_TIMEOUT = 2000; // 2 seconds
  const STORAGE_KEY = 'tour_likes_cache';

  class TourLikes {
    constructor() {
      this.apiAvailable = false;
      this.cache = this.loadCache();
      this.postId = this.getPostId();
    }

    // Load cached data from localStorage
    loadCache() {
      try {
        const cached = localStorage.getItem(STORAGE_KEY);
        return cached ? JSON.parse(cached) : {};
      } catch (e) {
        return {};
      }
    }

    // Save cache to localStorage
    saveCache() {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(this.cache));
      } catch (e) {
        console.error('Failed to save cache:', e);
      }
    }

    // Extract post ID from URL
    getPostId() {
      const path = window.location.pathname;
      const match = path.match(/\/tours\/([^\/]+)/);
      if (match) {
        return match[1];
      }
      // Fallback to page title
      const title = document.querySelector('h1')?.textContent || document.title;
      return title.toLowerCase().replace(/[^a-z0-9]+/g, '-').substring(0, 50);
    }

    // Check if API is available
    async checkApiHealth() {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), HEALTH_CHECK_TIMEOUT);
        
        const response = await fetch(`${API_BASE}/health`, {
          signal: controller.signal,
          mode: 'cors'
        });
        
        clearTimeout(timeoutId);
        this.apiAvailable = response.ok;
        return this.apiAvailable;
      } catch (e) {
        this.apiAvailable = false;
        return false;
      }
    }

    // Initialize the like widget
    async init() {
      // Check API availability
      const isAvailable = await this.checkApiHealth();
      
      if (!isAvailable) {
        console.log('Like API unavailable - feature disabled');
        return;
      }

      // Find or create container
      let container = document.getElementById('tour-likes-container');
      if (!container) {
        // Try to insert after the main content
        const article = document.querySelector('article') || document.querySelector('main');
        if (article) {
          container = document.createElement('div');
          container.id = 'tour-likes-container';
          
          // Find a good place to insert (after content, before comments if they exist)
          const lastParagraph = article.querySelector('p:last-of-type');
          if (lastParagraph) {
            lastParagraph.insertAdjacentElement('afterend', container);
          } else {
            article.appendChild(container);
          }
        }
      }

      if (!container) {
        console.error('Could not find or create container for likes');
        return;
      }

      // Create the like widget
      this.createWidget(container);
      
      // Load current like status
      await this.loadLikeStatus();
    }

    // Create the like widget HTML
    createWidget(container) {
      const widget = document.createElement('div');
      widget.className = 'tour-likes-widget';
      widget.innerHTML = `
        <div class="like-button-wrapper">
          <button class="like-button" id="like-button" disabled>
            <svg class="heart-icon" viewBox="0 0 24 24" width="24" height="24">
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
            </svg>
            <span class="like-count">0</span>
          </button>
          <div class="like-text">
            <span class="like-action">Like this tour</span>
          </div>
        </div>
      `;
      
      container.appendChild(widget);
      
      // Add event listener
      const button = document.getElementById('like-button');
      button.addEventListener('click', () => this.toggleLike());
    }

    // Load current like status from API
    async loadLikeStatus() {
      try {
        const response = await fetch(`${API_BASE}/likes/${this.postId}`, {
          mode: 'cors',
          credentials: 'include'
        });
        
        if (response.ok) {
          const data = await response.json();
          this.updateDisplay(data.count, data.userLiked);
          
          // Update cache
          this.cache[this.postId] = {
            count: data.count,
            userLiked: data.userLiked,
            timestamp: Date.now()
          };
          this.saveCache();
        } else {
          // Use cached data if available
          this.useCachedData();
        }
      } catch (e) {
        console.error('Failed to load like status:', e);
        this.useCachedData();
      }
    }

    // Use cached data as fallback
    useCachedData() {
      const cached = this.cache[this.postId];
      if (cached) {
        this.updateDisplay(cached.count, cached.userLiked);
      } else {
        this.updateDisplay(0, false);
      }
    }

    // Toggle like status
    async toggleLike() {
      const button = document.getElementById('like-button');
      button.disabled = true;
      
      try {
        const response = await fetch(`${API_BASE}/likes/${this.postId}`, {
          method: 'POST',
          mode: 'cors',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json'
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          this.updateDisplay(data.count, data.liked);
          
          // Update cache
          this.cache[this.postId] = {
            count: data.count,
            userLiked: data.liked,
            timestamp: Date.now()
          };
          this.saveCache();
          
          // Add animation
          button.classList.add('liked-animation');
          setTimeout(() => button.classList.remove('liked-animation'), 600);
        } else {
          alert('Failed to update like. Please try again.');
        }
      } catch (e) {
        console.error('Failed to toggle like:', e);
        alert('Could not connect to server. Please try again later.');
      } finally {
        button.disabled = false;
      }
    }

    // Update the display
    updateDisplay(count, userLiked) {
      const button = document.getElementById('like-button');
      const countElement = button.querySelector('.like-count');
      const actionElement = document.querySelector('.like-action');
      
      countElement.textContent = count;
      button.disabled = false;
      
      if (userLiked) {
        button.classList.add('liked');
        actionElement.textContent = 'You liked this tour';
      } else {
        button.classList.remove('liked');
        actionElement.textContent = 'Like this tour';
      }
    }
  }

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      const likes = new TourLikes();
      likes.init();
    });
  } else {
    const likes = new TourLikes();
    likes.init();
  }
})();