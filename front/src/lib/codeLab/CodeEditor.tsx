"use client";

import { useTheme } from "next-themes";

import { useEffect, useRef } from "react";

import { indentWithTab } from "@codemirror/commands";
import { cpp } from "@codemirror/lang-cpp";
import { html } from "@codemirror/lang-html";
import { java } from "@codemirror/lang-java";
import { javascript } from "@codemirror/lang-javascript";
import { python } from "@codemirror/lang-python";
import type { LanguageSupport } from "@codemirror/language";
import { EditorState } from "@codemirror/state";
import { oneDark } from "@codemirror/theme-one-dark";
import { EditorView, keymap } from "@codemirror/view";
import { basicSetup } from "codemirror";

import type { LabEngine } from "./lab";

const languages = {
  html: () => html(),
  javascript: () => javascript(),
  typescript: () => javascript({ typescript: true }),
  react: () => javascript({ jsx: true }),
  jsMemory: () => javascript(),
  c: () => cpp(),
  cpp: () => cpp(),
  python: () => python(),
  java: () => java(),
} satisfies Record<LabEngine, () => LanguageSupport>;

export default function CodeEditor({
  value,
  engine,
  onChange,
}: {
  value: string;
  engine: LabEngine;
  onChange: (value: string) => void;
}) {
  const host = useRef<HTMLDivElement>(null);
  const view = useRef<EditorView | null>(null);
  const change = useRef(onChange);
  const currentValue = useRef(value);
  const { resolvedTheme } = useTheme();

  useEffect(() => {
    change.current = onChange;
    currentValue.current = value;
  }, [onChange, value]);

  useEffect(() => {
    if (!host.current) return;
    const editor = new EditorView({
      parent: host.current,
      state: EditorState.create({
        doc: currentValue.current,
        extensions: [
          basicSetup,
          languages[engine](),
          keymap.of([indentWithTab]),
          ...(resolvedTheme === "dark" ? [oneDark] : []),
          EditorView.contentAttributes.of({
            "aria-label": "실험 코드",
            "data-testid": "code-lab-editor",
            "aria-multiline": "true",
            spellcheck: "false",
          }),
          EditorView.theme({
            "&": { height: "100%", fontSize: "13px" },
            ".cm-scroller": {
              overflow: "auto",
              fontFamily:
                "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace",
            },
          }),
          EditorView.updateListener.of((update) => {
            if (update.docChanged) change.current(update.state.doc.toString());
          }),
        ],
      }),
    });
    view.current = editor;
    return () => {
      view.current = null;
      editor.destroy();
    };
  }, [engine, resolvedTheme]);

  useEffect(() => {
    const editor = view.current;
    if (editor && editor.state.doc.toString() !== value) {
      editor.dispatch({
        changes: { from: 0, to: editor.state.doc.length, insert: value },
      });
    }
  }, [value]);

  return <div ref={host} className="h-full min-h-0 w-full overflow-hidden" />;
}
