function safeGetTime(date: string | Date | null | undefined): number {
    if (!date) return 0;

    try {
        const dateObj = typeof date === 'string' ? new Date(date) : date;
        const time = dateObj.getTime();
        return isNaN(time) ? 0 : time;
    } catch {
        return 0;
    }
}

export function getDataroomLastUpdatedAt(dataroom: any): number {
    const documentsLastUpdated =
        dataroom.documents && dataroom.documents.length > 0
            ? dataroom.documents.reduce((max: number, doc: any) => {
                if (doc.document?.versions && doc.document.versions.length > 0) {
                    const versionTime = safeGetTime(doc.document.versions[0].updatedAt);
                    return Math.max(max, versionTime);
                }
                return max;
            }, 0)
            : 0;

    const foldersLastUpdated =
        dataroom.folders && dataroom.folders.length > 0
            ? dataroom.folders.reduce((max: number, folder: any) => {
                const folderTime = safeGetTime(folder.updatedAt);
                return Math.max(max, folderTime);
            }, 0)
            : 0;

    if (documentsLastUpdated > 0 || foldersLastUpdated > 0) {
        return Math.max(documentsLastUpdated, foldersLastUpdated);
    }

    // Fallback to dataroom creation time or current time
    const dataroomCreatedTime = safeGetTime(dataroom.createdAt);
    return dataroomCreatedTime > 0 ? dataroomCreatedTime : Date.now();
} 