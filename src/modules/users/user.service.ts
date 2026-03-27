import { prisma } from '../../config/database';
import { CreateUserInput, UpdateUserInput } from '../../schemas/user.schema';

export class UserService {
  async getAllUsers() {
    return await prisma.user.findMany();
  }

  async getUserById(id: string) {
    return await prisma.user.findUnique({
      where: { id },
    });
  }

  async getUserByEmail(email: string) {
    return await prisma.user.findUnique({
      where: { email },
    });
  }

  async createUser(data: CreateUserInput) {
    return await prisma.user.create({
      data,
    });
  }

  async updateUser(id: string, data: UpdateUserInput) {
    return await prisma.user.update({
      where: { id },
      data,
    });
  }

  async deleteUser(id: string) {
    return await prisma.user.delete({
      where: { id },
    });
  }

  async getPurchases(userId: string) {
    return prisma.paymentEvent.findMany({
      where: { userId, processedAt: { not: null } },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        provider: true,
        eventType: true,
        createdAt: true,
      },
    });
  }

  async getActiveSubscription(userId: string) {
    return prisma.subscription.findFirst({
      where: {
        userId,
        status: 'ACTIVE',
      },
      orderBy: { updatedAt: 'desc' },
    });
  }
}
