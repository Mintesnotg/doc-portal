export type RAGQueryRequest = {
  question: string;
  category?: string;
  top_k?: number;
};

export type RAGSource = {
  id: string;
  title: string;
  url: string;
};

export type RAGQueryResponse = {
  answer: string;
  sources: RAGSource[];
  contexts: string[];
  confidence?: number;
  timestamp: string;
};
