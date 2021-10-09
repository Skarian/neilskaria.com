import { m as motion } from 'framer-motion';
import { fetchContent } from '../utils/contentful';
import BlogPostCard from '../components/blogPostCard';
import { NextSeo } from 'next-seo';
import moment from 'moment';

const Home = ({ blogPosts }) => {
  return (
    <>
      <NextSeo
        title="Blog – Neil Skaria"
        description="A collection of my research on topics such as technology, strategy, finance etc"
      />
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="space-y-16"
      >
        <div className="space-y-10 ">
          <div className="text-center md:text-left">
            <div className="text-2xl font-bold mb-3">🧐 Recent Blog Posts</div>
            <div className=" text-sm md:text-base text-gray-500">
              A collection of my thoughts on a variety of topics
            </div>
          </div>
          {blogPosts.map(({ title, category, description, date, alt, body, slug, image }) => {
            return (
              <BlogPostCard
                key={title}
                title={title}
                description={description}
                category={category}
                alt={alt}
                date={date}
                body={body}
                slug={slug}
                image={image.url}
                priority={true}
              />
            );
          })}
        </div>
      </motion.div>
    </>
  );
};

export default Home;

export async function getStaticProps() {
  const response = await fetchContent(
    `
    {
      postCollection(limit: 100) {
        items {
          category
          description
          title
          date
          alt
          body
          slug
          image {
            url
          }
        }
      }
    }
    `
  );
  const adjustedResponse = response.postCollection.items.map((map) => {
    map.date = moment(map.date).format('MMM DD, YYYY');
    return map;
  });
  return {
    props: {
      blogPosts: adjustedResponse,
    },
    revalidate: 10,
  };
}
