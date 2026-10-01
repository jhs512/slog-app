import {test} from 'node:test';
import assert from 'node:assert/strict';
import {pronunciationText,pronunciations} from '../../src/lib/business/vendor/topcit-speech/speech-pronunciation.mjs';
import {StorySpeech} from '../../src/lib/business/vendor/topcit-speech/speech-engine.mjs';

test('technical terms allow Korean particles and prefer full terms',()=>{
  assert.equal(pronunciationText('Software Engineering, engineering, ENGINEERING'), 'Software 엔지니어링, 엔지니어링, 엔지니어링');
  assert.equal(pronunciationText('EngineeringTool reengineering'), 'EngineeringTool reengineering');
  assert.equal(pronunciationText('IT는 IT비즈니스와 ITSM, API를 다룬다.'),'아이티는 아이티비즈니스와 아이티에스엠, 에이피아이를 다룬다.');
  assert.equal(pronunciationText('TCP/IP, DBMS, NoSQL, SQL문, C++, C#'),'티씨피/아이피, 디비엠에스, 노에스큐엘, 에스큐엘문, 씨 플러스 플러스, C#');
  assert.equal(pronunciationText('CPU와 RAM, IPv6, NULL'),'씨피유와 램, 아이피 버전 육, 널');
});
test('server pronunciation covers particles and compounds without changing identifiers or URLs',()=>{
  assert.equal(pronunciationText('서버는 웹서버와 서버리스, 서버를 연결한다.'), '써버는 웹써버와 써버리스, 써버를 연결한다.');
  assert.equal(pronunciationText('Server와 server, SERVER, Client Browser Cache Router'), '써버와 써버, 써버, 클라이언트 브라우저 캐시 라우터');
  const untouched='ServerError server_name cacheKey https://example.com/서버/Server';
  assert.equal(pronunciationText(untouched), untouched);
});
test('counts before 가지 use native Korean without rewriting other numbers',()=>{
  assert.equal(pronunciationText('1가지, 2가지, 3가지, 4가지, 5 가지'), '한 가지, 두 가지, 세 가지, 네 가지, 다섯 가지');
  assert.equal(pronunciationText('10가지 11가지 20가지 21가지 24가지 99가지'), '열 가지 열한 가지 스무 가지 스물한 가지 스물네 가지 아흔아홉 가지');
  assert.equal(pronunciationText('4장 4.0 4.5가지 104가지 code4가지 -4가지'), '4장 사 점 영 사 점 오가지 104가지 code4가지 마이너스 사가지');
  assert.equal(pronunciationText('https://example.com/4가지'), 'https://example.com/4가지');
});
test('English words, identifiers, URLs and ambiguous ASCII Roman letters stay intact',()=>{
  const text='BIT GITHUB APIClient IT2 IT_rate someIT it is fine https://example.com/IT IV V VI v2.5';
  assert.equal(pronunciationText(text),text);
  assert.equal(pronunciationText('① V 모델, VModel, Ⅳ장, Ⅴ장, ⅻ'),'① 브이 모델, 브이Model, 4장, 5장, 12');
});
test('every dictionary term matches literally without regex side effects',()=>{
  for(const [term,spoken] of Object.entries(pronunciations))assert.equal(pronunciationText(term),spoken,term);
});
test('complexity notation uses requested Korean readings without altering words or URLs',()=>{
  assert.equal(pronunciationText('logn, n, nlogn, n², n³, 2ⁿ'), '로그엔, 엔, 엔로그엔, 엔제곱, 엔세제곱, 이엔제곱');
  assert.equal(pronunciationText('O(log n), O(n log n), n^2과 n^3, 2^n'), '빅오 로그엔, 빅오 엔로그엔, 엔제곱과 엔세제곱, 이엔제곱');
  const unchanged='lognormal nlogname n_count n2 https://example.com/nlogn';
  assert.equal(pronunciationText(unchanged), unchanged);
});
test('speech engine sends pronunciation at 3x without changing source chunks',()=>{
  const chunks=['IT는 API를 쓴다.','V 모델과 Ⅴ장.'],spoken=[];
  const engine=new StorySpeech({getVoices:()=>[{lang:'ko-KR'}],cancel(){},resume(){},speak:u=>spoken.push(u)},class{constructor(text){this.text=text}},chunks,()=>{}, {setTimeout(){},clearTimeout(){}});
  engine.setRate(3);engine.start();
  assert.equal(spoken[0].text,'아이티는 에이피아이를 쓴다.');assert.equal(spoken[0].rate,3);
  spoken[0].onend();assert.equal(spoken[1].text,'브이 모델과 5장.');
  assert.deepEqual(chunks,['IT는 API를 쓴다.','V 모델과 Ⅴ장.']);engine.stop();
});
