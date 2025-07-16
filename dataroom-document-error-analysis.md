# Dataroom Document Error Analysis and Fix

## Issue Description
Users are experiencing a "Dataroom not found" error when trying to access documents in a dataroom, even though the dataroom exists. This error appears when clicking on documents within the dataroom interface.

## Root Cause Analysis

### Problem Location
The issue is in the `fetchDataroomDocumentLinkData` function in `lib/api/links/link-data.ts` (lines 220-331).

### Technical Details

1. **Function Purpose**: This function fetches data for a specific document within a dataroom when accessing URLs like `/view/[linkId]/d/[documentId]`.

2. **Query Logic**: The function performs a Prisma query that:
   - Finds the link with the given `linkId` and `teamId`
   - Filters the dataroom documents with `where: { id: dataroomDocumentId }`
   - Returns the dataroom with its filtered documents

3. **The Bug**: The error check was insufficient:
   ```typescript
   if (!linkData?.dataroom) {
     throw new Error("Dataroom not found");
   }
   ```
   
   This only checked if the dataroom exists, but not if the specific document exists within that dataroom.

4. **What Happens**: When a document doesn't exist in the dataroom:
   - `linkData.dataroom` exists (so passes the check)
   - `linkData.dataroom.documents` is an empty array
   - The API endpoint tries to access `linkData.dataroom.documents[0]` which returns `undefined`
   - Frontend shows "Dataroom not found" error (misleading message)

## Scenarios That Cause This Error

1. **Document Removed**: Document was removed from the dataroom but the link still exists
2. **Document ID Mismatch**: The `dataroomDocumentId` in the URL doesn't match any document in the dataroom
3. **Permission Issues**: Document exists but user doesn't have permission to view it (in group-restricted links)
4. **Database Inconsistency**: Document exists in database but relationship is broken

## Fix Applied

Added a proper check for document existence in the `fetchDataroomDocumentLinkData` function:

```typescript
// Check if the specific document exists in the dataroom
if (!linkData.dataroom.documents || linkData.dataroom.documents.length === 0) {
  throw new Error("Document not found in dataroom");
}
```

This fix:
- Provides a more accurate error message
- Prevents the frontend from receiving `undefined` document data
- Helps with debugging by distinguishing between "dataroom not found" and "document not found"

## Files Modified

- `lib/api/links/link-data.ts` - Added proper document existence check

## API Endpoints Affected

- `GET /api/links/[id]/documents/[documentId]` - Used for document view pages
- `GET /api/links/domains/[domain]/[slug]/documents/[documentId]` - Used for custom domain document pages

## Frontend Components Affected

- `pages/view/[linkId]/d/[documentId].tsx` - Main document view page
- `pages/view/domains/[domain]/[slug]/d/[documentId].tsx` - Custom domain document view
- `components/view/dataroom/document-card.tsx` - Document cards in dataroom view

## Testing Recommendations

1. **Test Document Removal**: Remove a document from a dataroom and verify the error message
2. **Test Invalid Document IDs**: Access a document with an invalid ID and verify proper error handling
3. **Test Permission Groups**: Verify documents not accessible to specific groups show appropriate errors
4. **Test Custom Domains**: Ensure the fix works for both regular and custom domain URLs

## Prevention Measures

To prevent similar issues in the future:

1. **Better Error Messages**: Always provide specific error messages that help identify the exact problem
2. **Comprehensive Validation**: Check for existence of all required resources, not just parent resources
3. **Frontend Error Handling**: Implement proper error boundaries and user-friendly error messages
4. **Logging**: Add detailed logging to help debug issues in production

## Related Code Patterns

The same pattern should be checked in other similar functions:
- `fetchDataroomLinkData` - Main dataroom access
- `fetchDocumentLinkData` - Individual document access
- Other link data fetching functions

This fix improves the user experience by providing clearer error messages and prevents confusion about whether the issue is with the dataroom or the specific document.