import { cn } from "@/lib/utils";

const Watermark = ({
  email,
  className,
}: {
  email: string;
  className?: string;
}) => {
  return (
    <div
      className={cn(
        "absolute bottom-5 right-5 z-30 opacity-85 w-auto space-y-1 py-2 px-4 sm:px-5 rounded-xl *:text-white bg-gray-950/60 border border-gray-800 select-none",
        className,
      )}
    >
      <p className="text-sm sm:text-[16px] font-medium">{email}</p>
      <p className="text-xs">{new Date().toUTCString()}</p>
    </div>
  );
};

export default Watermark;
