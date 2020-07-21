define('ace/mode/javascript-custom', [], function(require, exports, module) {

    var oop = require("ace/lib/oop");
    var TextMode = require("ace/mode/text").Mode;
    var Tokenizer = require("ace/tokenizer").Tokenizer;
    var ExampleHighlightRules = require("ace/mode/example_highlight_rules").ExampleHighlightRules;

    var Mode = function() {
        this.HighlightRules = ExampleHighlightRules;
    };
    oop.inherits(Mode, TextMode);

    (function() {
        this.lineCommentStart = "--";
        this.blockComment = {start: "->", end: "<-"};
    }).call(Mode.prototype);

    exports.Mode = Mode;
});

define('ace/mode/example_highlight_rules', [], function(require, exports, module) {

    var oop = require("ace/lib/oop");
    var TextHighlightRules = require("ace/mode/text_highlight_rules").TextHighlightRules;

    var ExampleHighlightRules = function() {

        this.$rules = {
            "start" : [
                {token : ["comment"], regex : /(#.*$)/},
                {token : ["keyword", "text"], regex : /(^.*)(=)/, next  : "value"},
                {token : ["keyword", "string", "text"], regex : /(^>)(.*:)?(.*$)/},
                {token : ["keyword", "string", "variable.parameter"], regex : /(^~)(.*:)?(.*$)/},
                {token : ["keyword", "string", "keyword"], regex : /(^\[)(choice)(\])/, next  : "choice"},
                {token : ["keyword", "string", "keyword"], regex : /(^\[)(order)(\])/, next  : "order"},
                {token : ["keyword", "string", "keyword"], regex : /(^\[)(fill)(\])/, next  : "fill"},
                {token : ["keyword", "string", "keyword"], regex : /(^\[)(next)(\])/, next  : "next"},
                {token : ["keyword", "string", "keyword"], regex : /(^\[)(pairs)(\])/, next  : "pairs"},
                {token : ["keyword", "string", "keyword", "text"], regex : /(^\[)(click)(\])(.*$)/, next  : "click"},
                {caseInsensitive: true},
                {defaultToken : "invalid"}
            ],
            "value" : [
                {token : "string", regex : /.*$/, next  : "start"},
                {defaultToken : "text"}
            ],
            "sentence" : [
                {token : "string", regex : /.*:/, next  : "start"},
                {defaultToken : "text"}
            ],
            "choice" : [
                {token : ["keyword", "entity.name.function"], regex : /^(\+)(.*$)/},
                {token : "keyword", regex : /^\-/},
                {token : ["keyword", "variable.parameter"], regex : /(^~)(.*$)/},
                //{token : "string", regex : /^\s*$/, next  : "start"},
                {token : "string", regex : /(?=^>)/, next  : "start"},
                {token : "string", regex : /(?=^\[)/, next  : "start"},
                {defaultToken : "text"}
            ],
            "click" : [
                {token : ["string"], regex : /^(.*:)/ },
                {token : ["keyword", "string", "keyword"], regex : /(\[)([^\[\]+-]*)(\])/ },
                {token : ["keyword", "entity.name.function", "keyword"], regex : /(\[)(\+[^\[\]+-]*)(\])/ },
                //{token : "string", regex : /^\s*$/, next  : "start"},
                {token : "string", regex : /(?=^>)/, next  : "start"},
                {token : "string", regex : /(?=^\[)/, next  : "start"},
                {defaultToken : "text"}
            ],
            "order" : [
                {token : ["string", "text"], regex : /(.*:)?(.*$)/, next:"order2"},
                {defaultToken : "invalid"}
            ],
            "order2" : [
                {token : "text", regex : /(.*$)/, next:"order3"},
                {defaultToken : "invalid"}
            ],
            "order3" : [
                {token : "string", regex : /(?=^>)/, next  : "start"},
                {token : "string", regex : /(?=^\[)/, next  : "start"},
                {token : ["word", "keyword"], regex : /([^\/]+)(\/)/, next:"order3"},
                {token : "word", regex : /[^\\]+$/, next:"order4"},
                {defaultToken : "invalid"}
            ],
            "order4" : [
                {token : "string", regex : /(?=^>)/, next  : "start"},
                {token : "string", regex : /(?=^\[)/, next  : "start"},
                {token : ["variable.parameter", "keyword"], regex : /([^\/]+)(\/)/, next:"order4"},
                {token : "variable.parameter", regex : /[^\\]+$/, next:"order5"},
                {defaultToken : "invalid"}
            ],
            "order5" : [
                {token : "string", regex : /(?=^>)/, next  : "start"},
                {token : "string", regex : /(?=^\[)/, next  : "start"},
                {token : ["string", "keyword"], regex : /([^\/]+)(\/)/, next:"order5"},
                {token : ["string", "keyword"], regex : /([^\/]+)($)/, next:"order5"},
                {defaultToken : "invalid"}
            ],

            "fill" : [
                {token : ["string", "text", "keyword", "text"], regex : /(.*:)?([^\*]*)(\*?)(.*$)/, next:"fill2"},
                {defaultToken : "invalid"}
            ],
            "fill2" : [
                {token : ["variable.parameter", "keyword", "variable.parameter"], regex : /^(~[^\*]*)(\*?)(.*$)/, next:"fill2"},
                {token : "text", regex : /([^~].*$)/, next:"fill3"},
                {defaultToken : "invalid"}
            ],
            "fill3" : [
                {token : ["keyword", "entity.name.function"], regex : /(^\+)(.*)/},
                {token : ["keyword", "text"], regex : /(^\-)(.*)/},
                {token : ["keyword", "variable.parameter"], regex : /(^~)(.*)/},
                //{token : "string", regex : /^\s*$/, next  : "start"},
                {token : "string", regex : /(?=^>)/, next  : "start"},
                {token : "string", regex : /(?=^\[)/, next  : "start"},
                {defaultToken : "invalid"}
            ],

            "next" : [
                {token : ["string", "text", "keyword", "text"], regex : /(.*:)?([^\*]*)(\*?)(.*$)/, next:"next2"},
                {defaultToken : "invalid"}
            ],
            "next2" : [
                {token : ["variable.parameter", "keyword", "variable.parameter"], regex : /^(~[^\*]*)(\*?)(.*$)/, next:"fill2"},
                {token : "text", regex : /([^~].*$)/, next:"fill3"},
                {defaultToken : "invalid"}
            ],
            "next3" : [
                {token : ["keyword", "entity.name.function"], regex : /(^\+)(.*)/},
                {token : ["keyword", "text"], regex : /(^\-)(.*)/},
                {token : ["keyword", "variable.parameter"], regex : /(^~)(.*)/},
                //{token : "string", regex : /^\s*$/, next  : "start"},
                {token : "string", regex : /(?=^>)/, next  : "start"},
                {token : "string", regex : /(?=^\[)/, next  : "start"},
                {defaultToken : "invalid"}
            ],

            "pairs" : [
                {token : "text", regex : /(.*$)/, next:"pairs2"},
                {defaultToken : "invalid"}
            ],
            "pairs2" : [
                {token : ["string", "keyword", "text"], regex : /(.*)( - )(.*$)/, next:"pairs2"},
                //{token : "string", regex : /^\s*$/, next  : "start"},
                {token : "string", regex : /(?=^>)/, next  : "start"},
                {token : "string", regex : /(?=^\[)/, next  : "start"},
                {defaultToken : "invalid"}
            ],
        };
        this.normalizeRules()
    };

    oop.inherits(ExampleHighlightRules, TextHighlightRules);

    exports.ExampleHighlightRules = ExampleHighlightRules;
});