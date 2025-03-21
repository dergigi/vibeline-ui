declare module 'compromise' {
  interface NLPResult {
    nouns(): { out(format: 'array'): string[] };
    verbs(): { 
      out(format: 'array'): string[];
      toInfinitive(): { text(): string };
    };
    organizations(): { out(format: 'array'): string[] };
    places(): { out(format: 'array'): string[] };
  }

  function nlp(text: string): NLPResult;
  export = nlp;
} 