import { useRouter } from "next/router";

import { useState } from "react";

import { LinkType } from "@prisma/client";

import {
  DEFAULT_LINK_PROPS,
  DEFAULT_LINK_TYPE,
} from "@/components/links/link-sheet";
import { LinkOptionContainer } from "@/components/welcome/containers/link-option-container";
import { UploadContainer } from "@/components/welcome/containers/upload-container";

export default function Upload() {
  const router = useRouter();
  const { groupId } = router.query as {
    id: string;
    groupId?: string;
  };
  const [currentFile, setCurrentFile] = useState<File | null>(null);
  const [currentBlob, setCurrentBlob] = useState<boolean>(false);
  const [currentLinkId, setCurrentLinkId] = useState<string | null>(null);
  const [currentDocId, setCurrentDocId] = useState<string | null>(null);
  const [linkData, setLinkData] = useState<DEFAULT_LINK_TYPE>(
    DEFAULT_LINK_PROPS(LinkType.DOCUMENT_LINK, groupId),
  );

  if (!currentBlob) {
    return (
      <UploadContainer
        currentFile={currentFile}
        setCurrentFile={setCurrentFile}
        setCurrentBlob={setCurrentBlob}
        setCurrentLinkId={setCurrentLinkId}
        setCurrentDocId={setCurrentDocId}
      />
    );
  }

  if (currentBlob) {
    return (
      <LinkOptionContainer
        currentLinkId={currentLinkId}
        currentDocId={currentDocId}
        linkData={linkData}
        setLinkData={setLinkData}
      />
    );
  }
}
