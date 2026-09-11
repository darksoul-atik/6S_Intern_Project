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

        // If response contains a data property (with or without message)
        if (
          resData &&
          typeof resData === 'object' &&
          'data' in resData
        ) {
          const { data, message } = resData as {
            data: T;
            message?: string;
          };
          const response: StandardSuccessResponse<T> = {
            success: true,
            data,
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
