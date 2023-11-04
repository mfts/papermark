import { NextApiResponse } from "next";

export function errorhandler(err: unknown, res: NextApiResponse) {
  if (err instanceof TeamError || err instanceof DocumentError) {
    return res.status(err.statusCode).end(err.message);
  } else {
    return res.status(500).json({
      message: "Internal Server Error",
      error: (err as Error).message,
    });
  }
}

export class TeamError extends Error {
  statusCode = 400;
  constructor(public message: string) {
    super(message);
  }
}

export class DocumentError extends Error {
  statusCode = 400;
  constructor(public message: string) {
    super(message);
  }
}
