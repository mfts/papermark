import { Dispatch, SetStateAction, useState } from "react";
import { Switch } from "@/components/ui/switch";
import { motion } from "framer-motion";
import { Link } from "@prisma/client";
import { FADE_IN_ANIMATION_SETTINGS } from "@/lib/contants";
import Eye from "@/components/shared/icons/eye"
import { cn } from "@/lib/utils";



export default function PasswordSection({data, setData}: {data: Link, setData: Dispatch<SetStateAction<Link>>}) {
  const { password } = data;
  const [enabled, setEnabled] = useState(!!password);
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="pb-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center justify-between space-x-2">
          <h2 className={cn("text-sm font-medium leading-6", enabled ? "text-white" : "text-gray-400")}>
            Password Protection
          </h2>
        </div>
        <Switch
          checked={enabled}
          onCheckedChange={(checked) => setEnabled(!enabled)}
        />
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
            className="flex w-full rounded-md border-0 py-1.5 text-white bg-black shadow-sm ring-1 ring-inset ring-gray-600 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-gray-300 sm:text-sm sm:leading-6"
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
              <Eye className="h-4 w-4 text-gray-400" aria-hidden="true" />
            ) : (
              <Eye className="h-4 w-4 text-gray-400" aria-hidden="true" />
            )}
          </button>
        </motion.div>
      )}
    </div>
  );
}