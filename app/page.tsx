import { FeedScroller } from "../components/FeedScroller";

// Renders the main TikTok-style feed page for browsing listings.
export default async function Home(props: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = (await props.searchParams) ?? {};
  const raw = sp.highlight;
  const highlightId = Array.isArray(raw) ? raw[0] : raw ?? null;
  return (
    <FeedScroller highlightId={highlightId} />
  );
}
