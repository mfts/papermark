import GenerateIndexDialog from "./generate-index-dialog";

interface GenerateIndexButtonProps {
  teamId: string;
  dataroomId: string;
  disabled?: boolean;
}

export default function GenerateIndexButton({
  teamId,
  dataroomId,
  disabled = false,
}: GenerateIndexButtonProps) {
  return (
    <GenerateIndexDialog
      teamId={teamId}
      dataroomId={dataroomId}
      disabled={disabled}
    />
  );
}
