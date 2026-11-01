// Java-memory-visualizer 의 실행 기록(snapshot doc) 중 작업 공간이 읽는 부분.
// 나머지 단계 데이터는 해석하지 않고 메모리 패널의 TraceView 로 그대로 넘긴다.

export interface MemoryDocStep {
  stdout?: string;
  exception_msg?: string;
}

export interface MemoryDoc {
  language: "c" | "cpp";
  status: "ok" | "compile_error" | "uncaught_exception" | "step_limit" | string;
  message?: string;
  problems?: { line: number; message: string; error?: boolean }[];
  trace?: MemoryDocStep[];
  traceStride?: number;
  traceTotalSteps?: number;
}
