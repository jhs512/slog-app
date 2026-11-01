import { post } from "./fixtures.mjs";

const fence = (info, body) => `\`\`\`${info}\n${body}\n\`\`\``;

export const htmlLab = `<style>button{padding:4px}</style>
<p id="msg">0회</p>
<button id="inc">눌러보기</button>
<script>
  let count = 0;
  document.getElementById("inc").addEventListener("click", () => {
    count++;
    document.getElementById("msg").textContent = count + "회";
    const item = document.createElement("li");
    item.textContent = "클릭 " + count;
    document.body.append(item);
    console.log("클릭", count);
  });
</script>`;

export const fontLab = `<style>.serif{font-family:serif}</style>
<p id="base">기본 글꼴</p>
<p id="custom" class="serif">작성자 글꼴</p>`;

export const jsLab = `const name = prompt();
const age = Number(prompt());
console.log("안녕", name, age + 1);
console.log({ list: [1, 2, 3] });`;

export const tsLab = `interface Point { x: number; y: number }
const add = (a: Point, b: Point): Point => ({ x: a.x + b.x, y: a.y + b.y });
console.log(add({ x: 1, y: 2 }, { x: 3, y: 4 }));`;

export const reactLab = `import { useState } from "react";

function Counter({ step }: { step: number }) {
  const [count, setCount] = useState(0);
  return <button onClick={() => setCount(count + step)}>count {count}</button>;
}

export default function App() {
  return (
    <main>
      <h1>카운터</h1>
      <Counter step={2} />
    </main>
  );
}`;

export const tailwindLab = `export default function App() {
  return <p id="tw" className="text-red-600 font-bold p-4">테일윈드</p>;
}`;

export const cLab = `#include <stdio.h>
#include <stdlib.h>

int main(void) {
  int n;
  scanf("%d", &n);
  int arr[3] = {10, 20, 30};
  int *p = &arr[1];
  int *heap = malloc(sizeof(int) * n);
  for (int i = 0; i < n; i++) heap[i] = i * i;
  printf("n=%d p=%d last=%d\\n", n, *p, heap[n - 1]);
  free(heap);
  return 0;
}`;

export const cStructLab = `#include <stdio.h>
#include <stdlib.h>

typedef struct Node {
  int value;
  struct Node *next;
} Node;

int main(void) {
  Node *head = NULL;
  for (int i = 3; i >= 1; i--) {
    Node *node = malloc(sizeof(Node));
    node->value = i * 10;
    node->next = head;
    head = node;
  }
  for (Node *p = head; p != NULL; p = p->next) printf("%d\\n", p->value);
  while (head != NULL) {
    Node *next = head->next;
    free(head);
    head = next;
  }
  return 0;
}`;

export const cppLab = `#include <iostream>

struct Node {
  int value;
  Node* next;
};

int main() {
  int n;
  if (!(std::cin >> n)) n = 7;
  int& alias = n;
  alias = alias * 2;
  Node* first = new Node{n, nullptr};
  Node* second = new Node{n + 1, first};
  std::cout << second->value << " " << second->next->value << "\\n";
  delete second;
  delete first;
  return 0;
}`;

export const codeLabContent = [
  "# 코드 실험",
  "설명용 C 코드에는 버튼이 없습니다.",
  fence("c", "int main(void) { return 0; }"),
  "## HTML",
  fence("html run", htmlLab),
  fence("html run", fontLab),
  "## JavaScript",
  fence("js run", jsLab),
  "## TypeScript",
  fence("ts run", tsLab),
  "## React",
  fence("react-starter-1", reactLab),
  fence("react-tailwind-starter-1", tailwindLab),
  fence("react-starter-9", "export default () => null;"),
  "## C",
  fence("c run", cLab),
  fence("c run", cStructLab),
  "## C++",
  fence("cpp run", cppLab),
  fence("rust run", 'fn main() { println!("hi"); }'),
  "## 회귀",
  fence("mermaid", "graph TD\n  A --> B"),
  "<details>\n<summary>접힌 예제</summary>\n\n" +
    fence("js run", 'console.log("접힌 블록");') +
    "\n\n</details>",
].join("\n\n");

export const codeLabPost = {
  ...post,
  id: 8,
  title: "코드 실험 회귀 검사",
  content: codeLabContent,
};
