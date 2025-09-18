import React from "react";
import { Star } from "lucide-react";

// Interface for testimonial data structure
interface Testimonial {
  id: number;
  rating: number;
  text: string;
  name: string;
  role: string;
  avatar: string;
  avatarColor: string;
}

// Interface for component props
interface TestimonialCardProps {
  testimonial: Testimonial;
  keyPrefix: string;
}


// Testimonial card component following clean architecture principles
const TestimonialCard: React.FC<TestimonialCardProps> = ({ testimonial, keyPrefix }) => {
  return (
    <div
      key={`${keyPrefix}-${testimonial.id}`}
      className="flex-shrink-0 w-80 bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-lg transition-shadow duration-300"
    >
      {/* Star Rating */}
      <div className="flex mb-4">
        {[...Array(testimonial.rating)].map((_, i) => (
          <Star
            key={i}
            className="w-4 h-4 text-blue-500 fill-current"
          />
        ))}
      </div>

      {/* Testimonial Text */}
      <blockquote className="text-gray-600 dark:text-gray-300 leading-relaxed mb-4 text-sm">
        "{testimonial.text}"
      </blockquote>

      {/* User Info */}
      <div className="flex items-center">
        <div
          className={`w-10 h-10 ${testimonial.avatarColor} rounded-full flex items-center justify-center text-white font-semibold mr-3 text-sm`}
        >
          {testimonial.avatar}
        </div>
        <div>
          <p className="font-semibold text-gray-900 dark:text-white text-sm">
            {testimonial.name}
          </p>
          <p className="text-gray-600 dark:text-gray-300 text-xs">
            {testimonial.role}
          </p>
        </div>
      </div>
    </div>
  );
};

// Main component with proper TypeScript typing
const InfiniteScrollTicker: React.FC = () => {
  // EduSphere-specific testimonials data
  const testimonials: Testimonial[] = [
    {
      id: 1,
      rating: 5,
      text: "EduSphere has completely transformed how I collaborate with my study group. The real-time chat and AI assistant are game-changers.",
      name: "Sarah Martinez",
      role: "Computer Science Student",
      avatar: "SM",
      avatarColor: "bg-blue-600",
    },
    {
      id: 2,
      rating: 5,
      text: "As a busy graduate student, EduSphere helps me stay connected with my research team. The discussion rooms are incredibly useful.",
      name: "James Davis",
      role: "Graduate Student",
      avatar: "JD",
      avatarColor: "bg-teal-600",
    },
    {
      id: 3,
      rating: 5,
      text: "The AI assistant feature helps me understand complex topics better. It's like having a tutor available 24/7.",
      name: "Alex Liu",
      role: "Engineering Student",
      avatar: "AL",
      avatarColor: "bg-cyan-600",
    },
    {
      id: 4,
      rating: 5,
      text: "Outstanding platform! The collaborative features have improved my group projects significantly. Highly recommended.",
      name: "Maria Rodriguez",
      role: "Business Student",
      avatar: "MR",
      avatarColor: "bg-indigo-600",
    },
    {
      id: 5,
      rating: 5,
      text: "EduSphere's study rooms have streamlined our entire learning process. The analytics help track our progress effectively.",
      name: "David Chen",
      role: "Medical Student",
      avatar: "DC",
      avatarColor: "bg-blue-600",
    },
    {
      id: 6,
      rating: 5,
      text: "The real-time collaboration and seamless communication make this the best study platform I've ever used.",
      name: "Emma Thompson",
      role: "Psychology Student",
      avatar: "ET",
      avatarColor: "bg-teal-600",
    },
    {
      id: 7,
      rating: 5,
      text: "Professional interface with amazing learning features. EduSphere has become an essential part of my study routine.",
      name: "Michael Johnson",
      role: "Law Student",
      avatar: "MJ",
      avatarColor: "bg-sky-600",
    },
    {
      id: 8,
      rating: 5,
      text: "The efficiency and reliability of EduSphere's collaborative features are impressive. Great platform for academic success.",
      name: "Lisa Wang",
      role: "Physics Student",
      avatar: "LW",
      avatarColor: "bg-cyan-600",
    },
  ];

  // Create duplicated testimonials for seamless infinite scroll without mutating original array
  const duplicatedTestimonials: Testimonial[] = [...testimonials, ...testimonials];
  const reversedTestimonials: Testimonial[] = [...testimonials].reverse();
  const duplicatedReversedTestimonials: Testimonial[] = [...reversedTestimonials, ...reversedTestimonials];

  return (
    <section className="py-20 bg-gray-50 dark:bg-gray-900 overflow-hidden">
      <div className="container mx-auto px-4">
        {/* Header Section */}
        <div className="text-center mb-16">
          <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 dark:text-white mb-4">
            What Students Say
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
            Real experiences from students who transformed their learning with EduSphere
          </p>
        </div>

        {/* Infinite Scroll Container */}
        <div className="relative">
          {/* First Row - Left to Right Animation */}
          <div className="flex space-x-6 animate-scroll-left mb-6">
            {duplicatedTestimonials.map((testimonial, index) => (
              <TestimonialCard
                key={`left-${testimonial.id}-${index}`}
                testimonial={testimonial}
                keyPrefix={`left-${index}`}
              />
            ))}
          </div>

          {/* Second Row - Right to Left Animation */}
          <div className="flex space-x-6 animate-scroll-right">
            {duplicatedReversedTestimonials.map((testimonial, index) => (
              <TestimonialCard
                key={`right-${testimonial.id}-${index}`}
                testimonial={testimonial}
                keyPrefix={`right-${index}`}
              />
            ))}
          </div>

          {/* Gradient Overlays for smooth fade effect */}
          <div className="absolute top-0 left-0 w-20 h-full bg-gradient-to-r from-gray-50 dark:from-gray-900 to-transparent z-10 pointer-events-none"></div>
          <div className="absolute top-0 right-0 w-20 h-full bg-gradient-to-l from-gray-50 dark:from-gray-900 to-transparent z-10 pointer-events-none"></div>
        </div>
      </div>

      {/* Inline styles for animation - following React best practices */}
      <style jsx>{`
        @keyframes scroll-left {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-50%);
          }
        }

        @keyframes scroll-right {
          0% {
            transform: translateX(-50%);
          }
          100% {
            transform: translateX(0);
          }
        }

        .animate-scroll-left {
          animation: scroll-left 60s linear infinite;
        }

        .animate-scroll-right {
          animation: scroll-right 60s linear infinite;
        }

        .animate-scroll-left:hover,
        .animate-scroll-right:hover {
          animation-play-state: paused;
        }
      `}</style>
    </section>
  );
};

export default InfiniteScrollTicker;