/** An error with an HTTP status, shown to the user as-is. */
export class PortfolioError extends Error {
  constructor(
    message: string,
    readonly status: number
  ) {
    super(message);
  }
}
