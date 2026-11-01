// Checked printf adapter. Pointer text is supplied by the explicitly virtual C model.
export function createCPrintf({rt,formatPrintf,addressOf,read,fail}) {
  function string(value) {
    read(value);
    const array=value?.v?.target;
    if(!Array.isArray(array)||!rt.isCharType(array[0]?.t || value.t.eleType))fail('printf 문자열에는 char*가 필요합니다.');
    let result='';
    for(let i=value.v.position||0;i<array.length;i++) {
      read(array[i]);
      if(array[i].v===0)return result;
      result+=String.fromCharCode(array[i].v);
      if(result.length>16000)fail('printf 문자열 길이 제한을 초과했습니다.');
    }
    fail('printf 문자열이 NUL로 끝나지 않습니다.');
  }
  return function printf(rt,_this,format,...params) {
    const source=string(format);
    let cursor=0,output='';
    const take=()=>{if(cursor>=params.length)fail('printf 인수가 부족합니다.');const value=params[cursor++];read(value);return value;};
    const integer=()=>{const value=take();if(value.t.type!=='primitive'||!Number.isInteger(value.v))fail('printf 폭·정밀도에는 정수가 필요합니다.');return value.v;};
    const pattern=/^%([-+ #0]*)(\d+|\*)?(?:\.(\d*|\*))?(hh|ll|h|l|j|z|t|L)?([diuoxXfFeEgGcspn%])/;
    for(let i=0;i<source.length;) {
      if(source[i]!=='%'){output+=source[i++];continue;}
      const token=source.slice(i).match(pattern);
      if(!token)fail('지원하지 않는 printf 형식 지정자입니다.');
      i+=token[0].length;
      let [,flags,width,precision,length,conversion]=token;
      if(conversion==='%'){if(token[0]!=='%%')fail('퍼센트는 %%로 출력하세요.');output+='%';continue;}
      if(conversion==='n')fail('printf %n은 지원하지 않습니다.');
      if(width==='*'){width=integer();if(width<0){flags+='-';width=-width;}}
      if(precision==='*'){precision=integer();if(precision<0)precision=undefined;}
      if(Number(width)>1000||Number(precision)>1000)fail('printf 폭·정밀도는 1000까지 지원합니다.');
      const value=take();
      let encoded;
      if(conversion==='p') {
        if(length||precision!==undefined)fail('%p의 길이·정밀도 지정은 지원하지 않습니다.');
        if(value.t.type!=='pointer')fail('%p에는 포인터가 필요합니다. (void*) 캐스트를 사용하세요.');
        encoded=addressOf(value); conversion='s';
      } else if(conversion==='s') {
        if(length)fail('wide 문자열 printf는 지원하지 않습니다.');
        encoded=string(value);
      } else {
        if(value.t.type==='pointer')fail(`${token[0]}는 포인터 출력 형식이 아닙니다. %p와 (void*) 캐스트를 사용하세요.`);
        if(value.t.type!=='primitive'||typeof value.v!=='number'||!Number.isFinite(value.v))fail('printf에 올바른 숫자 값이 필요합니다.');
        if(conversion==='c') {
          if(length)fail('wide 문자 printf는 지원하지 않습니다.');
          encoded=String.fromCharCode(value.v&255);
        } else {
          const integral='diuoxX'.includes(conversion);
          if(length==='L'&&integral)fail('정수에는 L 길이 지정자를 사용할 수 없습니다.');
          encoded=integral?Math.trunc(value.v):value.v;
          if(integral) {
            const bits=length==='hh'?8:length==='h'?16:['ll','j'].includes(length)?64:32;
            if(!Number.isSafeInteger(encoded))fail('정확히 표현할 수 없는 큰 정수 printf는 지원하지 않습니다.');
            const signed='di'.includes(conversion);
            encoded=Number(signed?BigInt.asIntN(bits,BigInt(encoded)):BigInt.asUintN(bits,BigInt(encoded)));
            if(!Number.isSafeInteger(encoded))fail('정확히 표현할 수 없는 큰 정수 printf는 지원하지 않습니다.');
          }
        }
      }
      const control='%'+flags+(width??'')+(precision===undefined?'':'.'+precision)+conversion;
      output+=formatPrintf(control,encoded);
      if(output.length>16000)fail('출력 16,000자 제한');
    }
    rt.config.stdio.write(output);
    return rt.val(rt.intTypeLiteral,new TextEncoder().encode(output).length);
  };
}
