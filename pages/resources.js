import { m as motion } from 'framer-motion';
import ResourceCard from '../components/resourceCard';
import { getLinkPreview } from 'link-preview-js';
// import { NotionAPI } from 'notion-client';
import { NextSeo } from 'next-seo';
import { getResources } from '../utils/notion';

const Resources = ({ resources }) => {
  console.log(resources);
  return (
    <>
      <NextSeo
        title="Resources – Neil Skaria"
        description="A repository of my favorite resources from the web (e.g. blog posts, articles, compendiums)"
      />
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="space-y-16"
      >
        <div className="space-y-10 ">
          <div className="text-center md:text-left">
            <div className="text-2xl font-bold mb-3">🧠 Saved Resources</div>
            <div className=" text-sm md:text-base text-gray-500">
              A list of articles and blog posts that I reference back to
            </div>
          </div>
          {resources.map((resource, index) => {
            if (resource !== null && resource.title && resource.description && resource.images[0]) {
              return (
                <ResourceCard
                  key={resource.url}
                  title={resource.title}
                  description={resource.description}
                  link={resource.url}
                  image={resource.images[0]}
                  priority={index < 5 ? true : false}
                />
              );
            }
          })}
        </div>
      </motion.div>
    </>
  );
};

export default Resources;

export async function getStaticProps() {
  // Take array of URLs and return rich content preview using link-preview-js
  const getLinkPreviews = (myArray) => {
    const promises = myArray.map(async (myValue) => {
      try {
        return await getLinkPreview(myValue, {
          headers: {
            'user-agent': 'Twitterbot',
          },
        });
      } catch (error) {}
    });
    return Promise.all(promises);
  };

  // Retrieve URLS from Notion table, then call getURLContent
  const getLinks = async () => {
    // const notion = new NotionAPI();
    // let urls = [];
    // const pageId = '6a36d869142340708cd18692d56a512b';
    // const recordMap = await notion.getPage(pageId);
    // const blocks = recordMap.block;
    // Object.keys(blocks).forEach((key) => {
    //   if (blocks[key].value && blocks[key].value.type === 'page') {
    //     urls.push(blocks[key].value.properties._pmJ[0][0]);
    //   }
    // });
    const urls = await getResources();
    // Fetch URL Preview for first 5 in array
    const urlContent = await getLinkPreviews(urls);
    return urlContent;
  };

  const finalContent = await getLinks();
  return {
    props: {
      resources: JSON.parse(JSON.stringify(finalContent)),
    },
    revalidate: 10,
  };
}
