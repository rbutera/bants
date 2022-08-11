import { Client } from "@notionhq/client";
import type {
  QueryDatabaseResponse,
  UserObjectResponse,
} from "@notionhq/client/build/src/api-endpoints";
import { isNil, reduceRight, isEmpty } from "ramda";

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
  const pages = await Promise.allSettled(pageIds.map(getPage));
  return pages.filter(x => x.status === 'fulfilled').map(x => x.value);
}

export type RawNotionData = {
   readonly database: any, 
   readonly pages: any[], 
   readonly users: Record<string, UserObjectResponse>, 
   readonly games: Record<string, any>,
   readonly properties: Record<string, any>
}

export async function getProperty(page: Record<string, any>, propertyName: string): Promise<any> {
  const page_id = !isNil(page) && !isEmpty(page) ? page.id : undefined
  // console.log(`page_id is "${page_id}"`)
  const property_id = !isNil(page) && !isNil(page.properties) && !isNil(page.properties[propertyName]) ? page.properties[propertyName].id : undefined
  // console.log(`property_id is "${page_id}"`)
  if (page_id && property_id) {
    return notion.pages.properties.retrieve({page_id: page.id, property_id: page.properties[propertyName].id})
  }
  return Promise.reject(`Failed to retrieve property ${propertyName} - please supply valid page id and property id`)
}


export async function mergePageData(page) {
  const property = async (name) => { 
    const result = await getProperty(page, name) 
    // console.debug(`=== ${name}: ===`)
    // console.debug(result)
    return result
  }

  const winnerResponse = await property('Winner(s)')
  const winners = winnerResponse.results

  const game = await property('Game')
  const date = await property('Date')
  const participants = await property('Participants')

  const output = {
    date,
    game,
    winners,
    participants
  }

  return output
  
}

export async function mergeData(raw: RawNotionData) {
  const { 
    database, pages, users, games, properties
  } = raw

  console.log('pages:')
  console.log(pages)

  const settled = await Promise.allSettled(pages.map(mergePageData)).catch(e => console.error(e))
  const merged = settled.filter(x => x.status === 'fulfilled').map(x => x.value)

  return {
    raw,
    merged
  } 
}

export async function getData() {
  console.log('Getting data...')
  const database = await getDatabase();
  const { properties } = database;
  const games = await getGames(database);
  console.log(`games are ${games}`);
  const pages = await getPages();
  const users = await getUsers();
  const merged = await mergeData({
    database, games, pages, users, properties
  })
  console.log('Finished getting data...')

  return merged;
}
