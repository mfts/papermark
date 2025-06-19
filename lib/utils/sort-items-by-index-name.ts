export const sortItemsByIndexAndName = <
  T extends {
    orderIndex: number | null;
    document: { name: string };
  },
>(
  items: T[],
): T[] => {
  // Sort documents by orderIndex or name considering the numerical part
  return items.sort((a, b) => {
    // First, compare by orderIndex if both items have it
    if (a.orderIndex && b.orderIndex) {
      if (a.orderIndex !== b.orderIndex) {
        return a.orderIndex - b.orderIndex;
      }
    }

    // If orderIndex is not available or equal, use name-based sorting
    const numA = getNumber(a.document.name);
    const numB = getNumber(b.document.name);
    if (numA !== numB) {
      return numA - numB;
    }
    // If numerical parts are the same, fall back to lexicographical order
    return a.document.name.localeCompare(b.document.name);
  });
};

export const sortByIndexThenName = <
  T extends {
    orderIndex: number | null;
    name?: string;
    document?: { name: string };
  },
>(
  items: T[],
): T[] => {
  return items.sort((a, b) => {
    if (a.orderIndex !== null && b.orderIndex !== null) {
      if (a.orderIndex !== b.orderIndex) {
        return a.orderIndex - b.orderIndex;
      }
    }
    if (a.orderIndex !== null && b.orderIndex === null) {
      return -1;
    }
    if (a.orderIndex === null && b.orderIndex !== null) {
      return 1;
    }
    const nameA = a.name || a.document?.name || "";
    const nameB = b.name || b.document?.name || "";
    return nameA.localeCompare(nameB);
  });
};

// Helper function to extract the numerical part of a string
const getNumber = (str: string): number => {
  const match = str.match(/^\d+/);
  return match ? parseInt(match[0], 10) : 0;
};
