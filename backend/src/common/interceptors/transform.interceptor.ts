import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface StandardSuccessResponse<T> {
  success: true;
  data: T;
  message?: string;
}

@Injectable()
export class TransformInterceptor<T>
  implements NestInterceptor<T, StandardSuccessResponse<T>>
{
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<StandardSuccessResponse<T>> {
    return next.handle().pipe(
      map((resData) => {
        // If response is already in { success: true, data: ... } format, avoid double-wrapping
        if (
          resData &&
          typeof resData === 'object' &&
          'success' in resData &&
          resData.success === true &&
          'data' in resData
        ) {
          return resData as StandardSuccessResponse<T>;
        }

        // If response contains an explicit message along with data payload
        if (
          resData &&
          typeof resData === 'object' &&
          'data' in resData &&
          'message' in resData
        ) {
          const { data, message, ...rest } = resData as {
            data: T;
            message?: string;
            [key: string]: unknown;
          };
          const response: StandardSuccessResponse<T> = {
            success: true,
            data: { ...data, ...rest },
          };
          if (message) {
            response.message = message;
          }
          return response;
        }

        return {
          success: true,
          data: (resData !== undefined ? resData : null) as T,
        };
      }),
    );
  }
}
