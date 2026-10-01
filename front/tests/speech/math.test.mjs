import { test } from 'node:test';
import assert from 'node:assert/strict';
import { pronunciationText as speak } from '../../src/lib/business/vendor/topcit-speech/speech-pronunciation.mjs';
const cases = [
  ['<', '작다'], ['=', '이퀄'], ['√', '루트'],
  ['logn, n, nlogn, n², n³, 2ⁿ', '로그엔, 엔, 엔로그엔, 엔제곱, 엔세제곱, 이엔제곱'],
  ['O(n), O(N), O(1), O(log(n)), O(n log n)', '빅오 엔, 빅오 엔, 빅오 일, 빅오 로그엔, 빅오 엔로그엔'],
  ['O(log₂n)', '빅오 밑이 이인 로그 엔'],
  ['n^1.5', '엔의 일 점 오제곱'], ['2^24', '이의 이십사제곱'], ['10⁻³', '십의 마이너스 삼제곱'],
  ['x² + y³', '엑스의 이제곱 더하기 와이의 삼제곱'], ['√n', '루트 엔'], ['√ 표시를 제거한다', '체크 표시를 제거한다'],
  ['n!과 5!', '엔 팩토리얼과 오 팩토리얼'], ['1/2, 3/4, ½', '이분의 일, 사분의 삼, 이분의 일'],
  ['x ≤ 3', '엑스 작거나 같다 3'], ['x>=3', '엑스 크거나 같다 3'], ['x != y', '엑스 같지 않다 와이'],
  ['A ∩ B', '에이 교집합 비'], ['A ∪ B', '에이 합집합 비'], ['x ∈ A', '엑스 원소이다 에이'],
  ['σ, π, θ, λ', ' 시그마 , 파이 , 세타 , 람다 '],
  ['99.9%', '구십구 점 구 퍼센트'], ['2ns + 50ns', '이 나노초 더하기 오십 나노초'],
  ['1GHz, 100Mbps, 2MB/s', '일 기가헤르츠, 백 메가비피에스, 초당 이 메가바이트'],
  ['1e-3', '일 곱하기 십의 마이너스 삼제곱'], ['1~100', '1에서 100까지'],
  ['30 ÷ 100 × 100 = 30%', '30 나누기 100 곱하기 100 이퀄 삼십 퍼센트'],
  ['EV/PV, MTBF, MTTR', '이브이 나누기 피브이, 엠티비에프, 엠티티알'],
  ['n₁', '엔 아래첨자 일'], ['&#x20;logn&#32;', ' 로그엔 '],
];
for (const [input, expected] of cases) test(`math reading: ${input}`, () => assert.equal(speak(input), expected));
for (const value of ['2026-09-18', '2026/09/18', '09/18/2026', '192.168.0.0/24', 'v2.5', '3.2.1', '10:30', 'SHA-256', 'n_count', 'R_001', 'n2', 'lognormal', 'https://example.com/n^2?a=1', 'C:\\temp\\v2.5', 'TCP/IP']) {
  test(`preserve non-math: ${value}`, () => assert.equal(speak(value), value === 'TCP/IP' ? '티씨피/아이피' : value === 'SHA-256' ? '에스에이치에이-256' : value));
}
test('code notation is not interpreted as mathematical exponentiation', () => assert.equal(speak('코드 `n ^ 2`, `x % 2`, `a // b`'), '코드 n ^ 2, x % 2, a // b'));
test('percentage lists are not remainder expressions', () => assert.equal(speak('10%, 20%'), '십 퍼센트, 이십 퍼센트'));
