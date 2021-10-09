import { m as motion } from 'framer-motion';
import PropTypes from 'prop-types';
import Link from 'next/link';
import Image from './image';

const BlogPostCard = ({ title, description, category, alt, date, body, slug, priority, image }) => {
  function calcReadingTime(post) {
    const WORDS_PER_MINUTE = 200;
    let result = {};
    //Matches words
    //See
    //https://regex101.com/r/q2Kqjg/6
    const regex = /\w+/g;
    result.wordCount = (post || '').match(regex).length;

    result.readingTime = Math.ceil(result.wordCount / WORDS_PER_MINUTE);
    return result;
  }
  const readingTime = calcReadingTime(body).readingTime;
  return (
    <motion.div
      className="mx-auto bg-white rounded-xl ring-1 ring-gray-200 shadow-sm overflow-hidden cursor-pointer mt-5 select-none hover:ring-green-500"
      whileHover={{ y: -5 }}
    >
      <Link href={`blog/${slug}`}>
        <div className="md:flex">
          <div className="md:flex-shrink-0">
            <Image
              wrapper="h-40 w-full object-cover md:w-40 relative"
              src={image}
              alt={alt}
              objectFit="cover"
              layout="fill"
              priority={priority}
            />
          </div>
          <div className="px-8 py-6 truncate">
            <div className="uppercase tracking-wide text-sm text-green-600 font-semibold">
              {category}
            </div>
            <h2 className="block mt-1 text-lg leading-tight font-medium truncate">{title}</h2>

            <p className="mt-2 text-gray-900 truncate">{description}</p>
            <div className="flex justify-between items-center mt-3">
              <span className="text-sm text-gray-800">{date}</span>
              <span className="text-sm text-gray-800">{readingTime} min read</span>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
};

export default BlogPostCard;

BlogPostCard.propTypes = {
  title: PropTypes.string.isRequired,
  description: PropTypes.string.isRequired,
  category: PropTypes.string.isRequired,
  alt: PropTypes.string.isRequired,
  date: PropTypes.string.isRequired,
};

BlogPostCard.defaultProps = {
  priority: false,
};
