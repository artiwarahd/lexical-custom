import {useLexicalComposerContext} from '@lexical/react/LexicalComposerContext';
import {
  $getSelection,
  $isRangeSelection,
  $isParagraphNode,
  $isTextNode,
  COMMAND_PRIORITY_CRITICAL,
  INDENT_CONTENT_COMMAND,
  OUTDENT_CONTENT_COMMAND,
  KEY_TAB_COMMAND,
  LexicalNode,
} from 'lexical';
import {useEffect} from 'react';

function indentNode(node: LexicalNode) {
  if ($isTextNode(node)) {
    node.setTextContent('\t' + node.getTextContent());
  } else if ($isParagraphNode(node)) {
    node.setIndent(node.getIndent() + 1);
  }
}

function outdentNode(node: LexicalNode) {
  if ($isTextNode(node)) {
    const content = node.getTextContent();
    if (content.startsWith('\t')) {
      node.setTextContent(content.slice(1));
    }
  } else if ($isParagraphNode(node)) {
    const currentIndent = node.getIndent();
    if (currentIndent > 0) {
      node.setIndent(currentIndent - 1);
    }
  }
}

export function CustomTabIndentationPlugin(): null {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    return editor.registerCommand(
      KEY_TAB_COMMAND,
      (event) => {
        event.preventDefault();
        if (event.shiftKey) {
          return editor.dispatchCommand(OUTDENT_CONTENT_COMMAND, undefined);
        } else {
          return editor.dispatchCommand(INDENT_CONTENT_COMMAND, undefined);
        }
      },
      COMMAND_PRIORITY_CRITICAL,
    );
  }, [editor]);

  useEffect(() => {
    return editor.registerCommand(
      INDENT_CONTENT_COMMAND,
      () => {
        const selection = $getSelection();
        if (!$isRangeSelection(selection)) {
          return false;
        }

        const anchorNode = selection.anchor.getNode();
        const focusNode = selection.focus.getNode();
        if (anchorNode !== focusNode) {
          return false;
        }

        editor.update(() => {
          indentNode(anchorNode);
          // Adjust the selection
          if ($isTextNode(anchorNode)) {
            const newOffset = selection.anchor.offset + 1;
            selection.setTextNodeRange(anchorNode, newOffset, anchorNode, newOffset);
          }
        });

        return true;
      },
      COMMAND_PRIORITY_CRITICAL,
    );
  }, [editor]);

  useEffect(() => {
    return editor.registerCommand(
      OUTDENT_CONTENT_COMMAND,
      () => {
        const selection = $getSelection();
        if (!$isRangeSelection(selection)) {
          return false;
        }

        const anchorNode = selection.anchor.getNode();
        const focusNode = selection.focus.getNode();
        if (anchorNode !== focusNode) {
          return false;
        }

        editor.update(() => {
          outdentNode(anchorNode);
          // Adjust the selection
          if ($isTextNode(anchorNode)) {
            const newOffset = Math.max(0, selection.anchor.offset - 1);
            selection.setTextNodeRange(anchorNode, newOffset, anchorNode, newOffset);
          }
        });

        return true;
      },
      COMMAND_PRIORITY_CRITICAL,
    );
  }, [editor]);

  return null;
}