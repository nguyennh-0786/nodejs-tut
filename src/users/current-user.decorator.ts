import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';
import { UserSerializer } from './serializers/user.serializer';

export const CurrentUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest<Request>();
    if (!request.user) {
      return null;
    }
    return new UserSerializer(request.user, { type: 'BASIC_INFO' }).serialize();
  },
);
