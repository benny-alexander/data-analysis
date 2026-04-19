import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { NextResponse } from "next/server";

// Token handshake for client-upload. The browser hits /api/upload to
// exchange a token for a direct-to-Blob upload URL, then streams the file
// to Vercel Blob without going through our serverless function body
// (Vercel Hobby caps that at ~4.5 MB).
//
// We deliberately don't restrict allowedContentTypes — fitness-tracker
// exports ship as a mix of .zip/.csv/.json/.xml/.fit/.gpx/.tcx that
// browsers report inconsistently (Safari reports .csv as
// application/vnd.ms-excel, .fit/.gpx as octet-stream). Size is the
// real guardrail and is enforced via maximumSizeInBytes.

export const runtime = "nodejs";

const MAX_FILE_BYTES = 500 * 1024 * 1024; // 500 MB per file

export async function POST(request: Request): Promise<NextResponse> {
  const body = (await request.json()) as HandleUploadBody;

  try {
    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (pathname) => {
        return {
          addRandomSuffix: true,
          maximumSizeInBytes: MAX_FILE_BYTES,
          tokenPayload: JSON.stringify({ pathname }),
        };
      },
      onUploadCompleted: async ({ blob }) => {
        console.log("blob upload completed", blob.url);
      },
    });
    return NextResponse.json(jsonResponse);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("handleUpload error:", message);
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
