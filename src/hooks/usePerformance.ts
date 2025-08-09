import { useEffect, useRef } from 'react';

interface PerformanceMetrics {
  pageLoadTime: number;
  apiResponseTime: number;
  userInteractions: number;
}

export function usePerformance() {
  const startTime = useRef<number>(Date.now());
  const metrics = useRef<PerformanceMetrics>({
    pageLoadTime: 0,
    apiResponseTime: 0,
    userInteractions: 0
  });

  useEffect(() => {
    // Track page load time
    const handleLoad = () => {
      metrics.current.pageLoadTime = Date.now() - startTime.current;
      console.log('Page load time:', metrics.current.pageLoadTime, 'ms');
    };

    // Track API response times
    const originalFetch = window.fetch;
    window.fetch = async (...args) => {
      const start = Date.now();
      try {
        const response = await originalFetch(...args);
        const responseTime = Date.now() - start;
        metrics.current.apiResponseTime = responseTime;
        console.log('API response time:', responseTime, 'ms');
        return response;
      } catch (error) {
        const responseTime = Date.now() - start;
        console.error('API error response time:', responseTime, 'ms');
        throw error;
      }
    };

    // Track user interactions
    const handleInteraction = () => {
      metrics.current.userInteractions++;
    };

    window.addEventListener('load', handleLoad);
    window.addEventListener('click', handleInteraction);
    window.addEventListener('keydown', handleInteraction);

    return () => {
      window.removeEventListener('load', handleLoad);
      window.removeEventListener('click', handleInteraction);
      window.removeEventListener('keydown', handleInteraction);
      window.fetch = originalFetch;
    };
  }, []);

  const getMetrics = () => metrics.current;

  const logMetrics = () => {
    console.log('Performance Metrics:', metrics.current);
  };

  return { getMetrics, logMetrics };
}
