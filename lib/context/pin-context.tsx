import {
  ReactNode,
  createContext,
  useContext,
  useEffect,
  useReducer,
} from "react";

import { useTeam } from "@/context/team-context";
import { toast } from "sonner";
import useSWR from "swr";

import { fetcher } from "@/lib/utils";

export type PinType =
  | "DOCUMENT"
  | "FOLDER"
  | "DATAROOM"
  | "DATAROOM_DOCUMENT"
  | "DATAROOM_FOLDER";

export interface PinnedItem {
  id?: string;
  pinType: PinType;
  documentId?: string;
  folderId?: string;
  dataroomId?: string;
  dataroomDocumentId?: string;
  dataroomFolderId?: string;
  name: string;
  orderIndex?: number;
  path?: string;
}

interface PinState {
  pinnedItems: PinnedItem[];
  isLoading: boolean;
}

type PinAction =
  | { type: "ADD_PINNED_ITEM"; payload: PinnedItem }
  | { type: "REMOVE_PINNED_ITEM"; payload: string }
  | { type: "REORDER_PINNED_ITEMS"; payload: PinnedItem[] }
  | { type: "LOAD_STATE"; payload: PinState }
  | { type: "SET_LOADING"; payload: boolean };

interface PinContextType extends PinState {
  addPinnedItem: (item: PinnedItem) => Promise<void>;
  removePinnedItem: (id: string) => Promise<void>;
  reorderPinnedItems: (items: PinnedItem[]) => Promise<void>;
  refreshPins: () => Promise<void>;
}

const PinContext = createContext<PinContextType | undefined>(undefined);

function pinReducer(state: PinState, action: PinAction): PinState {
  switch (action.type) {
    case "ADD_PINNED_ITEM":
      return {
        ...state,
        pinnedItems: [...state.pinnedItems, action.payload],
      };
    case "REMOVE_PINNED_ITEM":
      return {
        ...state,
        pinnedItems: state.pinnedItems.filter(
          (item) => item.id !== action.payload,
        ),
      };
    case "REORDER_PINNED_ITEMS":
      return {
        ...state,
        pinnedItems: action.payload,
      };
    case "LOAD_STATE":
      return action.payload;
    case "SET_LOADING":
      return {
        ...state,
        isLoading: action.payload,
      };
    default:
      return state;
  }
}

export function PinProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(pinReducer, {
    pinnedItems: [],
    isLoading: true,
  });

  const { currentTeam } = useTeam();

  // Fetch pins from API
  const { data: pins, mutate } = useSWR<PinnedItem[]>(
    currentTeam ? `/api/teams/${currentTeam.id}/pins` : null,
    fetcher,
  );

  // Load state from API and localStorage based on teamId
  useEffect(() => {
    if (!currentTeam) return;

    const savedState = localStorage.getItem(`papermark-pins-${currentTeam.id}`);
    if (savedState) {
      dispatch({
        type: "LOAD_STATE",
        payload: { ...JSON.parse(savedState), isLoading: true },
      });
    }

    if (pins) {
      dispatch({
        type: "LOAD_STATE",
        payload: { pinnedItems: pins, isLoading: false },
      });
    }
  }, [pins, currentTeam]);

  // Save state to localStorage with teamId whenever it changes
  useEffect(() => {
    if (!state.isLoading && currentTeam) {
      localStorage.setItem(
        `papermark-pins-${currentTeam.id}`,
        JSON.stringify({ pinnedItems: state.pinnedItems }),
      );
    }
  }, [state, currentTeam]);

  const value = {
    ...state,
    addPinnedItem: async (item: PinnedItem) => {
      if (!currentTeam) return;

      // Store the current state for potential rollback
      const previousState = state.pinnedItems;

      // Optimistically update the local state
      dispatch({ type: "ADD_PINNED_ITEM", payload: item });

      try {
        // Make API call
        const response = await fetch(`/api/teams/${currentTeam.id}/pins`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(item),
        });

        if (!response.ok) {
          throw new Error("Failed to add pin");
        }

        // If successful, update with the server response
        const newPin = await response.json();
        await mutate();
      } catch (error) {
        // If failed, rollback to previous state
        dispatch({
          type: "LOAD_STATE",
          payload: { pinnedItems: previousState, isLoading: false },
        });
        toast.error("Failed to pin item");
      }
    },
    removePinnedItem: async (id: string) => {
      if (!currentTeam) return;

      // Store the current state for potential rollback
      const previousState = state.pinnedItems;

      // Optimistically update the local state
      dispatch({ type: "REMOVE_PINNED_ITEM", payload: id });

      try {
        // Make API call
        const response = await fetch(
          `/api/teams/${currentTeam.id}/pins/${id}`,
          {
            method: "DELETE",
          },
        );

        if (!response.ok) {
          throw new Error("Failed to remove pin");
        }

        await mutate();
      } catch (error) {
        // If failed, rollback to previous state
        dispatch({
          type: "LOAD_STATE",
          payload: { pinnedItems: previousState, isLoading: false },
        });
        toast.error("Failed to unpin item");
      }
    },
    reorderPinnedItems: async (items: PinnedItem[]) => {
      if (!currentTeam) return;

      // Store the current state for potential rollback
      const previousState = state.pinnedItems;

      // Optimistically update the local state
      dispatch({ type: "REORDER_PINNED_ITEMS", payload: items });

      try {
        // Make API call
        const response = await fetch(`/api/teams/${currentTeam.id}/pins`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ pins: items }),
        });

        if (!response.ok) {
          throw new Error("Failed to reorder pins");
        }

        await mutate();
      } catch (error) {
        // If failed, rollback to previous state
        dispatch({
          type: "LOAD_STATE",
          payload: { pinnedItems: previousState, isLoading: false },
        });
        toast.error("Failed to reorder pins");
      }
    },
    refreshPins: async () => {
      if (!currentTeam) return;

      try {
        const response = await fetch(`/api/teams/${currentTeam.id}/pins`);
        if (!response.ok) {
          throw new Error("Failed to refresh pins");
        }

        const latestPins = await response.json();
        dispatch({
          type: "LOAD_STATE",
          payload: { pinnedItems: latestPins, isLoading: false },
        });
        localStorage.setItem(
          `papermark-pins-${currentTeam.id}`,
          JSON.stringify({ pinnedItems: latestPins }),
        );
        await mutate(latestPins);
      } catch (error) {
        console.error("Error refreshing pins:", error);
        toast.error("Failed to refresh pins");
      }
    },
  };

  return <PinContext.Provider value={value}>{children}</PinContext.Provider>;
}

export function usePins() {
  const context = useContext(PinContext);
  if (context === undefined) {
    throw new Error("usePins must be used within a PinProvider");
  }
  return context;
}
