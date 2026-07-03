import { VocabSourceDefinition } from "../models";

export const vocabSourceRegistry: VocabSourceDefinition[] = [
  {
    id: "HSK_3_0",
    label: "HSK 3.0",
    role: "backbone",
    permissionSource: true,
    description: "Official HSK 3.0 vocabulary provides the controlled backbone and early-tier permission source."
  },
  {
    id: "MOVIE_FREQUENCY",
    label: "Movie frequency",
    role: "spoken-priority",
    permissionSource: false,
    description: "Movie/dialogue frequency ranks spoken usefulness for CI sentence and shadowing priority."
  },
  {
    id: "BOOK_FREQUENCY",
    label: "Book frequency",
    role: "reading-priority",
    permissionSource: false,
    description: "Book frequency ranks reading usefulness for article and longer passage priority."
  },
  {
    id: "BLCU_FREQUENCY",
    label: "BLCU/Beijing frequency",
    role: "supporting-rank",
    permissionSource: false,
    description: "BLCU/Beijing frequency remains supporting rank metadata, not the only expansion signal."
  }
];
