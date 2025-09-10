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

