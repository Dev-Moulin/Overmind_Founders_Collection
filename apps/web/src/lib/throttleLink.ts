/**
 * Apollo Link for rate limiting / throttling requests
 *
 * Prevents 429 errors by:
 * 1. Queuing requests and sending them with a minimum delay between each
 * 2. Auto-retry with exponential backoff on 429 responses
 *
 * @see https://www.apollographql.com/docs/react/api/link/introduction
 */

import { ApolloLink, Observable, type Operation, type FetchResult, type NextLink } from '@apollo/client';

/** Configuration options for the throttle link */
interface ThrottleLinkOptions {
  /** Minimum delay between requests in ms (default: 100) */
  minDelay?: number;
  /** Maximum concurrent requests (default: 3) */
  maxConcurrent?: number;
  /** Max retries on 429 (default: 3) */
  maxRetries?: number;
  /** Initial retry delay in ms (default: 1000) */
  retryDelay?: number;
}

/** Observer type for Apollo Observable */
interface ObservableObserver<T> {
  next: (value: T) => void;
  error: (error: unknown) => void;
  complete: () => void;
}

interface QueuedRequest {
  operation: Operation;
  forward: NextLink;
  observer: ObservableObserver<FetchResult>;
  retryCount: number;
}

/**
 * Creates a throttling Apollo Link that rate-limits requests
 *
 * @example
 * ```ts
 * const throttleLink = createThrottleLink({
 *   minDelay: 100,      // 100ms between requests
 *   maxConcurrent: 3,   // Max 3 concurrent requests
 *   maxRetries: 3,      // Retry 3 times on 429
 * });
 *
 * const client = new ApolloClient({
 *   link: ApolloLink.from([throttleLink, httpLink]),
 *   // ...
 * });
 * ```
 */
export function createThrottleLink(options: ThrottleLinkOptions = {}): ApolloLink {
  const {
    minDelay = 100,
    maxConcurrent = 3,
    maxRetries = 3,
    retryDelay = 1000,
  } = options;

  // Request queue
  const queue: QueuedRequest[] = [];
  let activeRequests = 0;
  let lastRequestTime = 0;
  let isProcessing = false;

  // Process the queue
  const processQueue = () => {
    if (isProcessing) return;
    isProcessing = true;

    const processNext = () => {
      // Check if we can send more requests
      if (queue.length === 0 || activeRequests >= maxConcurrent) {
        isProcessing = false;
        return;
      }

      // Check minimum delay
      const now = Date.now();
      const timeSinceLastRequest = now - lastRequestTime;
      if (timeSinceLastRequest < minDelay) {
        setTimeout(processNext, minDelay - timeSinceLastRequest);
        return;
      }

      // Get next request from queue
      const request = queue.shift();
      if (!request) {
        isProcessing = false;
        return;
      }

      activeRequests++;
      lastRequestTime = Date.now();

      // Execute the request
      const subscription = request.forward(request.operation).subscribe({
        next: (result) => {
          request.observer.next(result);
        },
        error: (error) => {
          // Check for 429 rate limit error
          // Note: When CORS blocks a 429 response, we get a network error without status code
          // So we also treat network errors (ERR_FAILED, Failed to fetch) as potential 429s
          const errorMessage = String(error?.message || error || '').toLowerCase();
          const is429 = error?.statusCode === 429 ||
            errorMessage.includes('429') ||
            errorMessage.includes('too many requests') ||
            errorMessage.includes('failed to fetch') ||
            errorMessage.includes('network') ||
            errorMessage.includes('err_failed');

          if (is429 && request.retryCount < maxRetries) {
            // Retry with exponential backoff
            const delay = retryDelay * Math.pow(2, request.retryCount);
            console.warn(`[ThrottleLink] Rate limit or network error, retrying in ${delay}ms (attempt ${request.retryCount + 1}/${maxRetries})`);

            request.retryCount++;
            // Put back in queue with priority (at the front)
            setTimeout(() => {
              queue.unshift(request);
              processQueue();
            }, delay);
          } else {
            request.observer.error(error);
          }
          activeRequests--;
          processNext();
        },
        complete: () => {
          request.observer.complete();
          activeRequests--;
          processNext();
        },
      });

      // Allow cancellation
      return () => {
        subscription.unsubscribe();
        activeRequests--;
      };
    };

    processNext();
  };

  return new ApolloLink((operation, forward) => {
    return new Observable((observer) => {
      // Add to queue
      queue.push({
        operation,
        forward,
        observer,
        retryCount: 0,
      });

      // Start processing
      processQueue();

      // Return cleanup function
      return () => {
        // Remove from queue if not yet processed
        const index = queue.findIndex((r) => r.operation === operation);
        if (index !== -1) {
          queue.splice(index, 1);
        }
      };
    });
  });
}
