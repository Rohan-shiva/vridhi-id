import { describe, it, expect } from 'vitest';
import { SUPPORTED_LANGUAGES } from '../languages';
import hi from '../locales/hi.json';
import kn from '../locales/kn.json';
import en from '../locales/en.json';
import ta from '../locales/ta.json';
import te from '../locales/te.json';
import bn from '../locales/bn.json';
import mr from '../locales/mr.json';
import gu from '../locales/gu.json';
import pa from '../locales/pa.json';
import ml from '../locales/ml.json';
import or from '../locales/or.json';

const localeMap: Record<string, any> = {
  hi, kn, en, ta, te, bn, mr, gu, pa, ml, or
};

function getNestedKeys(obj: any, prefix = ''): string[] {
  return Object.keys(obj).reduce((res: string[], el: string) => {
    if (Array.isArray(obj[el])) {
      return res;
    } else if (typeof obj[el] === 'object' && obj[el] !== null) {
      return [...res, ...getNestedKeys(obj[el], prefix + el + '.')];
    }
    return [...res, prefix + el];
  }, []);
}

describe('Multilingual Translation Integrity Tests', () => {
  const masterKeys = getNestedKeys(hi);

  it('All 11 Indian target languages should be defined in SUPPORTED_LANGUAGES', () => {
    expect(SUPPORTED_LANGUAGES.length).toBe(11);
    const codes = SUPPORTED_LANGUAGES.map(l => l.code);
    expect(codes).toContain('hi');
    expect(codes).toContain('kn');
    expect(codes).toContain('ta');
    expect(codes).toContain('te');
    expect(codes).toContain('bn');
    expect(codes).toContain('mr');
    expect(codes).toContain('gu');
    expect(codes).toContain('pa');
    expect(codes).toContain('ml');
    expect(codes).toContain('or');
    expect(codes).toContain('en');
  });

  SUPPORTED_LANGUAGES.forEach(lang => {
    it(`Language [${lang.code}] (${lang.nativeName}) must have 100% key parity with Hindi master`, () => {
      const targetLocale = localeMap[lang.code];
      expect(targetLocale).toBeDefined();

      const targetKeys = getNestedKeys(targetLocale);
      const missingKeys = masterKeys.filter(k => !targetKeys.includes(k));

      if (missingKeys.length > 0) {
        console.error(`Missing keys in ${lang.code}:`, missingKeys);
      }
      expect(missingKeys).toEqual([]);
    });

    it(`Language [${lang.code}] must have valid speech recognition locale`, () => {
      expect(lang.speechLocale).toMatch(/^[a-z]{2}-IN$/);
    });
  });
});
