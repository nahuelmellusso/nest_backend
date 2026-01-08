import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import type { Request } from "express";

type JwtPayload = {
  sub: string;
  email: string;
  name: string;
  iat?: number;
  exp?: number;
};
@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private readonly jwtService: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();

    const token = request.cookies?.["access_token"] ?? this.extractTokenFromHeader(request);

    if (!token) {
      throw new UnauthorizedException("Missing auth token");
    }

    try {
      const payload = await this.jwtService.verifyAsync<JwtPayload>(token, {
        secret: process.env.JWT_SECRET,
      });

      (request as any).user = {
        userId: payload.sub,
        email: payload.email,
      };

      return true;
    } catch (e) {
      throw new UnauthorizedException("Invalid or expired token");
    }
  }

  private extractTokenFromHeader(request: Request): string | undefined {
    const authHeader = request.headers.authorization;
    if (!authHeader) return undefined;

    const [type, token] = authHeader.split(" ");
    return type === "Bearer" ? token : undefined;
  }
}
