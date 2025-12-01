import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";

@Injectable()
export class AuthGuard implements CanActivate {
    constructor(private jwtService: JwtService) {}

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const request = context.switchToHttp().getRequest();
        const authorization = request.headers.authorization;

        // Check for Bearer token
        const token = authorization?.split(' ')[1];
        if (!token) {
            throw new UnauthorizedException('Missing token');
        }

        try {
            const tokenPayload = await this.jwtService.verifyAsync(token);
            console.log(tokenPayload)
            request.user = {
                userId: tokenPayload.sub,
                name: tokenPayload.name,
                email:tokenPayload.email
            };
            return true;
        } catch (error) {
            throw new UnauthorizedException('Invalid token');
        }
    }
}
