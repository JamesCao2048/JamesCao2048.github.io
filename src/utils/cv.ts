import { readFileSync } from "node:fs";
import path from "node:path";
import cv from "@/data/cv.json";

function resolveCvPdf(value: unknown): string | null {
  if (value === null) return null;
  if (
    typeof value !== "string" ||
    !/^\/assets\/(?:[A-Za-z0-9_-]+\/)*[A-Za-z0-9][A-Za-z0-9._-]*\.pdf$/.test(
      value
    )
  ) {
    throw new Error("CV pdfPath must be null or a local /assets/...pdf path.");
  }
  const file = path.join(process.cwd(), "public", value);
  const bytes = readFileSync(file);
  if (bytes.subarray(0, 5).toString() !== "%PDF-") {
    throw new Error(`CV pdfPath does not point to a PDF: ${value}`);
  }
  return value;
}

// A CV becomes public only when an approved file is explicitly configured.
export const cvPdfPath = resolveCvPdf(cv.pdfPath);
