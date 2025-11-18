/**
 * Axiom Logging Integration
 *
 * 프론트엔드 로그 수집 및 에러 트래킹을 위한 Axiom 통합
 *
 * @module lib/logger
 */

import { Axiom } from '@axiomhq/js';

/**
 * 로그 레벨
 */
export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

/**
 * 로그 엔트리
 */
interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  data?: Record<string, unknown>;
  error?: {
    name: string;
    message: string;
    stack?: string;
  };
  context?: {
    url?: string;
    userAgent?: string;
    userId?: string;
  };
}

/**
 * Axiom 클라이언트 인스턴스
 */
let axiomClient: Axiom | null = null;

/**
 * 로깅 활성화 여부
 */
let isLoggingEnabled = false;

/**
 * Axiom 초기화
 *
 * 환경 변수에서 Axiom 설정을 읽어와 초기화합니다.
 */
function initializeAxiom(): void {
  const token = import.meta.env.VITE_AXIOM_TOKEN;
  const dataset = import.meta.env.VITE_AXIOM_DATASET;

  // API 토큰이 없으면 초기화하지 않음 (개발 환경 허용)
  if (!token || !dataset) {
    console.warn('[Logger] Axiom credentials not found. Logging to console only.');
    return;
  }

  try {
    axiomClient = new Axiom({
      token,
      dataset,
    });

    isLoggingEnabled = true;
    console.log('[Logger] Axiom initialized successfully');
  } catch (error) {
    console.error('[Logger] Failed to initialize Axiom:', error);
  }
}

// 모듈 로드 시 자동 초기화
initializeAxiom();

/**
 * 로그 전송 (내부 함수)
 *
 * @param entry - 로그 엔트리
 */
async function sendLog(entry: LogEntry): Promise<void> {
  if (!isLoggingEnabled || !axiomClient) {
    // Axiom이 비활성화된 경우 콘솔에만 출력
    const consoleMethod = entry.level === 'error' ? console.error :
                          entry.level === 'warn' ? console.warn :
                          entry.level === 'debug' ? console.debug :
                          console.log;

    consoleMethod(`[${entry.level.toUpperCase()}]`, entry.message, entry.data || '');
    return;
  }

  try {
    // Axiom에 로그 전송 (비동기, fire-and-forget)
    axiomClient.ingest([entry]);

    // 개발 환경에서는 콘솔에도 출력
    if (import.meta.env.DEV) {
      console.log(`[Logger] ${entry.level}:`, entry.message, entry.data || '');
    }
  } catch (error) {
    // 로깅 실패는 조용히 처리 (무한 루프 방지)
    console.error('[Logger] Failed to send log to Axiom:', error);
  }
}

/**
 * 공통 컨텍스트 생성
 *
 * @param userId - 사용자 ID (선택)
 * @returns 컨텍스트 객체
 */
function createContext(userId?: string): LogEntry['context'] {
  return {
    url: window.location.href,
    userAgent: navigator.userAgent,
    userId,
  };
}

/**
 * Logger 클래스
 *
 * 통합 로깅 인터페이스
 */
class Logger {
  /**
   * 디버그 로그 (개발 환경에서만)
   *
   * @param message - 로그 메시지
   * @param data - 추가 데이터 (선택)
   */
  debug(message: string, data?: Record<string, unknown>): void {
    // 프로덕션에서는 디버그 로그를 전송하지 않음
    if (!import.meta.env.DEV) {
      return;
    }

    const entry: LogEntry = {
      level: 'debug',
      message,
      timestamp: new Date().toISOString(),
      data,
      context: createContext(),
    };

    sendLog(entry);
  }

  /**
   * 정보 로그
   *
   * @param message - 로그 메시지
   * @param data - 추가 데이터 (선택)
   */
  info(message: string, data?: Record<string, unknown>): void {
    const entry: LogEntry = {
      level: 'info',
      message,
      timestamp: new Date().toISOString(),
      data,
      context: createContext(),
    };

    sendLog(entry);
  }

