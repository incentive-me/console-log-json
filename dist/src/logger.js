"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.restoreStdOut = exports.overrideStdOut = exports.LoggerRestoreConsole = exports.LOG_LEVEL = exports.logUsingWinston = exports.LoggerAdaptToConsole = exports.NativeConsoleLog = exports.SetLogLevel = exports.GetLogLevel = exports.FormatErrorObject = void 0;
/* tslint:disable:object-literal-sort-keys */
const app_root_path_1 = __importDefault(require("app-root-path"));
const json_stringify_safe_1 = __importDefault(require("json-stringify-safe"));
const path = __importStar(require("path"));
const w = __importStar(require("winston"));
const error_with_context_1 = require("./error-with-context");
const format_stack_trace_1 = require("./format-stack-trace");
const get_call_stack_1 = require("./get-call-stack");
const get_calling_filename_1 = require("./get-calling-filename");
const safe_object_assign_1 = require("./safe-object-assign");
const sort_object_1 = require("./sort-object");
const to_one_line_1 = require("./to-one-line");
const env_1 = require("./env");
const new_line_character_1 = require("./new-line-character");
// tslint:disable-next-line:no-var-requires
require('source-map-support').install({
    hookRequire: true,
});
// tslint:disable-next-line:no-var-requires
/* tslint:disable:no-conditional-assignment */
// Console-polyfill. MIT license.
// https://github.com/paulmillr/console-polyfill
// Make it safe to do console.log() always.
((global) => {
    'use strict';
    if (global == null) {
        return;
    }
    if (!global.console) {
        // @ts-ignore
        global.console = {};
    }
    const con = global.console;
    let prop;
    let method;
    // tslint:disable-next-line:no-empty only-arrow-functions
    const dummy = function () { };
    const properties = ['memory'];
    const methods = ('assert,clear,count,debug,dir,dirxml,error,exception,group,' +
        'groupCollapsed,groupEnd,info,log,markTimeline,profile,profiles,profileEnd,' +
        'show,table,time,timeEnd,timeline,timelineEnd,timeStamp,trace,warn,timeLog,trace').split(',');
    while ((prop = properties.pop())) {
        if (!con[prop]) {
            con[prop] = {};
        }
    }
    while ((method = methods.pop())) {
        if (!con[method]) {
            con[method] = dummy;
        }
    }
    // Using `this` for web workers & supports Browserify / Webpack.
})(typeof window === 'undefined' ? this : window);
function FormatErrorObject(object) {
    let returnData = object;
    const { CONSOLE_LOG_JSON_NO_NEW_LINE_CHARACTERS, CONSOLE_LOG_JSON_NO_NEW_LINE_CHARACTERS_EXCEPT_STACK } = process.env;
    // Flatten message if it is an object
    if (typeof object.message === 'object') {
        // const messageObj = object.message;
        // delete returnData.message;
        returnData = (0, safe_object_assign_1.safeObjectAssign)(returnData, ['message'], object.message);
    }
    // Combine extra context from ErrorWithContext
    if (object.extraContext) {
        const extraContext = object.extraContext;
        delete returnData.extraContext;
        returnData = (0, safe_object_assign_1.safeObjectAssign)(returnData, ['message'], extraContext);
    }
    // Add stack trace if available
    if (object.stack) {
        const stack = object.stack;
        const stackOneLine = format_stack_trace_1.FormatStackTrace.toNewLines((0, to_one_line_1.ToOneLine)(stack));
        delete returnData.stack;
        delete returnData.errCallStack;
        returnData = (0, safe_object_assign_1.safeObjectAssign)(returnData, ['message'], { errCallStack: stackOneLine });
        returnData.level = 'error';
        // Lets put a space into the message when stack message exists
        if (returnData.message) {
            const stackRegex = new RegExp(`^Error:[ ](.*?)${(0, new_line_character_1.NewLineCharacter)()}`, 'im');
            const stackRegexMatch = stackOneLine.match(stackRegex);
            if (stackRegexMatch != null && stackRegexMatch.length >= 2) {
                const stackMessage = stackRegexMatch[1];
                returnData.message = `${(0, to_one_line_1.ToOneLine)(returnData.message).replace(stackMessage, '')} - ${stackMessage}`;
            }
            returnData.message = (0, to_one_line_1.ToOneLine)(returnData.message);
        }
        // info.stack
    }
    // Ensure that message is second in the resulting JSON
    if (returnData.message) {
        const message = returnData.message;
        delete returnData.message;
        returnData = { message, ...returnData };
    }
    // Ensure that log level is first in the resulting JSON
    if (returnData.level) {
        const savedLogLevel = returnData.level;
        delete returnData.level;
        returnData = { level: savedLogLevel, ...returnData };
    }
    // Add timestamp
    const { CONSOLE_LOG_JSON_NO_TIME_STAMP } = process.env;
    if (!CONSOLE_LOG_JSON_NO_TIME_STAMP) {
        returnData['@timestamp'] = new Date().toISOString();
    }
    // cleanup leading dash in message
    if (returnData.message && returnData.message.startsWith(' - ')) {
        returnData.message = returnData.message.substring(3);
    }
    // interpret JSON if it is inside the error message
    if (returnData.message && returnData.message.length > 0) {
        let parsedObject = null;
        const { CONSOLE_LOG_JSON_DISABLE_AUTO_PARSE } = process.env;
        try {
            // if defined CONSOLE_LOG_JSON_DISABLE_AUTO_PARSE=TRUE, disable auto parsing.
            if (CONSOLE_LOG_JSON_DISABLE_AUTO_PARSE) {
                parsedObject = JSON.parse(returnData.message); // trim & remove new lines
                parsedObject = JSON.stringify(parsedObject);
            }
            else {
                parsedObject = JSON.parse(returnData.message);
            }
        }
        catch (err) {
            // do nothing
        }
        if (parsedObject != null) {
            if (CONSOLE_LOG_JSON_DISABLE_AUTO_PARSE) {
                returnData.message = parsedObject;
            }
            else {
                returnData.message = '<auto-parsed-json-string-see-@autoParsedJson-property>';
                returnData['@autoParsedJson'] = parsedObject;
            }
        }
    }
    if (returnData.message != null && returnData.message.length === 0) {
        if (returnData.level === 'error') {
            returnData.message = '<no-error-message-was-passed-to-console-log>';
        }
        else {
            returnData.message = '<no-message-was-passed-to-console-log>';
        }
    }
    const jsonString = (0, json_stringify_safe_1.default)(returnData);
    // strip ansi colors
    const colorStripped = jsonString.replace(/\\u001B\[\d*m/gim, '');
    // add new line at the end for better local readability
    let endOfLogCharacter = '\n';
    if (CONSOLE_LOG_JSON_NO_NEW_LINE_CHARACTERS || CONSOLE_LOG_JSON_NO_NEW_LINE_CHARACTERS_EXCEPT_STACK) {
        endOfLogCharacter = '';
    }
    return `${colorStripped}${endOfLogCharacter}`;
}
exports.FormatErrorObject = FormatErrorObject;
const print = w.format.printf((info) => {
    return FormatErrorObject(info);
});
const Logger = w.createLogger({
    level: 'info',
    format: w.format.combine(w.format.errors({ stack: true }), print),
    transports: [new w.transports.Console()],
});
function GetLogLevel() {
    return Logger.level;
}
exports.GetLogLevel = GetLogLevel;
function SetLogLevel(level) {
    Logger.level = level;
}
exports.SetLogLevel = SetLogLevel;
let consoleErrorBackup = null;
let consoleWarningBackup = null;
let consoleInfoBackup = null;
let consoleHttpBackup = null;
let consoleVerboseBackup = null;
let consoleDebugBackup = null;
let consoleSillyBackup = null;
let consoleLogBackup = null;
function NativeConsoleLog(...args) {
    if (consoleLogBackup) {
        consoleLogBackup(...args);
    }
    else {
        console.log(...args);
    }
}
exports.NativeConsoleLog = NativeConsoleLog;
function ifEverythingFailsLogger(functionName, err) {
    if (consoleErrorBackup != null) {
        try {
            consoleErrorBackup(`{"level":"error","message":"Error: console-log-json: error while trying to process ${functionName} : ${err.message}"}`);
        }
        catch (err) {
            throw new Error(`Failed to call ${functionName} and failed to fall back to native function`);
        }
    }
    else {
        throw new Error('Error: console-log-json: This is unexpected, there is no where to call console.log, this should never happen');
    }
}
let logParams;
function LoggerAdaptToConsole(options) {
    const env = new env_1.Env();
    env.loadDotEnv();
    const defaultOptions = {
        logLevel: LOG_LEVEL.info,
        debugString: false,
    };
    logParams = { ...defaultOptions, ...options };
    // log package name
    packageName = '';
    const jsonPackage = require(path.join(app_root_path_1.default.toString(), 'package.json'));
    packageName = jsonPackage.name;
    Logger.level = logParams.logLevel;
    if (consoleErrorBackup == null) {
        consoleErrorBackup = console.error;
    }
    if (consoleWarningBackup == null) {
        consoleWarningBackup = console.warn;
    }
    if (consoleInfoBackup == null) {
        consoleInfoBackup = console.info;
    }
    if (consoleHttpBackup == null) {
        consoleHttpBackup = console.http;
    }
    if (consoleVerboseBackup == null) {
        consoleVerboseBackup = console.verbose;
    }
    if (consoleDebugBackup == null) {
        consoleDebugBackup = console.debug;
    }
    if (consoleSillyBackup == null) {
        consoleSillyBackup = console.silly;
    }
    if (consoleLogBackup == null) {
        consoleLogBackup = console.log;
    }
    console.error = (...args) => {
        return logUsingWinston(args, LOG_LEVEL.error);
    };
    console.warn = (...args) => {
        return logUsingWinston(args, LOG_LEVEL.warn);
    };
    console.info = (...args) => {
        return logUsingWinston(args, LOG_LEVEL.info);
    };
    console.http = (...args) => {
        return logUsingWinston(args, LOG_LEVEL.http);
    };
    console.verbose = (...args) => {
        return logUsingWinston(args, LOG_LEVEL.verbose);
    };
    console.debug = (...args) => {
        return logUsingWinston(args, LOG_LEVEL.debug);
    };
    console.silly = (...args) => {
        return logUsingWinston(args, LOG_LEVEL.silly);
    };
    console.log = (...args) => {
        return logUsingWinston(args, LOG_LEVEL.info);
    };
}
exports.LoggerAdaptToConsole = LoggerAdaptToConsole;
function filterNullOrUndefinedParameters(args) {
    let nullOrUndefinedCount = 0;
    args.forEach((f, index) => {
        // Remove null parameters
        if (f == null) {
            nullOrUndefinedCount += 1;
            args.splice(index, 1);
            return;
        }
    });
    return nullOrUndefinedCount;
}
function findExplicitLogLevelAndUseIt(args, level) {
    let foundLevel = false;
    args.forEach((f) => {
        if (!foundLevel && f && typeof f === 'object' && Object.keys(f) && Object.keys(f).length > 0 && Object.keys(f)[0].toLowerCase() === 'level') {
            let specifiedLevelFromParameters = f[Object.keys(f)[0]];
            // Normalize alternate log level strings
            if (specifiedLevelFromParameters.toLowerCase() === 'err') {
                specifiedLevelFromParameters = LOG_LEVEL.error;
            }
            if (specifiedLevelFromParameters.toLowerCase() === 'warning') {
                specifiedLevelFromParameters = LOG_LEVEL.warn;
            }
            if (specifiedLevelFromParameters.toLowerCase() === 'information') {
                specifiedLevelFromParameters = LOG_LEVEL.info;
            }
            const maybeLevel = LOG_LEVEL[specifiedLevelFromParameters];
            if (maybeLevel !== undefined) {
                level = maybeLevel;
            }
            else {
                level = LOG_LEVEL.info;
            }
            // Remove this property since we have absorbed it into the log level
            delete f[Object.keys(f)[0]];
            foundLevel = true;
        }
    });
    return level;
}
let packageName = '';
/**
 * It takes the arguments passed to the console.log function and logs them using Winston
 * @param {any[]} args - any[] - the arguments passed to the console.log function
 * @param {LOG_LEVEL} level - LOG_LEVEL
 */
function logUsingWinston(args, level) {
    if (!packageName || packageName.length === 0) {
        args.push({ '@packageName': '<not-yet-set> Please await the call LoggerAdaptToConsole() on startup' });
    }
    else {
        args.push({ '@packageName': packageName });
    }
    // log debug logging if needed
    try {
        if (logParams.debugString) {
            // this line is only for enabling testing
            if (console.debugStringException != null) {
                console.debugStringException();
            }
            let argsStringArray = args.map((m) => JSON.stringify(m, Object.getOwnPropertyNames(m)));
            if (!argsStringArray) {
                argsStringArray = [];
            }
            args.push({ _loggerDebug: argsStringArray });
        }
    }
    catch (err) {
        args.push({ _loggerDebug: `err ${err.message}` });
    }
    // Discover calling filename
    try {
        const name = (0, get_calling_filename_1.getCallingFilename)();
        if (name) {
            args.push({ '@filename': name, '@logCallStack': (0, get_call_stack_1.getCallStack)() });
        }
        else {
            args.push({ '@filename': '<unknown>', '@logCallStack': (0, get_call_stack_1.getCallStack)() });
        }
    }
    catch (err) {
        args.push({ '@filename': `<error>:${err.message}`, '@logCallStack': err.message });
    }
    try {
        level = findExplicitLogLevelAndUseIt(args, level);
        // this line is only for enabling testing
        if (console.exception != null) {
            console.exception();
        }
        const { message, errorObject } = extractParametersFromArguments(args);
        Logger.log(level, message, supressDetailsIfSelected(errorObject));
    }
    catch (err) {
        ifEverythingFailsLogger('console.log', err);
    }
}
exports.logUsingWinston = logUsingWinston;
function supressDetailsIfSelected(errorObject) {
    const { CONSOLE_LOG_JSON_NO_STACK_FOR_NON_ERROR } = process.env;
    const { CONSOLE_LOG_JSON_NO_FILE_NAME } = process.env;
    const { CONSOLE_LOG_JSON_NO_PACKAGE_NAME } = process.env;
    const { CONSOLE_LOG_JSON_NO_LOGGER_DEBUG } = process.env;
    if (errorObject == undefined) {
        return undefined;
    }
    if (CONSOLE_LOG_JSON_NO_STACK_FOR_NON_ERROR) {
        delete errorObject['@logCallStack'];
    }
    if (CONSOLE_LOG_JSON_NO_FILE_NAME) {
        delete errorObject['@filename'];
    }
    if (CONSOLE_LOG_JSON_NO_PACKAGE_NAME) {
        delete errorObject['@packageName'];
    }
    if (CONSOLE_LOG_JSON_NO_LOGGER_DEBUG) {
        delete errorObject._loggerDebug;
    }
    return errorObject;
}
/**
 * Each level is given a specific integer priority.
 * The higher the priority the more important the message is considered to be,
 * and the lower the corresponding integer priority.
 * For example, as specified exactly
 * in RFC5424 the syslog levels are prioritized from 0 to 7 (highest to lowest).
 */
var LOG_LEVEL;
(function (LOG_LEVEL) {
    /**
     * Priority 0
     */
    LOG_LEVEL["error"] = "error";
    /**
     * Priority 1
     */
    LOG_LEVEL["warn"] = "warn";
    /**
     * Priority 2
     */
    LOG_LEVEL["info"] = "info";
    /**
     * Priority 3
     */
    LOG_LEVEL["http"] = "http";
    /**
     * Priority 4
     */
    LOG_LEVEL["verbose"] = "verbose";
    /**
     * Priority 5
     */
    LOG_LEVEL["debug"] = "debug";
    /**
     * Priority 6
     */
    LOG_LEVEL["silly"] = "silly";
})(LOG_LEVEL = exports.LOG_LEVEL || (exports.LOG_LEVEL = {}));
function LoggerRestoreConsole() {
    if (consoleErrorBackup != null) {
        console.error = consoleErrorBackup;
    }
    if (consoleWarningBackup != null) {
        console.warn = consoleWarningBackup;
    }
    if (consoleInfoBackup != null) {
        console.info = consoleInfoBackup;
    }
    if (consoleHttpBackup != null) {
        console.http = consoleHttpBackup;
    }
    if (consoleVerboseBackup != null) {
        console.verbose = consoleVerboseBackup;
    }
    if (consoleDebugBackup != null) {
        console.debug = consoleDebugBackup;
    }
    if (consoleSillyBackup != null) {
        console.silly = consoleSillyBackup;
    }
    if (consoleLogBackup != null) {
        console.log = consoleLogBackup;
    }
}
exports.LoggerRestoreConsole = LoggerRestoreConsole;
function extractParametersFromArguments(args) {
    let message = '';
    let errorObject;
    let extraContext;
    let errorObjectWasPassed = false;
    let extraContextWasPassed = false;
    const nullOrUndefinedCount = filterNullOrUndefinedParameters(args);
    args.forEach((f) => {
        // String parameter or number parameter
        if (typeof f === 'string' || typeof f === 'number') {
            message = `${message}${message.length > 0 ? ' - ' : ''}${f}`;
        }
        // Error Object parameter
        else if (typeof f === 'object' &&
            // f.name === 'Error' &&
            typeof f.message === 'string' &&
            typeof f.stack === 'string' &&
            f.stack.length > 0) {
            errorObject = f;
        }
        // Extra Context object parameter
        else if (typeof f === 'object' && f.name !== 'Error' && f.stack === undefined) {
            if (extraContext == null) {
                extraContext = f;
            }
            else {
                extraContext = (0, safe_object_assign_1.safeObjectAssign)(extraContext, ['message'], f);
            }
        }
    });
    // if we have extra context we must either wrap it into an existing error object or, pass it dry
    if (extraContext != undefined) {
        // noinspection JSUnusedAssignment
        extraContext = (0, sort_object_1.sortObject)(extraContext);
        if (errorObject == undefined) {
            errorObjectWasPassed = false;
            // pass it dry
            errorObject = extraContext;
        }
        else {
            errorObjectWasPassed = true;
            // wrap it into existing error object
            // noinspection JSUnusedAssignment
            if (errorObject.name != null && errorObject.name.length > 0) {
                // noinspection JSUnusedAssignment
                extraContext = (0, safe_object_assign_1.safeObjectAssign)(extraContext, ['message'], { '@errorObjectName': errorObject.name });
            }
            // noinspection JSUnusedAssignment
            errorObject = new error_with_context_1.ErrorWithContext(errorObject, extraContext);
        }
    }
    if (nullOrUndefinedCount > 0 && message.length === 0) {
        message = '<value-passed-to-console-log-json-was-null>';
    }
    // check if user defined extra context was passed
    if (extraContext) {
        const knownExtraContextKeys = ['@filename', '@logCallStack', '@packageName'];
        const knownFiltered = Object.keys(extraContext).filter((f) => !knownExtraContextKeys.includes(f));
        if (knownFiltered.length > 0) {
            extraContextWasPassed = true;
        }
    }
    if (nullOrUndefinedCount === 0 && message.length === 0 && !errorObjectWasPassed && !extraContextWasPassed) {
        message = '<nothing-was-passed-to-console-log>';
    }
    return { message, errorObject };
}
function overrideStdOut() {
    const originalWrite = process.stdout.write;
    const outputText = [];
    process.stdout.write = (...text) => {
        outputText.push(text[0]);
    };
    return { originalWrite, outputText };
}
exports.overrideStdOut = overrideStdOut;
function restoreStdOut(originalWrite) {
    process.stdout.write = originalWrite;
}
exports.restoreStdOut = restoreStdOut;
//# sourceMappingURL=logger.js.map