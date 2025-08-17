// Performance monitoring utility
export const performanceMonitor = {
  // Track component render times
  trackRender: (componentName) => {
    const start = performance.now();
    return () => {
      const duration = performance.now() - start;
      if (duration > 16) { // Log if render takes longer than 16ms (60fps)
        console.warn(`🚨 Slow render detected in ${componentName}: ${duration.toFixed(2)}ms`);
      }
    };
  },

  // Track API call performance
  trackAPI: async (apiName, apiCall) => {
    const start = performance.now();
    try {
      const result = await apiCall();
      const duration = performance.now() - start;
      if (duration > 1000) { // Log if API call takes longer than 1 second
        console.warn(`🐌 Slow API call detected: ${apiName} took ${duration.toFixed(2)}ms`);
      }
      return result;
    } catch (error) {
      const duration = performance.now() - start;
      console.error(`❌ API call failed: ${apiName} after ${duration.toFixed(2)}ms`, error);
      throw error;
    }
  },

  // Track memory usage
  trackMemory: () => {
    if ('memory' in performance) {
      const memory = performance.memory;
      const usedMB = Math.round(memory.usedJSHeapSize / 1024 / 1024);
      const totalMB = Math.round(memory.totalJSHeapSize / 1024 / 1024);
      
      if (usedMB > 100) { // Warn if memory usage is high
        console.warn(`⚠️ High memory usage: ${usedMB}MB / ${totalMB}MB`);
      }
      
      return { used: usedMB, total: totalMB };
    }
    return null;
  },

  // Debounce function for performance
  debounce: (func, wait) => {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  },

  // Throttle function for performance
  throttle: (func, limit) => {
    let inThrottle;
    return function() {
      const args = arguments;
      const context = this;
      if (!inThrottle) {
        func.apply(context, args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  }
};

// Performance observer for long tasks
if ('PerformanceObserver' in window) {
  const observer = new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) {
      if (entry.duration > 50) { // Log tasks longer than 50ms
        console.warn(`🐌 Long task detected: ${entry.duration.toFixed(2)}ms`, entry);
      }
    }
  });
  
  try {
    observer.observe({ entryTypes: ['longtask'] });
  } catch (e) {
    console.warn('Long task observer not supported');
  }
}
