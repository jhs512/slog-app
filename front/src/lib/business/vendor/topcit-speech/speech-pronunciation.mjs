// Exact, case-sensitive technical terms found in the learning sources.
// Keep display text and sentence offsets intact; apply only to utterance text.
import { mathSpeechText } from './speech-math.mjs';
export const pronunciations = Object.freeze({
  서버:'써버', Server:'써버', server:'써버', SERVER:'써버',
  Client:'클라이언트', client:'클라이언트', CLIENT:'클라이언트',
  Browser:'브라우저', browser:'브라우저', BROWSER:'브라우저',
  Cache:'캐시', cache:'캐시', CACHE:'캐시',
  Router:'라우터', router:'라우터', ROUTER:'라우터',
  IT:'아이티', ICT:'아이씨티', AI:'에이아이', IoT:'아이오티',
  API:'에이피아이', UI:'유아이', UX:'유엑스', IDE:'아이디이',
  CPU:'씨피유', GPU:'지피유', OS:'오에스', SW:'에스더블유', HW:'에이치더블유',
  RAM:'램', ROM:'롬', HDD:'에이치디디', SSD:'에스에스디', USB:'유에스비',
  DB:'디비', DBMS:'디비엠에스', RDB:'알디비', RDBMS:'알디비엠에스',
  SQL:'에스큐엘', NoSQL:'노에스큐엘', SQLite:'에스큐엘라이트',
  NULL:'널', SELECT:'셀렉트', FROM:'프롬', WHERE:'웨어',
  GROUP:'그룹', BY:'바이', HAVING:'해빙', ORDER:'오더',
  COUNT:'카운트', SUM:'섬', AVG:'에이브이지', MAX:'맥스', MIN:'민',
  DISTINCT:'디스팅트', UNKNOWN:'언노운',
  INSERT:'인서트', UPDATE:'업데이트', DELETE:'딜리트', JOIN:'조인',
  COMMIT:'커밋', ROLLBACK:'롤백',
  DDL:'디디엘', DML:'디엠엘', DCL:'디씨엘', TCL:'티씨엘',
  DBA:'디비에이', ERD:'이알디', ER:'이알', ETL:'이티엘', OLTP:'오엘티피', OLAP:'올랩',
  XML:'엑스엠엘', HTML:'에이치티엠엘', CSS:'씨에스에스', JSON:'제이슨',
  DOM:'돔', DTD:'디티디', UML:'유엠엘', MVC:'엠브이씨', OOP:'오오피',
  XP:'엑스피', TDD:'티디디', CI:'씨아이', CD:'씨디', VCS:'브이씨에스',
  IP:'아이피', IPv4:'아이피 버전 사', IPv6:'아이피 버전 육',
  TCP:'티씨피', UDP:'유디피', HTTP:'에이치티티피', HTTPS:'에이치티티피에스',
  FTP:'에프티피', SMTP:'에스엠티피', SNMP:'에스엔엠피',
  DNS:'디엔에스', DHCP:'디에이치씨피', URL:'유알엘', URI:'유알아이',
  MAC:'맥', LAN:'랜', WAN:'더블유에이엔', VLAN:'브이랜', WLAN:'더블유랜',
  VPN:'브이피엔', NAT:'엔에이티', ARP:'에이알피', ICMP:'아이씨엠피',
  OSI:'오에스아이', CDN:'씨디엔', SDN:'에스디엔', NFV:'엔에프브이',
  SAN:'에스에이엔', NAS:'나스', RAID:'레이드', VM:'브이엠',
  SaaS:'사스', PaaS:'파스', IaaS:'아이아스', QoS:'큐오에스',
  SSL:'에스에스엘', TLS:'티엘에스', SSH:'에스에스에이치',
  AES:'에이이에스', DES:'디이에스', RSA:'알에스에이', SHA:'에스에이치에이',
  PKI:'피케이아이', IDS:'아이디에스', IPS:'아이피에스',
  DDoS:'디도스', DoS:'도스', XSS:'엑스에스에스', CSRF:'씨에스알에프',
  MFA:'엠에프에이', OTP:'오티피', SSO:'에스에스오', ACL:'에이씨엘',
  ISMS:'아이에스엠에스', GDPR:'지디피알', DRM:'디알엠',
  ERP:'이알피', CRM:'씨알엠', SCM:'에스씨엠', PLM:'피엘엠',
  BSC:'비에스씨', KPI:'케이피아이', ROI:'알오아이', BPR:'비피알',
  BPM:'비피엠', ISP:'아이에스피', EA:'이에이', SLA:'에스엘에이',
  SLM:'에스엘엠', ITIL:'아이틸', ITSM:'아이티에스엠',
  PM:'피엠', PMO:'피엠오', WBS:'더블유비에스', RFP:'알에프피',
  RFI:'알에프아이', PERT:'퍼트', CPM:'씨피엠', EVM:'이브이엠',
  CPI:'씨피아이', SPI:'에스피아이', RTO:'알티오', RPO:'알피오',
  EV:'이브이', PV:'피브이', AC:'에이씨', NPV:'엔피브이', TCO:'티씨오',
  MTBF:'엠티비에프', MTTR:'엠티티알', CAPEX:'캐펙스', OPEX:'오펙스',
  ALU:'에이엘유', RISC:'리스크', CISC:'시스크', SIMD:'심디', MIMD:'밈디',
  ACID:'애시드', CRUD:'크루드', MSA:'엠에스에이', REST:'레스트', JWT:'제이더블유티',
  PDCA:'피디씨에이', SWOT:'스왓', BI:'비아이', DW:'디더블유',
  FIFO:'피포', LRU:'엘알유', LFU:'엘에프유', FCFS:'에프씨에프에스',
  SJF:'에스제이에프', HRN:'에이치알엔',
  PDF:'피디에프', ISO:'아이에스오', IEEE:'아이 트리플 이',
  FBI:'에프비아이', VCF:'브이씨에프', TOPCIT:'탑싯',
  Java:'자바', JavaScript:'자바스크립트', Python:'파이썬',
  Engineering:'엔지니어링', engineering:'엔지니어링', ENGINEERING:'엔지니어링',
  'C++':'씨 플러스 플러스',
});

