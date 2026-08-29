export interface UserProps {
  id: string;
  name?: string | null;
  email?: string | null;
  emailVerified?: Date | null;
  image?: string | null;
  passwordHash?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export class User {
  constructor(public readonly props: UserProps) {}

  get id(): string {
    return this.props.id;
  }

  get name(): string | null | undefined {
    return this.props.name;
  }

  get email(): string | null | undefined {
    return this.props.email;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  toJSON() {
    return {
      id: this.props.id,
      name: this.props.name,
      email: this.props.email,
      image: this.props.image,
      createdAt: this.props.createdAt,
    };
  }
}
