export function compareArraysByIdAndTimestamp(arr1: any[], arr2: any[]): boolean {
    if (arr1.length !== arr2.length) return false;

    for (let i = 0; i < arr1.length; i++) {
        const item1 = arr1[i];
        const item2 = arr2[i];
        if (item1?.id !== item2?.id) return false;
        if (item1?.updatedAt !== item2?.updatedAt) return false;
    }

    return true;
}


export function compareDocumentCacheData(cached: any, fresh: any): boolean {
    if (cached === fresh) return true;
    if (!cached || !fresh) return false;

    if (cached.document?.updatedAt !== fresh.document?.updatedAt) return false;
    if (cached.primaryVersion?.updatedAt !== fresh.primaryVersion?.updatedAt) return false;

    // Compare links using array comparison
    if (!compareArraysByIdAndTimestamp(cached.links || [], fresh.links || [])) return false;

    return true;
} 