"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NewLineCharacter = void 0;
function NewLineCharacter() {
    const { CONSOLE_LOG_JSON_NO_NEW_LINE_CHARACTERS } = process.env;
    if (CONSOLE_LOG_JSON_NO_NEW_LINE_CHARACTERS) {
        return ' - ';
    }
    else {
        return '\n';
    }
}
exports.NewLineCharacter = NewLineCharacter;
//# sourceMappingURL=new-line-character.js.map