import {
  ArchiveIcon,
  AwardIcon,
  BellIcon,
  BookIcon,
  BookmarkIcon,
  BoxIcon,
  BriefcaseIcon,
  CloudIcon,
  FileIcon,
  FlagIcon,
  FlameIcon,
  FolderIcon,
  FolderOpenIcon,
  GlobeIcon,
  HashIcon,
  HeartIcon,
  HomeIcon,
  ImageIcon,
  LayersIcon,
  LightbulbIcon,
  LockIcon,
  MailIcon,
  MusicIcon,
  PaletteIcon,
  PenToolIcon,
  SettingsIcon,
  ShieldIcon,
  SparklesIcon,
  StarIcon,
  SunIcon,
  TagIcon,
  UsersIcon,
  VideoIcon,
  WrenchIcon,
  ZapIcon,
} from "lucide-react";

// Folder icon definitions
export const FOLDER_ICONS = [
  { id: "folder", icon: FolderIcon, label: "Folder" },
  { id: "folder-open", icon: FolderOpenIcon, label: "Folder Open" },
  { id: "briefcase", icon: BriefcaseIcon, label: "Briefcase" },
  { id: "archive", icon: ArchiveIcon, label: "Archive" },
  { id: "box", icon: BoxIcon, label: "Box" },
  { id: "file", icon: FileIcon, label: "File" },
  { id: "book", icon: BookIcon, label: "Book" },
  { id: "bookmark", icon: BookmarkIcon, label: "Bookmark" },
  { id: "star", icon: StarIcon, label: "Star" },
  { id: "heart", icon: HeartIcon, label: "Heart" },
  { id: "lock", icon: LockIcon, label: "Lock" },
  { id: "shield", icon: ShieldIcon, label: "Shield" },
  { id: "users", icon: UsersIcon, label: "Users" },
  { id: "settings", icon: SettingsIcon, label: "Settings" },
  { id: "tag", icon: TagIcon, label: "Tag" },
  { id: "layers", icon: LayersIcon, label: "Layers" },
  { id: "globe", icon: GlobeIcon, label: "Globe" },
  { id: "home", icon: HomeIcon, label: "Home" },
  { id: "mail", icon: MailIcon, label: "Mail" },
  { id: "image", icon: ImageIcon, label: "Image" },
  { id: "video", icon: VideoIcon, label: "Video" },
  { id: "music", icon: MusicIcon, label: "Music" },
  { id: "palette", icon: PaletteIcon, label: "Palette" },
  { id: "pen-tool", icon: PenToolIcon, label: "Design" },
  { id: "lightbulb", icon: LightbulbIcon, label: "Ideas" },
  { id: "zap", icon: ZapIcon, label: "Quick" },
  { id: "wrench", icon: WrenchIcon, label: "Tools" },
  { id: "sparkles", icon: SparklesIcon, label: "Sparkles" },
  { id: "cloud", icon: CloudIcon, label: "Cloud" },
  { id: "flag", icon: FlagIcon, label: "Flag" },
  { id: "award", icon: AwardIcon, label: "Award" },
  { id: "flame", icon: FlameIcon, label: "Fire" },
  { id: "bell", icon: BellIcon, label: "Bell" },
  { id: "sun", icon: SunIcon, label: "Sun" },
  { id: "hash", icon: HashIcon, label: "Hashtag" },
] as const;

export type FolderIconId = (typeof FOLDER_ICONS)[number]["id"];

// Folder color palette (using similar colors to tags but with folder-specific styling)
export const FOLDER_COLORS = [
  {
    id: "gray",
    label: "Gray",
    text: "text-gray-600",
    bg: "bg-gray-100",
    border: "border-gray-300",
    iconClass: "text-gray-600 dark:text-gray-400",
  },
  {
    id: "red",
    label: "Red",
    text: "text-red-600",
    bg: "bg-red-100",
    border: "border-red-300",
    iconClass: "text-red-500 dark:text-red-400",
  },
  {
    id: "orange",
    label: "Orange",
    text: "text-orange-600",
    bg: "bg-orange-100",
    border: "border-orange-300",
    iconClass: "text-orange-500 dark:text-orange-400",
  },
  {
    id: "yellow",
    label: "Yellow",
    text: "text-yellow-600",
    bg: "bg-yellow-100",
    border: "border-yellow-300",
    iconClass: "text-yellow-500 dark:text-yellow-400",
  },
  {
    id: "green",
    label: "Green",
    text: "text-emerald-600",
    bg: "bg-emerald-100",
    border: "border-emerald-300",
    iconClass: "text-emerald-500 dark:text-emerald-400",
  },
  {
    id: "blue",
    label: "Blue",
    text: "text-blue-600",
    bg: "bg-blue-100",
    border: "border-blue-300",
    iconClass: "text-blue-500 dark:text-blue-400",
  },
  {
    id: "black",
    label: "Black",
    text: "text-neutral-900",
    bg: "bg-neutral-100",
    border: "border-neutral-300",
    iconClass: "text-neutral-700 dark:text-neutral-400",
  },
] as const;

export type FolderColorId = (typeof FOLDER_COLORS)[number]["id"];

// Allowed values for server-side validation
export const ALLOWED_FOLDER_ICONS = FOLDER_ICONS.map((icon) => icon.id);
export const ALLOWED_FOLDER_COLORS = FOLDER_COLORS.map((color) => color.id);

// Default values
export const DEFAULT_FOLDER_ICON: FolderIconId = "folder";
export const DEFAULT_FOLDER_COLOR: FolderColorId = "gray";

// Helper to get icon component by ID
export function getFolderIcon(iconId: string | null | undefined) {
  const foundIcon = FOLDER_ICONS.find((icon) => icon.id === iconId);
  return foundIcon?.icon ?? FolderIcon;
}

// Helper to get color classes by ID
export function getFolderColorClasses(colorId: string | null | undefined) {
  const foundColor = FOLDER_COLORS.find((color) => color.id === colorId);
  return foundColor ?? FOLDER_COLORS[0]; // Default to gray
}
