import { cn } from "@/lib/utils";
import Draggable from "react-draggable";

const Watermark = ({
  email,
  className,
  moveable = true,
}: {
  email: string;
  className?: string;
  moveable?: boolean;
}) => {
  return (
    <Draggable
      bounds={moveable ? "parent" : { bottom: 0, left: 0, right: 0, top: 0 }}
    >
      <div
        className={cn(
          "absolute bottom-5 right-5 z-30 w-auto space-y-1 pb-2 pt-1 px-4 sm:px-5 rounded-xl *:text-white bg-gray-950/60 border border-gray-800 select-none hover:cursor-move hover:scale-105 duration-100",
          className,
        )}
      >
        <p className="text-sm sm:text-[16px] font-medium">{email}</p>
        <p className="text-xs">{new Date().toUTCString()}</p>
      </div>
    </Draggable>
  );
};

export default Watermark;
