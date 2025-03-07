import { useRouter } from "next/router";

import { useState } from "react";

import { LinkType } from "@prisma/client";

import {
  DEFAULT_LINK_PROPS,
  DEFAULT_LINK_TYPE,
} from "@/components/links/link-sheet";

import { LinkOptionContainer } from "./containers/link-option-container";
import { UploadContainer } from "./containers/upload-container";

export default function DataroomUpload({ dataroomId }: { dataroomId: string }) {
  const router = useRouter();
  const { groupId } = router.query as {
    groupId?: string;
  };
  const [currentFile, setCurrentFile] = useState<File | null>(null);
  const [currentBlob, setCurrentBlob] = useState<boolean>(false);
  const [currentLinkId, setCurrentLinkId] = useState<string | null>(null);
  const [linkData, setLinkData] = useState<DEFAULT_LINK_TYPE>(
    DEFAULT_LINK_PROPS(LinkType.DATAROOM_LINK, groupId),
  );

  if (!currentBlob) {
    return (
      <UploadContainer
        currentFile={currentFile}
        setCurrentFile={setCurrentFile}
        setCurrentBlob={setCurrentBlob}
        setCurrentLinkId={setCurrentLinkId}
        dataroomId={dataroomId}
      />
    );
  }

  if (currentBlob) {
    return (
      <LinkOptionContainer
        currentLinkId={currentLinkId}
        linkData={linkData}
        setLinkData={setLinkData}
        currentDataroomId={dataroomId}
      />
    );
  }
}
