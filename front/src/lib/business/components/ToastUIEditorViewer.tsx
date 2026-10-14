"use client";

import dynamic from "next/dynamic";

import { forwardRef } from "react";

import { getMarpParts } from "../marpSource";
import MarpDeck from "./MarpDeck";
import { ToastUIEditorViewerCoreProps } from "./ToastUIEditorViewerCore";

const ToastUIEditorViewerCore = dynamic(
  () => import("./ToastUIEditorViewerCore"),
  {
    ssr: false,
    loading: () => <div>로딩중...</div>,
  },
);

type ViewerProps = ToastUIEditorViewerCoreProps;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const ToastUIEditorViewer = forwardRef<any, ViewerProps>((props, ref) => {
  const parts = getMarpParts(props.initialValue);
  if (parts.some((part) => part.kind === "marp")) {
    return (
      <div className="space-y-6">
        {parts.map((part, index) =>
          part.kind === "marp" ? (
            <MarpDeck
              key={`${part.id}-${part.source}`}
              source={part.source}
              title={part.title}
              href={
                props.postId
                  ? `/p/${props.postId}/marp/${encodeURIComponent(part.id)}`
                  : undefined
              }
            />
          ) : (
            <ToastUIEditorViewerCore
              key={`${index}-${part.source}`}
              {...props}
              initialValue={part.source}
            />
          ),
        )}
      </div>
    );
  }
  return <ToastUIEditorViewerCore ref={ref} {...props} />;
});

ToastUIEditorViewer.displayName = "ToastUIEditorViewer";

export default ToastUIEditorViewer;
