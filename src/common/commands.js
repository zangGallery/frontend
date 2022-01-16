import { getCommands, bold, MarkdownUtil, italic, strikethrough } from "@uiw/react-md-editor"

const whitespaceSafeCommand = (originalCommand, prefix, suffix) => ({
    ...originalCommand,
    execute: (state, api) => {
        // Adjust the selection to encompass the whole word if the caret is inside one
        var newSelectionRange = (0, MarkdownUtil.selectWord)({
          text: state.text,
          selection: state.selection
        });

        // Replaces the current selection with the mark up
        var state1 = api.setSelectionRange(newSelectionRange);
        const text = state1.selectedText;

        const actualTextIndex = text.search(/\S|$/);
        const leadingWhitespace = text.substring(0, actualTextIndex);

        const trailingWhitespaceIndex = text.search(/\s+$/);
        const trailingWhitespace = trailingWhitespaceIndex == -1 ? '' : text.substring(trailingWhitespaceIndex, text.length); 

        // Adjust the selection to not contain the prefix and suffix
        var state2 = api.replaceSelection(leadingWhitespace.concat(prefix, state1.selectedText.trim(), suffix, trailingWhitespace));

        api.setSelectionRange({
          start: state2.selection.end - prefix.length - state1.selectedText.length + leadingWhitespace.length,
          end: state2.selection.end - suffix.length - trailingWhitespace.length
        });
    }
})

const smartBold = whitespaceSafeCommand(bold, '**', '**');
const smartItalic = whitespaceSafeCommand(italic, '*', '*');
const smartStrikethrough = whitespaceSafeCommand(strikethrough, '~~', '~~');
// Note: Code block words correctly without further intervention

const defaultCommands = getCommands()

defaultCommands[defaultCommands.findIndex((x) => x.name == 'bold')] = smartBold;
defaultCommands[defaultCommands.findIndex((x) => x.name == 'italic')] = smartItalic;
defaultCommands[defaultCommands.findIndex((x) => x.name == 'strikethrough')] = smartStrikethrough;

export {
    defaultCommands
}