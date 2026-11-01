"use client";

import { useTheme } from "next-themes";

import ToastUIEditorViewer from "@/lib/business/components/ToastUIEditorViewer";

const examples = [
  {
    name: "HTML · 화면과 DOM",
    fence: "html run",
    code: '<button onclick="this.textContent = Number(this.textContent) + 1">0</button>',
  },
  {
    name: "JavaScript · 콘솔",
    fence: "js run",
    code: 'console.log("안녕, 런박스!");',
  },
  {
    name: "JavaScript · 메모리",
    fence: "js memory",
    code: "const numbers = [1, 2, 3];\nconst doubled = numbers.map(n => n * 2);\nconsole.log(doubled);",
  },
  {
    name: "TypeScript",
    fence: "ts run",
    code: "const double = (n: number): number => n * 2;\nconsole.log(double(3));",
  },
  {
    name: "Python",
    fence: "python run",
    code: "numbers = [1, 2, 3]\nprint(sum(numbers))",
  },
  {
    name: "Java",
    fence: "java run",
    code: "public class Main {\n    public static void main(String[] args) {\n        int n = 3;\n        System.out.println(n * 2);\n    }\n}",
  },
  {
    name: "C",
    fence: "c run",
    code: '#include <stdio.h>\nint main(void) {\n    int n = 3;\n    printf("%d\\n", n * 2);\n    return 0;\n}',
  },
  {
    name: "C++",
    fence: "cpp run",
    code: "#include <iostream>\nint main() {\n    int n = 3;\n    std::cout << n * 2 << std::endl;\n    return 0;\n}",
  },
  {
    name: "React",
    fence: "react-starter-1",
    code: 'import { useState } from "react";\nexport default function App() {\n    const [n, setN] = useState(0);\n    return <button onClick={() => setN(n + 1)}>눌러 보세요: {n}</button>;\n}',
  },
  {
    name: "React + Tailwind",
    fence: "react-tailwind-starter-1",
    code: 'export default function App() {\n    return <h1 className="p-6 text-3xl font-bold text-violet-600">안녕, 런박스!</h1>;\n}',
  },
];

export default function Page() {
  const { resolvedTheme } = useTheme();
  return (
    <main className="container mx-auto max-w-5xl space-y-8 px-4 py-8">
      <header className="space-y-3">
        <h1 className="text-3xl font-bold">런박스 만들기</h1>
        <p>글 속 코드를 읽는 데서 그치지 않고, 바로 실행하고 바꿔 보세요.</p>
        <p className="text-sm text-muted-foreground">
          코드 블록의 ▶ 버튼을 누르면 같은 페이지에 런박스가 열립니다. 웹 화면과
          DOM, React VDOM, 메모리 등을 언어에 맞는 패널에서 관찰할 수 있습니다.
        </p>
      </header>
      <section className="space-y-3" aria-labelledby="runbox-create">
        <h2 id="runbox-create" className="text-xl font-semibold">
          글에 넣는 방법
        </h2>
        <ol className="list-inside list-decimal space-y-2">
          <li>글 본문에 백틱 세 개로 코드 블록을 만듭니다.</li>
          <li>
            언어 이름 뒤에 <code>run</code>을 붙입니다. 예를 들어{" "}
            <code>python run</code>입니다.
          </li>
          <li>아래 예시의 ‘글에 붙여 넣을 원문’을 복사해 본문에 넣습니다.</li>
        </ol>
        <p className="text-sm text-muted-foreground">
          일반 코드 블록에는 재생 버튼이 붙지 않습니다. React는 준비된 스타터킷
          이름을 사용합니다. 한 파일 예제를 지원하며, HTML에서는 CSS와
          JavaScript를 같은 문서에 담으세요.
        </p>
      </section>
      <section className="space-y-2" aria-labelledby="runbox-use">
        <h2 id="runbox-use" className="text-xl font-semibold">
          실행하고 관찰하기
        </h2>
        <p>
          ▶로 열고 코드를 수정한 뒤 실행하세요. 프로그램 입력은 실행 전에 입력
          패널에 적습니다. 각 패널은 따로 열고 닫거나 경계선을 끌어 크기를
          조절할 수 있습니다.
        </p>
        <p>
          상단의 ⓘ에서 운영체제에 맞는 단축키를 확인하세요. 코드는 닫으면
          원문으로 돌아가고, 패널 배치와 크기만 같은 브라우저에 기억됩니다.
        </p>
      </section>
      <section className="space-y-6" aria-labelledby="runbox-examples">
        <h2 id="runbox-examples" className="text-xl font-semibold">
          바로 실행해 보는 예시
        </h2>
        {examples.map(({ name, fence, code }) => {
          const source = `\`\`\`${fence}\n${code}\n\`\`\``;
          return (
            <article
              key={fence}
              className="space-y-3 rounded-lg border border-border p-4"
            >
              <h3 className="font-semibold">{name}</h3>
              <ToastUIEditorViewer
                initialValue={source}
                theme={resolvedTheme === "dark" ? "dark" : "light"}
              />
              <details>
                <summary className="cursor-pointer text-sm">
                  글에 붙여 넣을 원문
                </summary>
                <pre className="mt-2 overflow-x-auto rounded bg-muted p-3 text-xs">
                  <code>{source}</code>
                </pre>
              </details>
            </article>
          );
        })}
      </section>
    </main>
  );
}
