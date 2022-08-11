import type { LoaderArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { getData } from "~/models/notion.server";

export async function loader({ request }: LoaderArgs) {
  const stats = await getData();
  return json({ stats });
}

function Category({ title, children }) {
  return (
    <section className="my-6">
      <h2 className="mt-2 font-bold text-lg">{title}</h2>
      {children}
    </section>
  );
}

const fakeWinner = {
  name: "John Doe",
};

function SingleUserCategory({ title, winner, total }) {
  return (
    <Category title={title}>
      <p>
        {winner.name} - <span className="font-mono">{total}</span>
      </p>
    </Category>
  );
}

export function MatchHistory({merged}) {
  console.log(merged)

  return (
    <Category title="Match History">
      <ul className="my-4">
        <li>Foobar</li>
      </ul>
    </Category>
  )
}

export default function Index() {
  const data = useLoaderData<typeof loader>();
  return (
    // <main className="relative min-h-screen bg-white sm:flex sm:items-center sm:justify-center">
    <main className="relative min-h-screen bg-purple-900 text-white font-inter">
      <div className="relative sm:pb-16 sm:pt-8">
        <div className="mx-auto max-w-7xl sm:px-6 lg:px-8">
          <h1 className="mt-8 mb-16 font-bold text-4xl">LexStep Leaderboard</h1>
          <Category title="Win Rate">
            <p>Coming soon....</p>
          </Category>
          <SingleUserCategory
            title="Most Wins"
            winner={fakeWinner}
            total={420}
          ></SingleUserCategory>
          <MatchHistory merged={data.stats.merged}/>
        </div>
      </div>
    </main>
  );
}
