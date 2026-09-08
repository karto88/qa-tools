import http from 'k6/http';
import { check } from 'k6';

export const BASE_URL = 'https://gateway.dev.keepz.me/common-service/api/v1';

const HEADERS = { 'Content-Type': 'application/json', Accept: 'application/json' };

// სატესტო მონაცემები (სტატიკური სატესტო SMS კოდი)
export const CREDS = {
  phoneNumber: '591078180',
  countryCode: '995',
  smsCode: '111111',
};

// ნაბიჯი 1 — POST /auth/send-sms
export function sendSms() {
  const body = JSON.stringify({
    smsType: 'LOGIN',
    phoneNumberDetails: {
      phoneNumber: CREDS.phoneNumber,
      countryCode: CREDS.countryCode,
    },
    otphash: 'string',
  });
  const res = http.post(`${BASE_URL}/auth/send-sms`, body, {
    headers: HEADERS,
    tags: { name: 'send-sms' },
  });
  check(res, { 'send-sms: status 200': (r) => r.status === 200 });
  return res;
}

// ნაბიჯი 2 — POST /auth/verify-sms  -> userSMSId
export function verifySms() {
  const body = JSON.stringify({
    countryCode: CREDS.countryCode,
    phone: CREDS.phoneNumber,
    code: CREDS.smsCode,
  });
  const res = http.post(`${BASE_URL}/auth/verify-sms`, body, {
    headers: HEADERS,
    tags: { name: 'verify-sms' },
  });
  check(res, {
    'verify-sms: status 2xx': (r) => r.status >= 200 && r.status < 300,
    'verify-sms: has userSMSId': (r) => !!safeJson(r, 'value'),
  });
  return safeJson(res, 'value');
}

// ნაბიჯი 3 — POST /auth/login  -> access_token
export function login(userSMSId) {
  const body = JSON.stringify({
    userSMSId,
    deviceToken: 'string',
    mobileOS: 'IOS',
    mobileName: 'string',
    mobileNumber: CREDS.phoneNumber,
    userType: 'BUSINESS',
  });
  const res = http.post(`${BASE_URL}/auth/login`, body, {
    headers: HEADERS,
    tags: { name: 'login' },
  });
  check(res, {
    'login: status 200': (r) => r.status === 200,
    'login: has access_token': (r) => !!safeJson(r, 'value.access_token'),
  });
  return safeJson(res, 'value.access_token');
}

// სრული 3-ნაბიჯიანი ჯაჭვი -> access_token
export function authenticate() {
  sendSms();
  const userSMSId = verifySms();
  return login(userSMSId);
}

function safeJson(res, path) {
  try {
    return res.json(path);
  } catch (_) {
    return null;
  }
}
