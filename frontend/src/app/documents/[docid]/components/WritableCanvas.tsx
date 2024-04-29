"use client";

import { useCallback, useMemo, useState } from "react";
import { Editor, Transforms, createEditor, Element, Node } from "slate";
import {
  Editable,
  RenderElementProps,
  RenderLeafProps,
  Slate,
  withReact,
} from "slate-react";
// This example is for an Editor with `ReactEditor` and `HistoryEditor`
import { BaseEditor } from "slate";
import { ReactEditor } from "slate-react";
import { HistoryEditor } from "slate-history";

type ParagraphElement = { type: "paragraph"; children: CustomText[] };
type CodeElement = { type: "code"; children: CustomText[] };
type CustomElement = ParagraphElement | CodeElement;

type CustomText = { text: string; bold?: true };

type CustomNode = Node & (CustomElement | CustomText);

declare module "slate" {
  interface CustomTypes {
    Editor: BaseEditor & ReactEditor & HistoryEditor;
    Element: CustomElement;
    Text: CustomText;
  }
}

// Define a React component renderer for our code blocks.
const CodeElement = (props: RenderElementProps) => {
  return (
    <pre {...props.attributes}>
      <code>Code: {props.children}</code>
    </pre>
  );
};

const DefaultElement = (props: RenderElementProps) => {
  return <p {...props.attributes}>Default: {props.children}</p>;
};

const Leaf = (props: RenderLeafProps) => {
  return (
    <span
      {...props.attributes}
      style={{ fontWeight: props.leaf.bold ? "bold" : "normal" }}
    >
      {props.children}
    </span>
  );
};

const CustomEditor = {
  isBoldMarkActive(editor: Editor) {
    const marks = Editor.marks(editor);
    return marks ? marks.bold === true : false;
  },

  isCodeBlockActive(editor: Editor): boolean {
    const [match] = Editor.nodes<CustomNode>(editor, {
      match: (n) => Element.isElement(n) && n.type === "code",
    });

    return !!match;
  },

  toggleBoldMark(editor: Editor) {
    const isActive = CustomEditor.isBoldMarkActive(editor);
    if (isActive) {
      Editor.removeMark(editor, "bold");
    } else {
      Editor.addMark(editor, "bold", true);
    }
  },

  toggleCodeBlock(editor: Editor) {
    debugger;
    const isActive = CustomEditor.isCodeBlockActive(editor);
    Transforms.setNodes<CustomNode>(
      editor,
      { type: isActive ? undefined : "code" },
      { match: (n) => Element.isElement(n) && Editor.isBlock(editor, n) }
    );
  },
};

export default function WritableCanvas() {
  const [editor] = useState(() => withReact(createEditor()));

  const initialValue = useMemo(() => {
    if (typeof window !== "undefined") {
      const content = localStorage.getItem("content");
      if (content) return JSON.parse(content);
    }
    return [
      {
        type: "paragraph",
        children: [{ text: "a line of text in a paragraph" }],
      },
    ];
  }, []);

  const renderElement = useCallback((props: RenderElementProps) => {
    switch (props.element.type) {
      case "code":
        return <CodeElement {...props} />;
      default:
        return <DefaultElement {...props} />;
    }
  }, []);

  const renderLeaf = useCallback((props: RenderLeafProps) => {
    return <Leaf {...props} />;
  }, []);

  return (
    <Slate
      editor={editor}
      initialValue={initialValue}
      onChange={(value) => {
        const isAstChange = editor.operations.some(
          (op) => "set_selection" !== op.type
        );
        if (isAstChange) {
          const content = JSON.stringify(value);
          localStorage.setItem("content", content);
        }
      }}
    >
      <div>
        <button
          className="rounded-full bg-lime-300"
          onMouseDown={(event) => {
            event.preventDefault();
            CustomEditor.toggleBoldMark(editor);
          }}
        >
          Bold
        </button>
        <button
          className="rounded-full bg-lime-300"
          onMouseDown={(event) => {
            event.preventDefault();
            CustomEditor.toggleCodeBlock(editor);
          }}
        >
          Code Block
        </button>
      </div>
      <Editable
        renderElement={renderElement}
        renderLeaf={renderLeaf}
        onMouseUp={(event) => {
          if (editor.selection) {
            console.log(editor.selection);
            const domRange = ReactEditor.toDOMRange(editor, editor.selection);
            const rect = domRange.getBoundingClientRect();
            console.log(rect);
          }
        }}
        onKeyDown={(event) => {
          if (!event.ctrlKey) {
            return;
          }
          switch (event.key) {
            case "`": {
              event.preventDefault();
              CustomEditor.toggleCodeBlock(editor);
              break;
            }
            case "b": {
              event.preventDefault();
              CustomEditor.toggleBoldMark(editor);
              break;
            }
          }
        }}
      />
    </Slate>
  );
}
