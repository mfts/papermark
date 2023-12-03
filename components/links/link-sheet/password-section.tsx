import { Dispatch, SetStateAction, useEffect, useState } from "react";
import { Switch } from "@/components/ui/switch";
import { motion } from "framer-motion";
import { FADE_IN_ANIMATION_SETTINGS } from "@/lib/constants";
import Eye from "@/components/shared/icons/eye";
import EyeOff from "@/components/shared/icons/eye-off";
import { cn } from "@/lib/utils";
import { DEFAULT_LINK_TYPE } from ".";

export default function PasswordSection({
  data,
  setData,
}: {
  data: DEFAULT_LINK_TYPE;
  setData: Dispatch<SetStateAction<DEFAULT_LINK_TYPE>>;
}) {
  const { password } = data;
  const [enabled, setEnabled] = useState<boolean>(false);
  const [showPassword, setShowPassword] = useState<boolean>(false);

  useEffect(() => {
    setEnabled(!!password);
  }, [password]);

  const handleEnablePassword = () => {
    if (enabled) {
      // if password protection is currently enabled and we're toggling it off
      setData({ ...data, password: null });
    }
    setEnabled(!enabled);
  };

  return (
    <div className="pb-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center justify-between space-x-2">
          <h2
            className={cn(
              "text-sm font-medium leading-6",
              enabled ? "text-foreground" : "text-muted-foreground",
            )}
          >
            Require password to view
          </h2>
        </div>
        <Switch checked={enabled} onCheckedChange={handleEnablePassword} />
      </div>
      {enabled && (
        <motion.div
          className="relative mt-4 rounded-md shadow-sm"
          {...FADE_IN_ANIMATION_SETTINGS}
        >
          <input
            name="password"
            id="password"
            type={showPassword ? "text" : "password"}
            className="flex w-full rounded-md border-0 py-1.5 text-foreground bg-background shadow-sm ring-1 ring-inset ring-input placeholder:text-muted-foreground focus:ring-2 focus:ring-inset focus:ring-gray-400 sm:text-sm sm:leading-6"
            value={password || ""}
            placeholder="Enter password"
            onChange={(e) => {
              setData({ ...data, password: e.target.value });
            }}
            aria-invalid="true"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute inset-y-0 right-0 flex items-center pr-3"
          >
            {showPassword ? (
              <Eye
                className="h-4 w-4 text-muted-foreground"
                aria-hidden="true"
              />
            ) : (
              <EyeOff
                className="h-4 w-4 text-muted-foreground"
                aria-hidden="true"
              />
            )}
          </button>
        </motion.div>
      )}
    </div>
  );
}
