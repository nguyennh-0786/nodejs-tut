export class BaseResponse<T> {
  constructor(
    public readonly code: number,
    public readonly message: string,
    public readonly data: T,
  ) {}
}
