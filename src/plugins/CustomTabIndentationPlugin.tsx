import {useLexicalComposerContext} from '@lexical/react/LexicalComposerContext';
import {
  $createParagraphNode,
  $getSelection,
  $isRangeSelection,
  $isParagraphNode,
  $isTextNode,
  COMMAND_PRIORITY_CRITICAL,
  INDENT_CONTENT_COMMAND,
  OUTDENT_CONTENT_COMMAND,
  KEY_TAB_COMMAND,
  LexicalNode,
  $createTabNode,
} from 'lexical';
import {useEffect} from 'react';
import {$isImageNode} from '../nodes/ImageNode'; // Update this import

function indentNode(node: LexicalNode) {
  if ($isParagraphNode(node)) {
    const children = node.getChildren();
    const hasImage = children.some($isImageNode);

    if (hasImage) {
      // If the paragraph contains an image, indent the whole paragraph
      const indent = node.getIndent();
      node.setIndent(indent + 1);
    } else {
      // If no image, add a tab to the beginning of the paragraph
      const firstChild = node.getFirstChild();
      if (firstChild) {
        firstChild.insertBefore($createTabNode());
      } else {
        node.append($createTabNode());
      }
    }
  } else if ($isTextNode(node)) {
    const parent = node.getParent();
    if ($isParagraphNode(parent)) {
      indentNode(parent);
    }
  } else if ($isImageNode(node)) {
    const parent = node.getParent();
    if ($isParagraphNode(parent)) {
      const indent = parent.getIndent();
      parent.setIndent(indent + 1);
    } else {
      // If the image is not in a paragraph, create a new paragraph and move the image into it
      const newParagraph = $createParagraphNode();
      newParagraph.append(node);
      node.getParentOrThrow().replace(newParagraph);
      newParagraph.setIndent(1);
    }
  }
}

function outdentNode(node: LexicalNode) {
  if ($isParagraphNode(node)) {
    const indent = node.getIndent();
    if (indent > 0) {
      node.setIndent(indent - 1);
    } else {
      // If there's no indent, remove the first tab character if it exists
      const firstChild = node.getFirstChild();
      if ($isTextNode(firstChild) && firstChild.getTextContent().startsWith('\t')) {
        firstChild.splitText(1);
        firstChild.remove();
      }
    }
  } else if ($isTextNode(node)) {
    const parent = node.getParent();
    if ($isParagraphNode(parent)) {
      outdentNode(parent);
    }
  } else if ($isImageNode(node)) {
    const parent = node.getParent();
    if ($isParagraphNode(parent)) {
      const indent = parent.getIndent();
      parent.setIndent(Math.max(0, indent - 1));
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
        editor.update(() => {
          indentNode(anchorNode);
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
        editor.update(() => {
          outdentNode(anchorNode);
        });

        return true;
      },
      COMMAND_PRIORITY_CRITICAL,
    );
  }, [editor]);

  return null;
}