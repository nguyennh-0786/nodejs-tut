export type UserSerializerType = 'BASIC_INFO';

const USER_FIELDS: Record<UserSerializerType, string[]> = {
  BASIC_INFO: ['email', 'username', 'bio', 'image'],
};

export class UserSerializer {
  constructor(
    private readonly user: Record<string, any>,
    private readonly options: { type: UserSerializerType },
  ) {}

  private get allowedFields(): string[] {
    return USER_FIELDS[this.options.type] || [];
  }

  serialize(): Record<string, any> {
    return this.allowedFields.reduce(
      (acc, field) => {
        if (this.user[field] !== undefined) {
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          acc[field] = this.user[field];
        }
        return acc;
      },
      {} as Record<string, any>,
    );
  }
}
