import NextImage from 'next/image';

const Image = ({ wrapper, src, ...props }) => {
  if (!src.startsWith('/') && !src.startsWith('https://www.notion.so/image/')) {
    return (
      <div className={wrapper}>
        <NextImage
          src={`https://res.cloudinary.com/nskaria/image/fetch/q_auto,w_auto/${src}`}
          {...props}
        />
      </div>
    );
  } else {
    return (
      <div className={wrapper}>
        <NextImage src={src} {...props} />
      </div>
    );
  }
};

export default Image;
