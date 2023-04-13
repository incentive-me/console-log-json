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
Object.defineProperty(exports, "__esModule", { value: true });
/* tslint:disable:only-arrow-functions */
const chai_1 = require("chai");
const cheerio = __importStar(require("cheerio"));
const src_1 = require("../src");
describe('when cheerio error occurs', async function () {
    it('catches error properly', async function () {
        const { originalWrite, outputText } = (0, src_1.overrideStdOut)();
        (0, src_1.LoggerAdaptToConsole)();
        const rp = require('request-promise');
        try {
            const cheerioAPI = await rp({
                transform: (body) => cheerio.load(body),
                uri: 'https://123.xynon-existante.com',
            });
            console.log(cheerioAPI);
        }
        catch (err) {
            await console.log(err);
        }
        (0, src_1.restoreStdOut)(originalWrite);
        (0, src_1.LoggerRestoreConsole)();
        console.log(outputText[0]);
        (0, chai_1.expect)(JSON.parse(outputText[0]).level).eql("error");
        (0, chai_1.expect)(JSON.parse(outputText[0]).message).eql("  - Error: getaddrinfo ENOTFOUND 123.xynon-existante.com");
        (0, chai_1.expect)(JSON.parse(outputText[0]).errCallStack).contain("123.xynon-existante.com");
    });
});
//# sourceMappingURL=cheerio-error.test.js.map