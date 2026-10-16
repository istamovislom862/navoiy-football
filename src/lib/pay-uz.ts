export class PayUz {
  config: any;
  successCallback?: (transaction: any) => Promise<void>;
  cancelCallback?: (transaction: any) => Promise<void>;

  constructor(config: any) {
    this.config = config;
  }

  onSuccess(callback: (transaction: any) => Promise<void>) {
    this.successCallback = callback;
  }

  onCancel(callback: (transaction: any) => Promise<void>) {
    this.cancelCallback = callback;
  }

  get payme() {
    return {
      createInitializationUrl: ({ amount, orderId, returnUrl }: any) => {
        return `https://checkout.paycom.uz?amount=${amount}&account=${orderId}&return_url=${encodeURIComponent(returnUrl)}`;
      },
      handleWebhook: async (body: any) => {
        // Mock webhook handler for Payme
        if (body.method === 'CheckPerformTransaction' || body.method === 'PerformTransaction') {
          if (body.method === 'PerformTransaction' && this.successCallback) {
            await this.successCallback({
              orderId: body.params.account.order_id || body.params.account,
              transactionId: body.params.id,
              amount: body.params.amount
            });
          }
          return { result: { state: 1, transaction: "mock_txn_id", perform_time: Date.now() } };
        }
        return { error: "Unsupported method" };
      }
    };
  }

  get click() {
    return {
      createInitializationUrl: ({ amount, orderId, returnUrl }: any) => {
        return `https://my.click.uz/services/pay?service_id=${this.config.click.serviceId}&merchant_id=${this.config.click.merchantId}&amount=${amount}&transaction_param=${orderId}&return_url=${encodeURIComponent(returnUrl)}`;
      },
      handleWebhook: async (body: any) => {
        // Mock webhook handler for Click
        if (body.action === '1' && this.successCallback) { // 1 means confirmed
          await this.successCallback({
            orderId: body.merchant_trans_id,
            transactionId: body.click_trans_id,
            amount: body.amount
          });
        }
        return { error: 0, error_note: "Success" };
      }
    };
  }
}
