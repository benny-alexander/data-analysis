import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { NextResponse } from "next/server";

/**
 * Generates a client-upload token so the browser can upload files
 * directly to Vercel Blob, bypassing the 4.5MB serverless body limit.
 *
 * See: https://vercel.com/docs/storage/vercel-blob/client-upload
 */
export async function POST(request: Request): Promise<NextResponse> {
  const body = (await request.json()) as HandleUploadBody;

  try {
    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (pathname) => {
        // Basic guard: only allow uploads under /submissions/
        if (!pathname.startsWith("submissions/")) {
          throw new Error("Invalid upload path");
        }

        return {
          allowedContentTypes: [
            "application/zip",
            "application/x-zip-compressed",
            "application/json",
            "application/xml",
            "text/xml",
            "text/csv",
            "text/tab-separated-values",
            "application/octet-stream",
            "application/gpx+xml",
            "application/vnd.ant.fit",
          ],
          maximumSizeInBytes: 500 * 1024 * 1024, // 500 MB
          addRandomSuffix: true,
          tokenPayload: JSON.stringify({ pathname }),
        };
      },
      onUploadCompleted: async ({ blob }) => {
        // We don't notify here — the client POSTs /api/submit after upload
        // with all the form metadata; that's where the email goes out.
        console.log("Upload completed:", blob.url);
      },
    });

    return NextResponse.json(jsonResponse);
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Upload failed" },
      { status: 400 },
    );
  }
}
