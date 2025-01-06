import {
  Injectable,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Observable } from 'rxjs';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const request = context.switchToHttp().getRequest();

    // Check if authorization header exists
    const authHeader = request.headers.authorization;
    if (!authHeader) {
      throw new UnauthorizedException('No authorization token provided');
    }

    // Validate token format
    const [bearer, token] = authHeader.split(' ');
    if (bearer !== 'Bearer' || !token) {
      throw new UnauthorizedException('Invalid token format');
    }

    // Check token expiration from JWT payload
    try {
      const payload = JSON.parse(
        Buffer.from(token.split('.')[1], 'base64').toString(),
      );
      if (payload.exp && Date.now() >= payload.exp * 1000) {
        throw new UnauthorizedException('Token has expired');
      }
    } catch (error) {
      throw new UnauthorizedException('Invalid token format');
    }

    // Proceed with Passport authentication
    return super.canActivate(context);
  }

  handleRequest(err: any, user: any, info: any) {
    // Handle specific JWT validation errors
    if (info instanceof Error) {
      switch (info.message) {
        case 'No auth token':
          throw new UnauthorizedException('No authentication token provided');
        case 'jwt expired':
          throw new UnauthorizedException('Authentication token has expired');
        case 'invalid signature':
          throw new UnauthorizedException('Invalid token signature');
        case 'jwt malformed':
          throw new UnauthorizedException('Malformed authentication token');
        default:
          throw new UnauthorizedException('Authentication failed');
      }
    }

    // Handle other errors
    if (err) {
      throw err;
    }

    // Check if user exists
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    // Add user role validation if needed
    if (!user.isActive) {
      throw new UnauthorizedException('User account is inactive');
    }

    return user;
  }
}
