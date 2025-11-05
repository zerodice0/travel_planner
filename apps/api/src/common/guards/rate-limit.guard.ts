import { Injectable, CanActivate, ExecutionContext, HttpException, HttpStatus } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class RateLimitGuard implements CanActivate {
  constructor(private prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const userId = request.user?.id;

    if (!userId) {
      return true;  // Let auth guard handle this
    }

    // Get today's date range (UTC)
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);

    // Count places created today
    const count = await this.prisma.userPlace.count({
      where: {
        userId,
        createdAt: {
          gte: today,
        },
      },
    });

    // Determine limit based on user status
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    const limit = user?.emailVerified ? 10 : 5;

    if (count >= limit) {
      throw new HttpException(
        {
          statusCode: HttpStatus.TOO_MANY_REQUESTS,
          message: `Daily place creation limit exceeded (${count}/${limit} used)`,
          limit,
          used: count,
          resetsAt: new Date(today.getTime() + 24 * 60 * 60 * 1000),
          error: 'Too Many Requests',
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    return true;
  }
}
