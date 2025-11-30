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
import or from './or.json';
import as from './as.json';

export const translations = {
  en,
  hi,
  bn,
  te,
  mr,
  ta,
  gu,
  kn,
  ml,
  pa,
  or,
  as,
};

export type TranslationKey = keyof typeof en;
