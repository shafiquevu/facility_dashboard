import { Suspense } from "react";
import { get } from "@/lib/api";
import { access, attempt } from "@/lib/page";
import { NoAccess } from "@/components/no-access";
import { Empty, ErrorState, Loading, PageHeader, Section } from "@/components/kit";

export const metadata = { title: "How-to videos" };

type Video = { id: string; title: string; description: string; minutes: number; url: string };

export default function VideosPage() {
  return (
    <>
      <PageHeader title="How-to videos" description="Short walkthroughs of each part of Facility Maintenance." />
      <Suspense fallback={<Loading rows={6} />}>
        <Content />
      </Suspense>
    </>
  );
}

// Play links are signed for a few hours by hangar; the files stay private.
async function Content() {
  if (!(await access())) return <NoAccess />;
  const result = await attempt(() => get<{ videos: Video[] }>("/console/videos"));
  if (result.error !== null) return <ErrorState message={result.error} />;
  const { videos } = result.data;
  if (!videos.length) {
    return <Section><div className="pt-5"><Empty title="No videos yet">Walkthroughs appear here as they are published.</Empty></div></Section>;
  }
  return (
    <div className="grid gap-4 xl:grid-cols-2">
      {videos.map((v) => (
        <section key={v.id} id={v.id} className="panel scroll-mt-6 p-4">
          <video controls preload="metadata" playsInline className="aspect-video w-full rounded-lg bg-black" src={v.url} />
          <div className="mt-3 flex items-baseline justify-between gap-3">
            <h2 className="text-[15px] font-semibold text-ink">{v.title}</h2>
            <span className="num shrink-0 text-xs text-graphite">{v.minutes} min</span>
          </div>
          <p className="mt-1 text-[13px] text-graphite">{v.description}</p>
        </section>
      ))}
    </div>
  );
}
