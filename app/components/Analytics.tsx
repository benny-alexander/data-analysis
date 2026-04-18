"use client";

/**
 * PostHog analytics — loaded client-side, no-ops if the key isn't set.
 *
 * What we get:
 *  - Automatic pageviews on route change
 *  - UTM source/medium/campaign captured on the first pageview
 *  - Session replay so Ben can watch anonymised recordings of real uploads
 *  - Custom events fired from UploadForm (file_added, submit_succeeded, etc.)
 */

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import posthog from "posthog-js";

let initialised = false;

export default function Analytics() {
  const pathname = usePathname();

  // One-time init
  useEffect(() => {
    if (initialised) return;
    if (typeof window === "undefined") return;

    const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
    if (!key) return;

    posthog.init(key, {
      api_host:
        process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://us.i.posthog.com",
      // We fire pageviews manually (below) so App Router navigations count.
      capture_pageview: false,
      capture_pageleave: true,
      // Only create PostHog "person" profiles once we've identified someone
      // (i.e. after they submit). Keeps anonymous traffic cheap.
      person_profiles: "identified_only",
      // Session replay settings
      session_recording: {
        maskAllInputs: true, // don't record what people type — email, goal, etc.
      },
    });

    initialised = true;
  }, []);

  // Pageview on every route change
  useEffect(() => {
    if (!initialised) return;
    posthog.capture("$pageview", {
      $current_url: window.location.href,
    });
  }, [pathname]);

  return null;
}
