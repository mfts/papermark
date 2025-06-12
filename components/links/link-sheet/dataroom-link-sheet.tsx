"use client";

import {
  DataroomLinkSheet as DataroomLinkSheetEE,
  type ItemPermission as ItemPermissionEE,
} from "@/ee/features/permissions/components/dataroom-link-sheet";

export type ItemPermission = ItemPermissionEE;

export function DataroomLinkSheet(props: any) {
  return <DataroomLinkSheetEE {...props} />;
}
