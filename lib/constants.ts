export const FADE_IN_ANIMATION_SETTINGS = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
  transition: { duration: 0.2 },
};

export const STAGGER_CHILD_VARIANTS = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, type: "spring" } },
};

export const PAPERMARK_HEADERS = {
  headers: {
    "x-powered-by":
      "Papermark.io - Document sharing infrastructure for the modern web",
  },
};

export const REACTIONS = [
  {
    emoji: "❤️",
    label: "heart",
  },
  {
    emoji: "💸",
    label: "money",
  },
  {
    emoji: "👍",
    label: "up",
  },
  {
    emoji: "👎",
    label: "down",
  },
];

// time in milliseconds
export const ONE_SECOND = 1000;
export const ONE_MINUTE = ONE_SECOND * 60;
export const ONE_HOUR = ONE_MINUTE * 60;
export const ONE_DAY = ONE_HOUR * 24;
export const ONE_WEEK = ONE_DAY * 7;

// growing list of blocked pathnames that lead to 404s
export const BLOCKED_PATHNAMES = [
  "/phpmyadmin",
  "/server-status",
  "/wordpress",
  "/_all_dbs",
  "/wp-json",
];

// list of paths that should be excluded from team checks
export const EXCLUDED_PATHS = [
  "/",
  "/register",
  "/privacy",
  "/oss-friends",
  "/pricing",
  "/docsend-alternatives",
  "/launch-week",
  "/open-source-investors",
  "/investors",
  "/ai",
  "/share-notion-page",
  "/alternatives",
  "/investors",
  "/blog",
  "/view",
  "/join/[teamId]",
];

// free limits
export const LIMITS = {
  views: 20,
};

export const SUPPORTED_DOCUMENT_MIME_TYPES = [
  "application/pdf", // .pdf
  "application/vnd.ms-excel", // .xls
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", // .xlsx
  "text/csv", // .csv
  "application/vnd.oasis.opendocument.spreadsheet", // .ods
  "application/vnd.ms-powerpoint", // .ppt
  "application/vnd.openxmlformats-officedocument.presentationml.presentation", // .pptx
  "application/vnd.oasis.opendocument.presentation", // .odp
  "application/msword", // .doc
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document", // .docx
  "application/vnd.oasis.opendocument.text", // .odt
  "image/vnd.dwg", // .dwg
  "image/vnd.dxf", // .dxf
  "image/png", // .png
  "image/jpeg", // .jpeg
  "image/jpg", // .jpg
];

export const SUPPORTED_DOCUMENT_SIMPLE_TYPES = [
  "pdf",
  "notion",
  "sheet",
  "slides",
  "docs",
  "cad",
  "image",
];