  /**
   * 경고 로그
   *
   * @param message - 로그 메시지
   * @param data - 추가 데이터 (선택)
   */
  warn(message: string, data?: Record<string, unknown>): void {
    const entry: LogEntry = {
      level: 'warn',
      message,
      timestamp: new Date().toISOString(),
      data,
      context: createContext(),
    };

    sendLog(entry);
  }

  /**
   * 에러 로그
   *
   * @param message - 로그 메시지
   * @param error - Error 객체 (선택)
   * @param data - 추가 데이터 (선택)
   */
  error(
    message: string,
    error?: Error | unknown,
    data?: Record<string, unknown>,
  ): void {
    const entry: LogEntry = {
      level: 'error',
      message,
      timestamp: new Date().toISOString(),
      data,
      context: createContext(),
    };

    // Error 객체가 있으면 추가
    if (error instanceof Error) {
      entry.error = {
        name: error.name,
        message: error.message,
        stack: error.stack,
      };
    } else if (error) {
      // Error 객체가 아닌 경우 문자열로 변환
      entry.error = {
        name: 'UnknownError',
        message: String(error),
      };
    }

    sendLog(entry);
  }

  /**
   * 사용자 컨텍스트와 함께 로그 생성
   *
   * @param userId - 사용자 ID
   * @returns 사용자 컨텍스트가 추가된 로거
   */
  withUser(userId: string) {
    return {
      debug: (message: string, data?: Record<string, unknown>) => {
        if (!import.meta.env.DEV) return;
        const entry: LogEntry = {
          level: 'debug',
          message,
          timestamp: new Date().toISOString(),
          data,
          context: createContext(userId),
        };
        sendLog(entry);
      },
      info: (message: string, data?: Record<string, unknown>) => {
        const entry: LogEntry = {
          level: 'info',
          message,
          timestamp: new Date().toISOString(),
          data,
          context: createContext(userId),
        };
        sendLog(entry);
      },
      warn: (message: string, data?: Record<string, unknown>) => {
        const entry: LogEntry = {
          level: 'warn',
          message,
          timestamp: new Date().toISOString(),
          data,
          context: createContext(userId),
        };
        sendLog(entry);
      },
      error: (
        message: string,
        error?: Error | unknown,
        data?: Record<string, unknown>,
      ) => {
        const entry: LogEntry = {
          level: 'error',
          message,
          timestamp: new Date().toISOString(),
          data,
          context: createContext(userId),
        };

        if (error instanceof Error) {
          entry.error = {
            name: error.name,
            message: error.message,
            stack: error.stack,
          };
        } else if (error) {
          entry.error = {
            name: 'UnknownError',
            message: String(error),
          };
        }

        sendLog(entry);
      },
    };
  }
}

/**
 * 싱글톤 로거 인스턴스
 */
export const logger = new Logger();

/**
 * 전역 에러 핸들러 설정
 *
 * 캐치되지 않은 에러를 자동으로 로깅합니다.
 * App 최상위에서 한 번만 호출하세요.
 */
export function setupGlobalErrorHandling(): void {
  // 전역 에러 핸들러
  window.addEventListener('error', (event) => {
    logger.error('Uncaught error', event.error, {
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno,
    });
  });

  // Promise rejection 핸들러
  window.addEventListener('unhandledrejection', (event) => {
    logger.error('Unhandled promise rejection', event.reason, {
      promise: String(event.promise),
    });
  });

  console.log('[Logger] Global error handling enabled');
}

/**
 * API 에러 로깅 헬퍼
 *
 * API 호출 에러를 일관되게 로깅합니다.
 *
 * @param error - Error 객체
 * @param context - 추가 컨텍스트 (엔드포인트, 메서드 등)
 *
 * @example
 * ```typescript
 * try {
 *   await placesApi.create(data);
 * } catch (error) {
 *   logApiError(error, {
 *     endpoint: '/api/places',
 *     method: 'POST',
 *   });
 * }
 * ```
 */
export function logApiError(
  error: Error | unknown,
  context: {
    endpoint?: string;
    method?: string;
    status?: number;
  },
): void {
  logger.error('API request failed', error, {
    ...context,
    type: 'api_error',
  });
}
