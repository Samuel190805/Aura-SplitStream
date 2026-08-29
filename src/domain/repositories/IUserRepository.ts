import { User, UserProps } from "../entities/User";

export interface IUserRepository {
  findById(id: string): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  create(props: Omit<UserProps, "createdAt" | "updatedAt">): Promise<User>;
  update(id: string, props: Partial<UserProps>): Promise<User>;
}
