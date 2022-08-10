import { Client } from "@notionhq/client";
import type {
  QueryDatabaseResponse,
  UserObjectResponse,
} from "@notionhq/client/build/src/api-endpoints";
import { isNil, reduceRight } from "ramda";

const notion = new Client({ auth: process.env.NOTION_TOKEN });

const NOTION_API_DOMAIN = "https://api.notion.com";
const NOTION_API_BASE = `${NOTION_API_DOMAIN}/v1`;

export function notionApiUrl(input: string): string {
  return `${NOTION_API_BASE}/${input}`;
}

const NOTION_DATABASE_ID: string = process.env.NOTION_DATABASE_ID ?? "";

// const STATS_DB_URL = notionApiUrl(`/databases/${NOTION_DATABASE_ID}`)
// const STATS_QUERY_URL = `${STATS_DB_URL}/query`

// export function generateFetchOptions () {
//   return {
//     method: 'GET',
//
//   }
// }
// export async function getPage ()

export const NOTION_PAGE_SIZE = 100;
export async function getStatsPageIds(): Promise<any> {
  if (
    !NOTION_DATABASE_ID ||
    isNil(NOTION_DATABASE_ID) ||
    NOTION_DATABASE_ID.length < 2
  ) {
    throw new Error("Missing / malformed Notion Database ID");
  }

  const pages = [];

  let has_more = true;
  let start_cursor;
  do {
    const response: QueryDatabaseResponse = await notion.databases.query({
      database_id: NOTION_DATABASE_ID,
      page_size: NOTION_PAGE_SIZE,
      ...(start_cursor ? { start_cursor } : {}),
    });

    const { next_cursor, page, results } = response;
    // console.log(response);
    start_cursor = next_cursor;
    has_more = response.has_more;
    pages.push(...results);
    console.log(
      `Page ${page}: received ${results.length} entries. New total is ${pages.length}.`
    );
    if (has_more) {
      console.log(
        `Fetching up to ${NOTION_PAGE_SIZE} more using cursor "${next_cursor}"...`
      );
    } else {
      console.log("No more pages to fetch.");
      break;
    }
  } while (has_more);

  return pages.map((page) => page.id);
}

export async function getDatabase(database_id: string = NOTION_DATABASE_ID) {
  return notion.databases.retrieve({ database_id });
}

export const notionIds = {
  winner: "YhkK",
  date: "jrfL",
  participants: "vd%5DH",
  game: "%7DYGA",
};

export function getGames(database) {
  const { options } = database.properties["Game"].select;
  const foo = (value: Record<string, any>, acc = {}) => {
    return {
      ...acc,
      [value.id]: value.name,
    };
  };
  return reduceRight(foo, {}, options);
}

export async function getRow(page: string) {
  return {
    winner: notion.pages.properties.retrieve(),
  };
}

export async function getUsers(): Promise<Record<string, UserObjectResponse>> {
  const { results }: { results: UserObjectResponse[] } =
    //@ts-expect-error
    await notion.users.list();

  const foo = (
    user: UserObjectResponse,
    acc: Record<string, UserObjectResponse>
  ): Record<string, UserObjectResponse> => {
    return {
      ...acc,
      [user.id]: user,
    };
  };
  const users = reduceRight(foo, {}, results);
  return users;
}

export async function getPages(): Promise<any> {
  const pageIds = await getStatsPageIds();
  const getPage = async (page_id: string) => notion.pages.retrieve({ page_id });
  const pages = await Promise.all(pageIds.map(getPage));
  return pages;
}

export async function getProperties({ pages, users }) {}

export async function getData() {
  const database = await getDatabase();
  const { properties } = database;
  const games = await getGames(database);
  console.log(`games are ${games}`);
  const pages = await getPages();
  const users = await getUsers();

  // const properties = await getProperties({ pages, users });
  // console.log(users);
  // console.log(pages[0]);
  console.log(properties);
  return { pages, users };
}
