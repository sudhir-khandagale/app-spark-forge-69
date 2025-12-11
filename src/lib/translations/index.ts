import en from './en.json';
import hi from './hi.json';
import bn from './bn.json';
import te from './te.json';
import mr from './mr.json';
import ta from './ta.json';
import gu from './gu.json';
import kn from './kn.json';
import ml from './ml.json';
import pa from './pa.json';
import oriya from './or.json';
import assamese from './as.json';

// Use intermediate mapping to avoid reserved keyword issues in all browsers
export const translations: Record<string, Record<string, string>> = {
  en: en as Record<string, string>,
  hi: hi as Record<string, string>,
  bn: bn as Record<string, string>,
  te: te as Record<string, string>,
  mr: mr as Record<string, string>,
  ta: ta as Record<string, string>,
  gu: gu as Record<string, string>,
  kn: kn as Record<string, string>,
  ml: ml as Record<string, string>,
  pa: pa as Record<string, string>,
  or: oriya as Record<string, string>,
  as: assamese as Record<string, string>,
};

export type TranslationKey = keyof typeof en;
