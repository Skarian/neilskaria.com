import { Client } from '@notionhq/client';

const notion = new Client({
  auth: process.env.NEXT_PUBLIC_NOTION,
});

export const getResources = async () => {
  const response = await notion.databases.query({
    database_id: '6a36d869142340708cd18692d56a512b',
    sorts: [
      {
        property: 'Created',
        direction: 'descending',
      },
    ],
  });
  const urls = response.results.map((entry) => {
    return entry.properties.URL.url;
  });
  return urls;
};
