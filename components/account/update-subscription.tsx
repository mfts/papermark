import { useOptimisticUpdate } from "../hooks/use-optimistic-update";
import { Switch } from "../ui/switch";

// TODO: MAIL SUBSCRIPTION FOR LATER USE
export const UpdateMailSubscribe = () => {
  const { data, isLoading, update } = useOptimisticUpdate<{
    subscribed: boolean;
  }>("/api/user/subscribe", {
    loading: "Updating email preferences...",
    success: `Your ${process.env.NEXT_PUBLIC_BASE_URL} email preferences has been updated!`,
    error: "Failed to update email preferences. Please try again.",
  });

  const subscribe = async (checked: boolean) => {
    const method = checked ? "POST" : "DELETE";
    const res = await fetch("/api/user/subscribe", {
      method,
    });
    if (!res.ok) {
      throw new Error("Failed to update email preferences");
    }
    return { subscribed: checked };
  };

  return (
    <div className="flex items-center gap-x-2">
      <Switch
        checked={data?.subscribed}
        onCheckedChange={(checked: boolean) => {
          update(() => subscribe(checked), { subscribed: checked });
        }}
      />
      <p className="text-sm text-muted-foreground transition-colors">
        Subscribed to product updates
      </p>
    </div>
  );
};

export default UpdateMailSubscribe;
