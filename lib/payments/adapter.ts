/** Providers retain their own request and verification contracts. */
export interface PaymentAdapter<Request, Verification, Receipt> {
  start(
    input: Request,
  ): Promise<{ authority: string; url: string; raw: Record<string, unknown> }>;
  verify(input: Verification): Promise<Receipt>;
}
