export class BaseResponse<T> {
  constructor(
    public readonly message: string,
    public readonly data: T,
  ) {}
}
