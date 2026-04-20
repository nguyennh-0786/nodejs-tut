import { UserSerializer } from 'src/users/serializers/user.serializer';

export type ArticleSerializerType = 'DETAIL';

const ARTICLE_FIELDS: Record<ArticleSerializerType, string[]> = {
  DETAIL: [
    'slug',
    'title',
    'description',
    'body',
    'tagList',
    'createdAt',
    'updatedAt',
    'favorited',
    'favoritesCount',
    'author',
  ],
};

export class ArticleSerializer {
  constructor(
    private readonly data: Record<string, any>,
    private readonly options: { type: ArticleSerializerType },
  ) {}

  private get allowedFields(): string[] {
    return ARTICLE_FIELDS[this.options.type] ?? [];
  }

  /** Converts Tag[] to string[] */
  tagList(): string[] {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const tags = this.data['tagList'];
    if (!Array.isArray(tags)) return [];
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-member-access
    return tags.map((t) => (typeof t === 'string' ? t : t['name']));
  }

  /** Serializes author using UserSerializer with following flag from data */
  author(): Record<string, unknown> | null {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const raw = this.data['author'];
    if (!raw) return null;
    const following = Boolean(this.data['following'] ?? false);
    return new UserSerializer(
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      { ...raw, following },
      { type: 'PROFILE' },
    ).serialize();
  }

  serialize(): Record<string, unknown> {
    return this.allowedFields.reduce(
      (acc, field) => {
        const method = (this as Record<string, unknown>)[field];
        if (typeof method === 'function') {
          acc[field] = (method as (this: this) => unknown).call(this);
        } else if (this.data[field] !== undefined) {
          acc[field] = this.data[field];
        }
        return acc;
      },
      {} as Record<string, unknown>,
    );
  }
}
