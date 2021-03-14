(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
    typeof define === 'function' && define.amd ? define(['exports'], factory) :
    (global = typeof globalThis !== 'undefined' ? globalThis : global || self, factory(global.CodeMirrorAgda = {}));
}(this, (function (exports) { 'use strict';

    const floatRegex = /-?(?:0|[1-9]\d*)(?:\.\d+)?(?:[eE][+-]?\d+)?(?=[.;{}()@"\s]|$)/u;
    const integerRegex = /-?(?:0|[1-9]\d*|0x[0-9A-Fa-f]+)(?=[.;{}()@"\s]|$)/u;
    const keywordsRegex = new RegExp("(?:[_=|→:?\\\\λ∀]|->|\\.{2,3}|abstract|codata|coinductive|constructor|" +
        "data|do|eta-equality|field|forall|hiding|import|in|inductive|" +
        "infix|infixl|infixr|instance|let|macro|module|mutual|no-eta-equality|" +
        "open|overlap|pattern|postulate|primitive|private|public|quote|" +
        "quoteContext|quoteGoal|quoteTerm|record|renaming|rewrite|" +
        "syntax|tactic|to|unquote|unquoteDecl|unquoteDef|using|variable|where|with|" +
        'Set(?:\\d+|[₀₁₂₃₄₅₆₇₈₉]+)?)(?=[.;{}()@"\\s]|$)', "u");
    const escapeDec = "0|[1-9]\\d*";
    const escapeHex = "x(?:0|[1-9A-Fa-f][0-9A-Fa-f]*)";
    const escapeCode = "[abtnvf&\\\\'\"]|NUL|SOH|STX|ETX|EOT|ENQ|ACK|BEL|BS|HT|LF|VT|FF|CR|" +
        "SO|SI|DLE|DC[1-4]|NAK|SYN|ETB|CAN|EM|SUB|ESC|FS|GS|RS|US|SP|DEL";
    const escapeChar = new RegExp("\\\\(?:" + escapeDec + "|" + escapeHex + "|" + escapeCode + ")", "u");
    const startState = [
        { regex: /\{-#.*?#-\}/u, token: "meta" },
        { regex: /\{-/u, token: "comment", push: "comment" },
        { regex: /\{!/u, token: "keyword", push: "hole" },
        { regex: /--.*/u, token: "comment" },
        { regex: floatRegex, token: "number" },
        { regex: integerRegex, token: "integer" },
        { regex: /'/u, token: "string", push: "charLit" },
        { regex: /"/u, token: "string", push: "strLit" },
        { regex: keywordsRegex, token: "keyword" },
        { regex: /[^\s.;{}()@"]+\./u, token: "qualifier" },
        { regex: /[^\s.;{}()@"]+/u, token: null },
        { regex: /./u, token: null },
    ];
    const commentState = [
        { regex: /\{-/u, token: "comment", push: "comment" },
        { regex: /-\}/u, token: "comment", pop: true },
        { regex: /./u, token: "comment" },
    ];
    const holeState = [
        { regex: /\{!/u, token: "keyword", push: "hole" },
        { regex: /!\}/u, token: "keyword", pop: true },
        { regex: /./u, token: "comment" },
    ];
    const charLitState = [
        { regex: /'/u, token: "string error", pop: true },
        { regex: /[^'\\]/u, token: "string", next: "charLitEnd" },
        { regex: escapeChar, token: "string", next: "charLitEnd" },
        { regex: /./u, token: "string error" },
    ];
    const charLitEndState = [
        { regex: /'/u, token: "string", pop: true },
        { regex: /./u, token: "string error" },
        { regex: /[^]/u, token: "string error", pop: true },
    ];
    const stringState = [
        { regex: /"/u, token: "string", pop: true },
        { regex: /[^"\\]/u, token: "string" },
        { regex: escapeChar, token: "string" },
        { regex: /./u, token: "string error" },
    ];
    const defineMode = (CodeMirror) => {
        CodeMirror.defineSimpleMode("agda", {
            start: startState,
            comment: commentState,
            hole: holeState,
            charLit: charLitState,
            charLitEnd: charLitEndState,
            strLit: stringState,
        });
        CodeMirror.defineMIME("text/x-agda", "agda");
    };

    const toPairs = (trans) => trans
        .reduce((a, [seq, syms]) => {
        a.push.apply(a, Array.from(syms.replace(/\s/g, "")).map((v) => [seq, v]));
        return a;
    }, [])
        .sort((a, b) => a[0].localeCompare(b[0]));
    const UNICODE_HELPER_PAIRS = toPairs([
        ["ell", "ℓ"],
        ["=n", "≠"],
        ["~", "∼"],
        ["~n", "≁"],
        ["~~", "≈"],
        ["~~n", "≉"],
        ["~-", "≃"],
        ["~-n", "≄"],
        ["-~", "≂"],
        ["~=", "≅"],
        ["~=n", "≇"],
        ["~~-", "≊"],
        ["==", "≡"],
        ["==n", "≢"],
        ["<=", "≤"],
        [">=", "≥"],
        ["<=n", "≰"],
        [">=n", "≱"],
        ["le", "≤"],
        ["ge", "≥"],
        ["len", "≰"],
        ["gen", "≱"],
        ["<n", "≮"],
        [">n", "≯"],
        ["<~", "≲"],
        [">~", "≳"],
        ["sub", "⊂"],
        ["sup", "⊃"],
        ["subn", "⊄"],
        ["supn", "⊅"],
        ["sub=", "⊆"],
        ["sup=", "⊇"],
        ["sub=n", "⊈"],
        ["sup=n", "⊉"],
        ["in", "∈"],
        ["inn", "∉"],
        ["ni", "∋"],
        ["nin", "∌"],
        ["and", "∧"],
        ["or", "∨"],
        ["And", "⋀"],
        ["Or", "⋁"],
        ["glb", "⊓"],
        ["lub", "⊔"],
        ["|-", "⊢"],
        ["vdash", "⊢"],
        ["|", "∣"],
        ["|n", "∤"],
        ["||", "∥"],
        ["||n", "∦"],
        ["all", "∀"],
        ["ex", "∃"],
        ["exn", "∄"],
        ["0", "∅"],
        ["C", "∁"],
        ["cuL", "⌈"],
        ["cuR", "⌉"],
        ["clL", "⌊"],
        ["clR", "⌋"],
        ["qed", "∎"],
        ["x", "×"],
        ["o", "∘"],
        ["comp", "∘"],
        [".", "∙"],
        ["*", "⋆"],
        ["::", "∷"],
        ["inf", "∞"],
        ["top", "⊤"],
        ["bot", "⊥"],
        ["neg", "¬"],
        ["l-", "←"],
        ["<-", "←"],
        ["l=", "⇐"],
        ["r-", "→"],
        ["->", "→"],
        ["r=", "⇒"],
        ["=>", "⇒"],
        ["lr-", "↔"],
        ["<->", "↔"],
        ["<=>", "⇔"],
        ["l-r-", "⇆"],
        ["r-|", "↦"],
        ["mapsto", "↦"],
        ["...", "⋯⋮⋰⋱"],
        ["bC", "ℂ"],
        ["bH", "ℍ"],
        ["bN", "ℕ"],
        ["bP", "ℙ"],
        ["bQ", "ℚ"],
        ["bR", "ℝ"],
        ["bZ", "ℤ"],
        ["[[", "⟦"],
        ["]]", "⟧"],
        ["<", "⟨"],
        [">", "⟩"],
        ["<<", "⟪"],
        [">>", "⟫"],
        ["{{", "⦃"],
        ["}}", "⦄"],
        ["'", "′″‴⁗"],
        ["'1", "′"],
        ["`", "‵‶‷"],
        ["b", "♭"],
        ["#", "♯"],
        ["\\", "\\"],
        ["Ga", "α"], ["GA", "Α"],
        ["Gb", "β"], ["GB", "Β"],
        ["Gg", "γ"], ["GG", "Γ"],
        ["Gd", "δ"], ["GD", "Δ"],
        ["Ge", "ε"], ["GE", "Ε"],
        ["Gz", "ζ"], ["GZ", "Ζ"],
        ["eta", "η"],
        ["Gth", "θ"], ["GTH", "Θ"],
        ["Gi", "ι"], ["GI", "Ι"],
        ["Gk", "κ"], ["GK", "Κ"],
        ["Gl", "λ"], ["GL", "Λ"], ["Gl-", "ƛ"],
        ["Gm", "μ"], ["GM", "Μ"],
        ["Gn", "ν"], ["GN", "Ν"],
        ["pi", "π"], ["Pi", "Π"],
        ["Gx", "ξ"], ["GX", "Ξ"],
        ["Gr", "ρ"], ["GR", "Ρ"],
        ["Gs", "σ"], ["GS", "Σ"],
        ["Gt", "τ"], ["GT", "Τ"],
        ["Gu", "υ"], ["GU", "Υ"],
        ["Gf", "φ"], ["GF", "Φ"],
        ["Gc", "χ"], ["GC", "Χ"],
        ["Gp", "ψ"], ["GP", "Ψ"],
        ["Go", "ω"], ["GO", "Ω"],
        ["_0", "₀"], ["_1", "₁"], ["_2", "₂"], ["_3", "₃"], ["_4", "₄"],
        ["_5", "₅"], ["_6", "₆"], ["_7", "₇"], ["_8", "₈"], ["_9", "₉"],
        ["_a", "ₐ"], ["_e", "ₑ"], ["_h", "ₕ"], ["_i", "ᵢ"], ["_j", "ⱼ"],
        ["_k", "ₖ"], ["_l", "ₗ"], ["_m", "ₘ"], ["_n", "ₙ"], ["_o", "ₒ"],
        ["_p", "ₚ"], ["_r", "ᵣ"], ["_s", "ₛ"], ["_t", "ₜ"], ["_u", "ᵤ"],
        ["_x", "ₓ"],
        ["^0", "⁰"], ["^1", "¹"], ["^2", "²"], ["^3", "³"], ["^4", "⁴"],
        ["^5", "⁵"], ["^6", "⁶"], ["^7", "⁷"], ["^8", "⁸"], ["^9", "⁹"],
        ["^a", "ᵃ"], ["^b", "ᵇ"], ["^c", "ᶜ"], ["^d", "ᵈ"], ["^e", "ᵉ"],
        ["^f", "ᶠ"], ["^g", "ᵍ"], ["^h", "ʰ"], ["^i", "ⁱ"], ["^j", "ʲ"],
        ["^k", "ᵏ"], ["^l", "ˡ"], ["^m", "ᵐ"], ["^n", "ⁿ"], ["^o", "ᵒ"],
        ["^p", "ᵖ"], ["^r", "ʳ"], ["^s", "ˢ"], ["^t", "ᵗ"], ["^u", "ᵘ"],
        ["^v", "ᵛ"], ["^w", "ʷ"], ["^x", "ˣ"], ["^y", "ʸ"], ["^z", "ᶻ"],
        ["^A", "ᴬ"], ["^B", "ᴮ"], ["^D", "ᴰ"], ["^E", "ᴱ"], ["^G", "ᴳ"],
        ["^H", "ᴴ"], ["^I", "ᴵ"], ["^J", "ᴶ"], ["^K", "ᴷ"], ["^L", "ᴸ"],
        ["^M", "ᴹ"], ["^N", "ᴺ"], ["^O", "ᴼ"], ["^P", "ᴾ"], ["^R", "ᴿ"],
        ["^T", "ᵀ"], ["^U", "ᵁ"], ["^V", "ⱽ"], ["^W", "ᵂ"],
    ]);

    exports.UNICODE_HELPER_PAIRS = UNICODE_HELPER_PAIRS;
    exports.defineMode = defineMode;

    Object.defineProperty(exports, '__esModule', { value: true });

})));