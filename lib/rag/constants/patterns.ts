export const QUERY_PATTERNS = {
    complexity: {
        high: [
            'compare', 'difference', 'similar', 'versus', 'vs', 'between',
            'analyze', 'analysis', 'why', 'how does', 'what causes',
            'relationship', 'correlation', 'impact', 'effect', 'consequence',
            'implication', 'interpret', 'evaluate', 'assess', 'examine',
            'investigate', 'explore', 'determine', 'identify', 'classify',
            'categorize', 'summarize', 'synthesize', 'integrate', 'combine'
        ],
        medium: [
            'what is', 'who is', 'when', 'where', 'which', 'how much', 'how many',
            'what are', 'define', 'explain', 'describe', 'tell me about',
            'find', 'locate', 'search', 'discover', 'reveal', 'show',
            'provide', 'give', 'list', 'enumerate', 'count', 'calculate'
        ]
    },
    conversational: [
        'hello', 'hi', 'hey', 'good morning', 'good afternoon', 'good evening',
        'how are you', 'thanks', 'thank you', 'bye', 'goodbye', 'see you',
        'nice to meet you', 'pleasure', 'welcome', 'good day', 'how\'s it going',
        'have a good day', 'good night', 'take care', 'see you later'
    ]
} as const;

export const COMPLEXITY_REGEX_PATTERNS = {
    comparative: /\b(compare|difference|similar|versus|vs|contrast)\b/i,
    logical: /\b(and|or|but|however|although|nevertheless|furthermore)\b/i,
    conditional: /\b(if|when|unless|provided|subject to|in case)\b/i,
    structural: /\b(section|chapter|paragraph|article|clause|subsection)\b/i,
    question: /\b(how|what|why|when|where|which|explain|describe)\b/i,
    process: /\b(step|process|procedure|method|workflow|pipeline)\b/i,
    temporal: /\b(before|after|within|during|until|since|while)\b/i,
    technical: /\b(install|setup|configure|compile|build|deploy|implement)\b/i,
    problem: /\b(error|problem|issue|troubleshoot|debug|fix|resolve)\b/i,
    instructional: /\b(example|sample|tutorial|guide|instruction|manual)\b/i,
    analytical: /\b(analyze|evaluate|assess|examine|investigate|review)\b/i,
    quantitative: /\b(calculate|compute|measure|quantify|estimate|determine)\b/i
} as const;

export const XSS_PATTERNS = {
    scriptTags: /<script[^>]*>[\s\S]*?<\/script>/gi,
    eventHandlers: /on\w+\s*=\s*["'][^"']*["']/gi,
    eventHandlersAlt: /on\w+\s*=\s*[^>\s]+/gi,
    protocols: /javascript:|vbscript:|data:|file:/gi,
    dangerousElements: /<(iframe|object|embed|form|input|textarea|select|button)[^>]*>/gi,
    htmlComments: /<!--[\s\S]*?-->/g,
    nullBytes: /\0/g
} as const;
