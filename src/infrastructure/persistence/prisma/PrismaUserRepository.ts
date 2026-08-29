import { prisma } from "@/lib/db";
import { IUserRepository } from "@/domain/repositories/IUserRepository";
import { User, UserProps } from "@/domain/entities/User";

export class PrismaUserRepository implements IUserRepository {
  async findById(id: string): Promise<User | null> {
    const raw = await prisma.user.findUnique({ where: { id } });
    if (!raw) return null;
    return new User(raw);
  }

  async findByEmail(email: string): Promise<User | null> {
    const raw = await prisma.user.findUnique({ where: { email } });
    if (!raw) return null;
    return new User(raw);
  }

  async create(props: Omit<UserProps, "createdAt" | "updatedAt">): Promise<User> {
    const raw = await prisma.user.create({
      data: {
        id: props.id,
        name: props.name,
        email: props.email,
        image: props.image,
        passwordHash: props.passwordHash,
      },
    });
    return new User(raw);
  }

  async update(id: string, props: Partial<UserProps>): Promise<User> {
    const raw = await prisma.user.update({
      where: { id },
      data: {
        name: props.name,
        email: props.email,
        image: props.image,
        passwordHash: props.passwordHash,
      },
    });
    return new User(raw);
  }
}
