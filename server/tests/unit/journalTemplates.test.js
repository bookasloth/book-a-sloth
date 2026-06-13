const {
  orderPaymentEntry, subscriptionPaymentEntry, bankTransferEntry, reversalEntry,
} = require('../../services/ledger/journalTemplates');
const { ACCOUNTS } = require('../../lib/ledgerAccounts');

const sum = (lines, side) => Math.round(lines.reduce((s, l) => s + (l[side] || 0), 0) * 100) / 100;
const lineFor = (lines, code, side) => lines.find((l) => l.account_code === code && l[side] > 0);

describe('orderPaymentEntry', () => {
  // PRD §3.1 fixture: Free plan ₹1000, fee ₹10, fee GST ₹1.80,
  // commission ₹50, commission GST ₹9, razorpay 20 + 3.60
  const snapshot = {
    booking_id: 'b1', host_id: 'v1',
    service_price: 1000, platform_fee_amount: 10, platform_fee_gst: 1.8,
    commission_applied: 50, commission_gst: 9,
    razorpay_fee_actual: 20, razorpay_tax_actual: 3.6,
    vendor_amount: 917.4, customer_total: 1011.8,
  };

  test('balances and carries PRD amounts (free plan)', () => {
    const { lines, description } = orderPaymentEntry(snapshot);
    expect(sum(lines, 'debit')).toBe(sum(lines, 'credit'));
    expect(lineFor(lines, ACCOUNTS.RAZORPAY_RECEIVABLE, 'debit').debit).toBe(1011.8);
    expect(lineFor(lines, ACCOUNTS.RAZORPAY_RECEIVABLE, 'credit').credit).toBe(23.6); // gateway relief
    expect(lineFor(lines, ACCOUNTS.VENDOR_PAYABLES, 'credit').credit).toBe(917.4);
    expect(lineFor(lines, ACCOUNTS.PLATFORM_FEE_REVENUE, 'credit').credit).toBe(10);
    expect(lineFor(lines, ACCOUNTS.GST_PAYABLE, 'credit').credit).toBe(10.8); // 1.80 + 9
    expect(lineFor(lines, ACCOUNTS.COMMISSION_REVENUE, 'credit').credit).toBe(50);
    expect(lineFor(lines, ACCOUNTS.RZP_CHARGES_ORDERS, 'debit').debit).toBe(23.6);
    expect(lineFor(lines, ACCOUNTS.RZP_CHARGES_ORDERS, 'credit').credit).toBe(23.6); // vendor-borne, nets 0
    expect(description).toContain('b1');
    // every line tagged for the vendor ledger
    expect(lines.every((l) => l.order_item_id === 'b1')).toBe(true);
    expect(lines.every((l) => l.vendor_id === 'v1')).toBe(true);
  });

  test('paid plan omits commission lines', () => {
    const { lines } = orderPaymentEntry({ ...snapshot, commission_applied: 0, commission_gst: 0, vendor_amount: 976.4 });
    expect(sum(lines, 'debit')).toBe(sum(lines, 'credit'));
    expect(lines.find((l) => l.account_code === ACCOUNTS.COMMISSION_REVENUE)).toBeUndefined();
    expect(lineFor(lines, ACCOUNTS.VENDOR_PAYABLES, 'credit').credit).toBe(976.4);
    expect(lineFor(lines, ACCOUNTS.GST_PAYABLE, 'credit').credit).toBe(1.8);
  });

  test('zero gateway fee (fee unknown at capture) omits charge lines and stays balanced', () => {
    const { lines } = orderPaymentEntry({ ...snapshot, razorpay_fee_actual: 0, razorpay_tax_actual: 0, vendor_amount: 941 });
    expect(sum(lines, 'debit')).toBe(sum(lines, 'credit'));
    expect(lines.find((l) => l.account_code === ACCOUNTS.RZP_CHARGES_ORDERS)).toBeUndefined();
  });
});

describe('subscriptionPaymentEntry', () => {
  test('PRD §5.2/§11.3: ₹999 + GST, platform-borne gateway fee', () => {
    const { lines } = subscriptionPaymentEntry({
      id: 's1', vendor_id: 'v1', plan_price: 999, gst_amount: 179.82,
      total_charged: 1178.82, razorpay_fee: 23.58, razorpay_tax: 4.24,
    });
    expect(sum(lines, 'debit')).toBe(sum(lines, 'credit'));
    expect(lineFor(lines, ACCOUNTS.RAZORPAY_RECEIVABLE, 'debit').debit).toBe(1178.82);
    expect(lineFor(lines, ACCOUNTS.SUBSCRIPTION_REVENUE, 'credit').credit).toBe(999);
    expect(lineFor(lines, ACCOUNTS.GST_PAYABLE, 'credit').credit).toBe(179.82);
    expect(lineFor(lines, ACCOUNTS.RZP_CHARGES_SUBS, 'debit').debit).toBe(27.82); // platform expense stays
    expect(lineFor(lines, ACCOUNTS.RAZORPAY_RECEIVABLE, 'credit').credit).toBe(27.82);
    expect(lines.every((l) => l.subscription_payment_id === 's1')).toBe(true);
  });
});

describe('bankTransferEntry', () => {
  test('DR Bank / CR Receivable', () => {
    const { lines } = bankTransferEntry({ amount: 5000, reference: 'setl_x' });
    expect(lines).toHaveLength(2);
    expect(lineFor(lines, ACCOUNTS.BANK, 'debit').debit).toBe(5000);
    expect(lineFor(lines, ACCOUNTS.RAZORPAY_RECEIVABLE, 'credit').credit).toBe(5000);
  });
});

describe('reversalEntry', () => {
  test('swaps debits and credits of original lines', () => {
    const original = [
      { account_code: ACCOUNTS.BANK, debit: 100, credit: 0 },
      { account_code: ACCOUNTS.RAZORPAY_RECEIVABLE, debit: 0, credit: 100 },
    ];
    const { lines } = reversalEntry({ journal_number: 'JNL-2026-000001', lines: original });
    expect(lineFor(lines, ACCOUNTS.BANK, 'credit').credit).toBe(100);
    expect(lineFor(lines, ACCOUNTS.RAZORPAY_RECEIVABLE, 'debit').debit).toBe(100);
  });
});
