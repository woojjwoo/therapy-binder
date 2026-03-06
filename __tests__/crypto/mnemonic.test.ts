import {
  generateMnemonic,
  mnemonicToWords,
  validateMnemonic,
  pickChallengeIndices,
  verifyChallengeAnswers,
  WORD_COUNT,
} from '../../src/crypto/mnemonic';

describe('BIP39 Mnemonic', () => {
  let mnemonic: string;
  let words: string[];

  beforeAll(() => {
    mnemonic = generateMnemonic();
    words = mnemonicToWords(mnemonic);
  });

  it('generates a 24-word mnemonic', () => {
    expect(words).toHaveLength(24);
  });

  it('passes BIP39 checksum validation', () => {
    expect(validateMnemonic(mnemonic)).toBe(true);
  });

  it('rejects an invalid mnemonic', () => {
    expect(validateMnemonic('not a valid mnemonic phrase at all ever nope')).toBe(false);
  });

  it('picks exactly 3 unique challenge indices', () => {
    const indices = pickChallengeIndices();
    expect(indices).toHaveLength(3);
    expect(new Set(indices).size).toBe(3);
  });

  it('challenge indices are always sorted ascending', () => {
    for (let i = 0; i < 20; i++) {
      const indices = pickChallengeIndices();
      expect(indices[0]).toBeLessThan(indices[1]);
      expect(indices[1]).toBeLessThan(indices[2]);
    }
  });

  it('challenge indices stay within bounds (not first or last word)', () => {
    for (let i = 0; i < 20; i++) {
      const indices = pickChallengeIndices();
      indices.forEach((idx) => {
        expect(idx).toBeGreaterThan(0);
        expect(idx).toBeLessThan(WORD_COUNT - 1);
      });
    }
  });

  it('verifies correct challenge answers', () => {
    const indices = [3, 11, 19];
    const answers = indices.map((i) => words[i]);
    expect(verifyChallengeAnswers(mnemonic, indices, answers)).toBe(true);
  });

  it('rejects wrong challenge answers', () => {
    const indices = [3, 11, 19];
    const wrong = ['abandon', 'ability', 'able'];
    expect(verifyChallengeAnswers(mnemonic, indices, wrong)).toBe(false);
  });

  it('rejects partially correct answers', () => {
    const indices = [3, 11, 19];
    const partial = [words[3], 'wrong', words[19]];
    expect(verifyChallengeAnswers(mnemonic, indices, partial)).toBe(false);
  });
});
