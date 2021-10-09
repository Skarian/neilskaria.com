import ConvertKitForm from '../components/convertKitForm';
import PropTypes from 'prop-types';
import Image from '../components/image';

const Hero = ({ heroData }) => {
  const { title, description, twitter, linkedin } = heroData;
  return (
    <div className="flex flex-col md:flex-row md:space-x-12 lg:space-x-16">
      <div className="flex mb-10 md:mb-0 justify-center md:justify-start">
        <Image
          className="rounded-lg"
          alt="a picture of neil wearing a suit"
          src="/images/profile.jpg"
          wrapper="max-w-sm"
          width={400}
          height={400}
          priority
        />
      </div>
      <div className="flex flex-col justify-center md:w-1/2 space-y-6 items-center text-center md:text-left md:items-start">
        <div>
          <h1 className="text-2xl font-bold mb-3">{title}</h1>
          <p className=" text-base text-gray-900">{description}</p>
        </div>
        <ConvertKitForm />
        <div className="flex">
          <button
            className="bg-blue-300 inline-flex px-3 py-1 mr-4 rounded-lg items-center hover:bg-blue-400 focus:outline-none"
            onClick={() => {
              if (window !== undefined) {
                window.location.href = `${twitter}`;
              }
            }}
          >
            <Image
              src="/images/social/twitter.svg"
              alt="Twitter Logo"
              wrapper="w-6 h-6"
              height={50}
              width={50}
              priority
            />
            <span className="ml-2 flex items-start flex-col leading-none">
              <span className="text-xs text-gray-900 mb-1 overflow-ellipsis">FOLLOW ON</span>
              <span className="font-medium text-base">Twitter</span>
            </span>
          </button>
          <button
            className="bg-gray-200 inline-flex px-3 py-1 rounded-lg items-center  hover:bg-gray-300 focus:outline-none"
            onClick={() => {
              if (window !== undefined) {
                window.location.href = `${linkedin}`;
              }
            }}
          >
            <Image
              src="/images/social/linkedin.svg"
              alt="Linkedin Logo"
              wrapper="w-6 h-6"
              height={50}
              width={50}
              priority
            />
            <span className="ml-2 flex items-start flex-col leading-none">
              <span className="text-xs text-gray-900 mb-1">CONNECT ON</span>
              <span className="font-medium text-base">Linkedin</span>
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Hero;

Hero.propTypes = {
  heroData: PropTypes.shape({
    title: PropTypes.string.isRequired,
    description: PropTypes.string.isRequired,
    twitter: PropTypes.string.isRequired,
    linkedin: PropTypes.string.isRequired,
  }),
};
