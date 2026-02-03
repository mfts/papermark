import { useState } from "react";

import { DownloadIcon } from "lucide-react";

import { DownloadProgressModal } from "@/components/datarooms/download-progress-modal";
import { ResponsiveButton } from "@/components/ui/responsive-button";

export default function DownloadDataroomButton({
  teamId,
  dataroomId,
  dataroomName,
}: {
  teamId: string;
  dataroomId: string;
  dataroomName?: string;
}) {
  const [showDownloadModal, setShowDownloadModal] = useState(false);

  const openDownloadModal = () => {
    // Open the modal - it will show existing downloads and allow starting new ones
    setShowDownloadModal(true);
  };

  const handleCloseDownloadModal = () => {
    setShowDownloadModal(false);
  };

  return (
    <>
      <ResponsiveButton
        icon={<DownloadIcon className="h-4 w-4" />}
        text="Download"
        onClick={openDownloadModal}
        variant="outline"
        size="sm"
      />

      {/* Download Progress Modal */}
      <DownloadProgressModal
        isOpen={showDownloadModal}
        onClose={handleCloseDownloadModal}
        jobId={null}
        dataroomName={dataroomName}
        teamId={teamId}
        dataroomId={dataroomId}
      />
    </>
  );
}
