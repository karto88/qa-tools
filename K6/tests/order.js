import { authenticate } from '../lib/auth.js';
import { encryptAES, createOrder, extractEncrypted } from '../lib/order.js';

// ════════════════════ აქ შეცვალე რიცხვები ════════════════════
//
//  RATE ცალი order ყოველ 1 წუთში, DURATION ხნის განმავლობაში.
//  ჯამში = RATE × (წუთების რაოდენობა).  მაგ. 100 × 5 = 500 order.
//
const RATE = 500;          // რამდენი order 1 წუთში
const DURATION = '1m';     // რამდენ ხანს (მაგ. '30s', '1m', '5m')
//
// ═══════════════════════════════════════════════════════════

export const options = {
  scenarios: {
    orders: {
      executor: 'constant-arrival-rate',
      rate: RATE,             // RATE order ...
      timeUnit: '1m',         // ... ყოველ 1 წუთში
      duration: DURATION,     // სულ რამდენ ხანს გაგრძელდეს
      preAllocatedVUs: 80,    //  "იუზერი" rate-ის დასაჭერად
      maxVUs: 150,             // , თუ სერვერი ნელდება
    },
  },
};

// გაეშვება ერთხელ ტესტამდე — token აქ მოდის, გასატესტი ტვირთის გარეთ.
export function setup() {
  const token = authenticate();
  return { token };
}

// თითო იტერაცია = 1 order (encryptAES -> createOrder). token setup()-იდან მოდის.
export default function (data) {
  const enc = extractEncrypted(encryptAES(data.token));
  createOrder(data.token, enc);
}
