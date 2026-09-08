import http from 'k6/http';
import { check } from 'k6';
import { uuidv4 } from 'https://jslib.k6.io/k6-utils/1.4.0/index.js';
import {
  PAYMENT_BASE,
  ECOMMERCE_BASE,
  PUBLIC_KEY,
  INTEGRATOR_ID,
  RECEIVER_ID,
  RECEIVER_TYPE,
  OPEN_BANKING_PROVIDER,
  AMOUNT,
} from '../config/order.js';

function authHeaders(token) {
  return {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    Authorization: `Bearer ${token}`,
  };
}

// ნაბიჯი 1 — POST /test/encryptAES
// შიფრავს order-ის payload-ს public key-ით.
export function encryptAES(token) {
  const payload = {
    data: {
      amount: AMOUNT,
      receiverId: RECEIVER_ID,
      receiverType: RECEIVER_TYPE,
      integratorId: INTEGRATOR_ID,
      integratorOrderId: uuidv4(),
      openBankingLinkProvider: OPEN_BANKING_PROVIDER,
      orderProperties: {
        INVOICE_NUMBER_LABEL: { value: 'Invoice', isEditable: false },
        DESCRIPTION: { value: 'Desc', isEditable: false },
      },
    },
    publicKey: PUBLIC_KEY,
  };

  const res = http.post(`${PAYMENT_BASE}/test/encryptAES`, JSON.stringify(payload), {
    headers: authHeaders(token),
    tags: { name: 'encryptAES' },
  });

  check(res, {
    'encryptAES: status 2xx': (r) => r.status >= 200 && r.status < 300,
  });

  return res;
}

// ნაბიჯი 2 — POST /integrator/order
// აგზავნის ნაბიჯი 1-ის დაშიფრულ payload-ს და ქმნის order-ს.
export function createOrder(token, enc) {
  const payload = {
    identifier: INTEGRATOR_ID,
    encryptedData: enc.encryptedData,
    aes: enc.aes,
    encryptedKeys: enc.encryptedKeys,
  };

  const res = http.post(`${ECOMMERCE_BASE}/integrator/order`, JSON.stringify(payload), {
    headers: authHeaders(token),
    tags: { name: 'integrator-order' },
  });

  check(res, {
    'createOrder: status 2xx': (r) => r.status >= 200 && r.status < 300,
  });

  return res;
}

// დამხმარე — ამოიღებს დაშიფრულ ველებს encryptAES-ის response-იდან.
export function extractEncrypted(res) {
  try {
    const v = res.json('value');
    return { encryptedData: v.encryptedData, aes: v.aes, encryptedKeys: v.encryptedKeys };
  } catch (_) {
    return null;
  }
}
