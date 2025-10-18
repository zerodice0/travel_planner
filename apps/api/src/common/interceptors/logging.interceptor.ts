import { Injectable, NestInterceptor, ExecutionContext, CallHandler, Logger } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Request, Response } from 'express';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP');

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const ctx = context.switchToHttp();
    const request = ctx.getRequest<Request>();
    const response = ctx.getResponse<Response>();
    const { method, url, ip } = request;
    const userAgent = request.get('user-agent') || '';
    const startTime = Date.now();

    // 요청 로깅
    this.logger.log(`→ ${method} ${url} | IP: ${ip} | UA: ${userAgent.substring(0, 50)}`);

    return next.handle().pipe(
      tap({
        next: () => {
          const { statusCode } = response;
          const responseTime = Date.now() - startTime;

          // 성공 응답 로깅
          this.logger.log(
            `← ${method} ${url} | Status: ${statusCode} | ${responseTime}ms`
          );
        },
        error: (error: Error) => {
          const responseTime = Date.now() - startTime;
          const statusCode = (error as { statusCode?: number }).statusCode || 500;

          // 에러 응답 로깅
          this.logger.error(
            `← ${method} ${url} | Status: ${statusCode} | ${responseTime}ms | Error: ${error.message}`,
            error.stack
          );
        },
      })
    );
  }
}