const escape = value => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const terms = Object.keys(pronunciations).sort((a,b)=>b.length-a.length).map(escape).join('|');
// Korean particles may follow a term directly. Never replace parts of English
// words, code identifiers, version numbers or URLs.
const pattern = new RegExp(`https?:\\/\\/\\S+|(?<![A-Za-z0-9_])(${terms})(?![A-Za-z0-9_])`, 'g');
const roman = 'ⅠⅡⅢⅣⅤⅥⅦⅧⅨⅩⅪⅫ';
const nativeOnes = ['', '한', '두', '세', '네', '다섯', '여섯', '일곱', '여덟', '아홉'];
const nativeTens = ['', '열', '스물', '서른', '마흔', '쉰', '예순', '일흔', '여든', '아흔'];
// These spans are identifiers/addresses, not arithmetic. Preserve them verbatim.
const protectedSpans = /(https?:\/\/\S+|`[^`\n]+`|\b\d{4}[-/]\d{1,2}[-/]\d{1,2}\b|\b\d{1,2}\/\d{1,2}\/\d{2,4}\b|\b(?:\d{1,3}\.){3}\d{1,3}(?:\/\d{1,2})?|\b[vV]\d+(?:\.\d+)+|\b\d+(?:\.\d+){2,}|\b\d{1,2}:\d{2}(?::\d{2})?|[A-Za-z]:\\[^\s]+|\b[A-Za-z_][\w]*_[\w]+\b)/g;
function nativeCount(value) {
  const number = Number(value);
  return number === 20 ? '스무' : nativeTens[Math.floor(number / 10)] + nativeOnes[number % 10];
}
export function pronunciationText(text) {
  return text.split(protectedSpans).map((part, index) => index % 2 ? (part.startsWith('`') ? part.slice(1,-1) : part) : mathSpeechText(part).replace(pattern, (match, term) => term ? pronunciations[term] : match)
    .replace(/(?<![A-Za-z0-9_])V(?=\s*(?:모델|Model)(?![A-Za-z]))/g, '브이')
    .replace(/[Ⅰ-Ⅻⅰ-ⅻ]/g, symbol => String(roman.indexOf(symbol.toUpperCase()) + 1))
    .replace(/(?<![A-Za-z0-9_.+\-])([1-9][0-9]?)\s*가지/g, (_, number) => `${nativeCount(number)} 가지`)).join('');
}
