import { Link } from 'wouter';
import { Button } from '@/components/ui/button';
import { Navbar } from '@/components/Layout/Navbar';
import { Footer } from '@/components/Layout/Footer';
import { ArrowRight, Star, Users, BookOpen, Zap, Shield, Clock, Brain } from 'lucide-react';
import { motion } from 'framer-motion';
import  InfiniteScrollTicker  from '@/components/ui/InfiniteScrollTicker';
import { useAuth } from '@/contexts/AuthContext';
import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';


/**
 * Hero Typing Animation Component
 * Creates a typewriter effect for "Communicate Better" text with clear and repeat cycle
 */
function HeroTypingAnimation() {
  const [displayText, setDisplayText] = useState('');
  const [phase, setPhase] = useState<'typing' | 'waiting' | 'clearing' | 'pausing'>('typing');
  const [currentTextIndex, setCurrentTextIndex] = useState(0);
  
  // Array of texts to cycle through
  const texts = ['Learn Together ,', 'Have Fun !'];
  
  useEffect(() => {
    const fullText = texts[currentTextIndex];
    let timeoutId: NodeJS.Timeout;
    
    /**
     * Execute animation based on current phase
     */
    if (phase === 'typing') {
      // Type one character at a time - faster typing
      if (displayText.length < fullText.length) {
        timeoutId = setTimeout(() => {
          setDisplayText(fullText.substring(0, displayText.length + 1));
        }, 80); // 80ms per character - faster typing
      } else {
        // Switch to waiting phase after typing completes
        timeoutId = setTimeout(() => setPhase('waiting'), 100);
      }
    } else if (phase === 'waiting') {
      // Wait 1.5 seconds then start clearing
      timeoutId = setTimeout(() => setPhase('clearing'), 1500);
    } else if (phase === 'clearing') {
      // Clear one character at a time - much faster clearing
      if (displayText.length > 0) {
        timeoutId = setTimeout(() => {
          setDisplayText(prev => prev.substring(0, prev.length - 1));
        }, 30); // 30ms per character (faster clearing)
      } else {
        // After clearing is complete, cycle to next text and go to pausing phase
        timeoutId = setTimeout(() => {
          setCurrentTextIndex((prev) => (prev + 1) % texts.length);
          setPhase('pausing');
        }, 100);
      }
    } else if (phase === 'pausing') {
      // Brief pause then restart typing cycle
      timeoutId = setTimeout(() => setPhase('typing'), 200);
    }
    
    // Cleanup function
    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [displayText, phase, currentTextIndex, texts]); // Dependencies: displayText, phase, currentTextIndex, and texts
  
  return (
    <span className="relative">
      {displayText}
      {/* Improved Blinking Cursor */}
      <span className="blinking-cursor text-current ml-2">|</span>
    </span>
  );
}

export default function Landing() {
  const { user } = useAuth();

  // Handle hash navigation when landing page loads
  useEffect(() => {
    // Check if there's a hash in the URL and scroll to it
    const hash = window.location.hash;
    if (hash) {
      const targetId = hash.replace('#', '');
      // Wait a bit for the page to render, then scroll
      setTimeout(() => {
        const element = document.getElementById(targetId);
        if (element) {
          element.scrollIntoView({ 
            behavior: 'smooth',
            block: 'start'
          });
        }
      }, 100);
    }
  }, []);

  // Add scroll-triggered animations for mobile and cursor animation styles
  useEffect(() => {
    // Add cursor animation styles and scroll animation styles
    const keyframes = `
      .blinking-cursor {
        animation: blink 1s infinite;
      }
      @keyframes blink {
        0%, 50% { opacity: 1; }
        51%, 100% { opacity: 0; }
      }
      
      .animate-on-scroll {
        opacity: 0;
        transform: translateY(30px);
        transition: all 0.6s cubic-bezier(0.4, 0, 0.2, 1);
      }
      
      .animate-in-view {
        opacity: 1 !important;
        transform: translateY(0) !important;
      }
      
      @media (max-width: 768px) {
        .animate-in-view {
          animation: mobileCardHover 0.8s ease-out forwards;
        }
      }
      
      @keyframes mobileCardHover {
        0% {
          opacity: 0;
          transform: translateY(30px) scale(0.95);
        }
        60% {
          transform: translateY(-5px) scale(1.02);
        }
        100% {
          opacity: 1;
          transform: translateY(0) scale(1);
        }
      }
    `;
    if (typeof document !== 'undefined' && !document.getElementById('landing-cursor-animations')) {
      const style = document.createElement('style');
      style.id = 'landing-cursor-animations';
      style.textContent = keyframes;
      document.head.appendChild(style);
    }

    const observerOptions = {
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('animate-in-view');
        }
      });
    }, observerOptions);

    const cards = document.querySelectorAll('.animate-on-scroll');
    cards.forEach((card) => observer.observe(card));

    return () => observer.disconnect();
  }, []);
  
  // Animation variants for staggered animations
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };
  
  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6
      }
    }
  };

  // Professional features data with enhanced descriptions
  const features = [
    {
      icon: Brain,
      title: "AI-Powered Learning Assistant",
      description: "Advanced AI integration that provides contextual learning support, instant explanations, and personalized study recommendations tailored to your academic journey.",
      color: "blue",
      stats: "95% accuracy"
    },
    {
      icon: Zap,
      title: "Real-time Collaboration Hub",
      description: "Seamless peer-to-peer interaction with live messaging, screen sharing, collaborative whiteboards, and synchronized study sessions across devices.",
      color: "emerald",
      stats: "<100ms latency"
    },
    {
      icon: Shield,
      title: "Enterprise-Grade Security",
      description: "Bank-level encryption, advanced privacy controls, academic integrity monitoring, and compliance with educational data protection standards.",
      color: "violet",
      stats: "99.9% uptime"
    }
  ];

  const steps = [
    { number: 1, title: "Sign Up", description: "Create your account and set up your academic profile with interests and study areas." },
    { number: 2, title: "Join Rooms", description: "Browse and join discussion rooms based on your subjects and academic interests." },
    { number: 3, title: "Collaborate", description: "Engage in meaningful discussions with AI assistance and real-time collaboration tools." },
    { number: 4, title: "Learn", description: "Track your progress, build knowledge, and achieve academic success together." }
  ];

  const testimonials = [
    {
      name: "Sarah Anderson",
      role: "Computer Science, MIT",
      avatar: "SA",
      content: "The AI assistant helped me understand complex algorithms in ways my textbook never could. The collaborative discussions made studying actually enjoyable!",
      gradient: "from-primary-500 to-primary-600"
    },
    {
      name: "Marcus Rodriguez",
      role: "Physics, Stanford",
      avatar: "MR",
      content: "Finding study partners was impossible before Edusphere. Now I'm part of an amazing physics community that helps each other succeed.",
      gradient: "from-secondary-500 to-secondary-600"
    },
    {
      name: "Emily Chen",
      role: "Medicine, Harvard",
      avatar: "EC",
      content: "The real-time collaboration features saved my group project. We could work together seamlessly despite being in different time zones.",
      gradient: "from-accent-500 to-accent-600"
    }
  ];

  // Profile cards data for floating elements
  
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-16 ">
        {/* Background with overlay */}
        <div className="absolute inset-0 from-slate-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 bg-[url('/src/assets/background.png')] bg-cover bg-center"></div>
        
       
          
        
        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center z-20 -mt-52">
          <h1 className="text-5xl lg:text-7xl font-bold text-gray-900 dark:text-white mb-6 leading-tight -inset-10">
            <HeroTypingAnimation />
          </h1>
          <p className="text-xl lg:text-2xl text-gray-600 dark:text-gray-300 mb-12 max-w-4xl mx-auto leading-relaxed ">
            Join EduSphere's collaborative learning platform where students connect, discuss, and master subjects together with AI-powered assistance.
          </p>
          
          {/* CTA Buttons */}
          <div className="flex flex-col items-center space-y-6 mb-16">
            <Link href={user ? "/rooms" : "/register"}>
              <Button 
                size="lg"
                className="px-12 py-4 bg-blue-500 hover:bg-blue-600 text-white rounded-full font-semibold text-lg shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
                data-testid="button-get-started"
              >
                {user ? "Go to Rooms" : "Get Started"}
              </Button>
            </Link>
            
          </div>
        </div>
      </section>

      {/* Features Section - Industry Grade Design */}
      <section id="features" className="py-24 bg-gray-50 dark:bg-gray-900 relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute inset-0" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='1'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }} />
        </div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          {/* Header */}
          <motion.div 
            className="text-center mb-20"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <motion.div
              className="inline-flex items-center px-4 py-2 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-sm font-medium mb-6"
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              viewport={{ once: true }}
            >
              ✨ Collaborative Learning Platform
            </motion.div>
            <h2 className="text-4xl lg:text-6xl font-bold text-gray-900 dark:text-white mb-6 tracking-tight">
              Built for
              <span className="block text-blue-600 dark:text-blue-400">Student Success</span>
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-4xl mx-auto leading-relaxed">
              EduSphere connects students in collaborative study rooms where they can discuss subjects, share knowledge, and learn together with intelligent AI support.
            </p>
          </motion.div>
          
          {/* Features Grid */}
          <div className="grid lg:grid-cols-3 gap-8">
            {features.map((feature, index) => {
              const IconComponent = feature.icon;
              const colorClasses = {
                blue: {
                  icon: 'text-blue-600 dark:text-blue-400',
                  bg: 'bg-blue-50 dark:bg-blue-900/20',
                  border: 'border-blue-200 dark:border-blue-800',
                  accent: 'bg-blue-600'
                },
                emerald: {
                  icon: 'text-emerald-600 dark:text-emerald-400',
                  bg: 'bg-emerald-50 dark:bg-emerald-900/20',
                  border: 'border-emerald-200 dark:border-emerald-800',
                  accent: 'bg-emerald-600'
                },
                violet: {
                  icon: 'text-violet-600 dark:text-violet-400',
                  bg: 'bg-violet-50 dark:bg-violet-900/20',
                  border: 'border-violet-200 dark:border-violet-800',
                  accent: 'bg-violet-600'
                }
              };
              
              const colors = colorClasses[feature.color as keyof typeof colorClasses];
              
              return (
                <motion.div
                  key={index}
                  className="group relative"
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  viewport={{ once: true }}
                  whileHover={{ y: -8 }}
                  data-testid={`feature-${index}`}
                >
                  {/* Card */}
                  <div className={`relative h-full p-8 bg-white dark:bg-gray-800 rounded-3xl border ${colors.border} shadow-lg hover:shadow-2xl transition-all duration-500 overflow-hidden`}>
                    {/* Accent Line */}
                    <div className={`absolute top-0 left-0 w-full h-1 ${colors.accent} transform origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-500`} />
                    
                    {/* Icon Container */}
                    <motion.div 
                      className={`relative w-16 h-16 ${colors.bg} rounded-2xl flex items-center justify-center mb-6`}
                      whileHover={{ rotate: 5, scale: 1.05 }}
                      transition={{ type: "spring", stiffness: 300 }}
                    >
                      <IconComponent className={`w-8 h-8 ${colors.icon}`} />
                      
                      {/* Floating Badge */}
                      <motion.div
                        className="absolute -top-2 -right-2 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center shadow-lg"
                        initial={{ scale: 0 }}
                        whileInView={{ scale: 1 }}
                        transition={{ delay: 0.5 + index * 0.1, type: "spring" }}
                        viewport={{ once: true }}
                      >
                        <div className="w-2 h-2 bg-white rounded-full" />
                      </motion.div>
                    </motion.div>
                    
                    {/* Content */}
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="text-2xl font-bold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-300">
                          {feature.title}
                        </h3>
                        <motion.span 
                          className={`px-3 py-1 text-xs font-semibold ${colors.bg} ${colors.icon} rounded-full`}
                          initial={{ opacity: 0, x: 20 }}
                          whileInView={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.3 + index * 0.1 }}
                          viewport={{ once: true }}
                        >
                          {feature.stats}
                        </motion.span>
                      </div>
                      
                      <p className="text-gray-600 dark:text-gray-300 leading-relaxed text-base">
                        {feature.description}
                      </p>
                      
                      {/* Learn More Link */}
                      <motion.div 
                        className="pt-4"
                        initial={{ opacity: 0 }}
                        whileInView={{ opacity: 1 }}
                        transition={{ delay: 0.4 + index * 0.1 }}
                        viewport={{ once: true }}
                      >
                        <button className={`inline-flex items-center text-sm font-semibold ${colors.icon} hover:underline group-hover:translate-x-1 transition-transform duration-300`}>
                          Learn more
                          <ArrowRight className="w-4 h-4 ml-1" />
                        </button>
                      </motion.div>
                    </div>
                    
                    {/* Hover Effect Overlay */}
                    <div className="absolute inset-0 bg-blue-600/5 dark:bg-blue-400/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-3xl" />
                  </div>
                </motion.div>
              );
            })}
          </div>
          
          {/* Bottom CTA */}
          <motion.div 
            className="text-center mt-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            viewport={{ once: true }}
          >
            <p className="text-gray-600 dark:text-gray-400 mb-6">Join thousands of students already using EduSphere</p>
            
          </motion.div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-24 bg-white dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Section Header */}
          <div className="text-center mb-20">
            <div className="inline-flex items-center px-4 py-2 rounded-full bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 text-sm font-medium mb-6">
              Simple Process
            </div>
            <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 dark:text-white mb-6 leading-tight">
              How It Works
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto leading-relaxed">
              Start your collaborative learning journey on EduSphere in just four simple steps
            </p>
          </div>
          
          {/* Professional Cards Grid */}
          <div className="grid lg:grid-cols-4 md:grid-cols-2 gap-8">
            {steps.map((step, index) => (
              <div 
                key={index} 
                className="group relative bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-2xl hover:border-blue-200 dark:hover:border-blue-700 transition-all duration-500 hover:-translate-y-4 hover:scale-105 cursor-pointer overflow-hidden animate-on-scroll"
                data-testid={`step-${index}`}
                style={{
                  animationDelay: `${index * 200}ms`,
                  animationFillMode: 'both'
                }}
              >
                {/* Background Image */}
                <div className="absolute inset-0 opacity-15 group-hover:opacity-30 md:opacity-10 md:group-hover:opacity-25 transition-opacity duration-500">
                  <img 
                    src={
                      index === 0 ? 'https://i.pinimg.com/736x/f2/ba/d3/f2bad392d85e9fe83fb9cb69d27a0498.jpg' : // Sign up - person with laptop
                      index === 1 ? 'https://i.pinimg.com/1200x/be/5e/e4/be5ee4b2233ff57b5715a6a70d815f87.jpg' : // Create room - people collaborating
                      index === 2 ? 'https://i.pinimg.com/736x/e7/d4/bf/e7d4bf57b218156d6c5defe570d5c31a.jpg' : // Invite friends - team meeting
                      'https://i.pinimg.com/736x/2a/bb/fe/2abbfe9c89fcacc89575ac04434774fb.jpg' // Start learning - graduation/success
                    }
                    alt={step.title}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      console.log('Image failed to load:', e.currentTarget.src);
                      e.currentTarget.style.display = 'none';
                    }}
                    onLoad={(e) => {
                      console.log('Image loaded successfully:', e.currentTarget.src);
                    }}
                  />
                </div>
                
                {/* Animated Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-indigo-500/10 to-purple-500/10 group-hover:from-blue-500/20 group-hover:via-indigo-500/20 group-hover:to-purple-500/20 md:from-blue-500/5 md:via-indigo-500/5 md:to-purple-500/5 md:group-hover:from-blue-500/15 md:group-hover:via-indigo-500/15 md:group-hover:to-purple-500/15 transition-all duration-500 rounded-2xl"></div>
                
                {/* Step Number Badge */}
                <div className="relative mb-6 z-10">
                  <div className="w-16 h-16 bg-gray-50 dark:bg-gray-700 rounded-xl flex items-center justify-center border-2 border-gray-200 dark:border-gray-600 group-hover:border-blue-400 dark:group-hover:border-blue-500 group-hover:bg-blue-50 dark:group-hover:bg-blue-900/30 transition-all duration-300 group-hover:scale-110 group-hover:rotate-3">
                    <span className="text-2xl font-bold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-300">{step.number}</span>
                  </div>
                  {/* Connection Line (except for last item) */}
                  {index < 3 && (
                    <div className="hidden lg:block absolute top-8 left-16 w-full h-0.5 bg-gray-200 dark:bg-gray-700 -z-10">
                      <div className="h-full bg-gradient-to-r from-blue-400 to-indigo-500 w-0 group-hover:w-full transition-all duration-700 delay-300"></div>
                    </div>
                  )}
                </div>
                
                {/* Card Content */}
                <div className="space-y-4 relative z-10">
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-all duration-300 group-hover:scale-105">
                    {step.title}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 leading-relaxed group-hover:text-gray-700 dark:group-hover:text-gray-300 transition-colors duration-300">
                    {step.description}
                  </p>
                </div>
                
                {/* Animated Border Glow */}
                <div className="absolute inset-0 rounded-2xl border-2 border-transparent group-hover:border-blue-200 dark:group-hover:border-blue-600 transition-all duration-300"></div>
                
                {/* Floating Elements on Hover */}
                <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-all duration-500 delay-200 transform translate-y-2 group-hover:translate-y-0">
                  <div className="w-3 h-3 bg-blue-400 rounded-full animate-pulse"></div>
                </div>
                
                {/* Bottom Shine Effect */}
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-blue-400 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 delay-300"></div>
              </div>
            ))}
          </div>
          
          {/* Bottom CTA */}
          <div className="text-center mt-16">
            <div className="inline-flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span>Ready in under 5 minutes</span>
            </div>
          </div>
          
        </div>
      </section>

      {/* Testimonials Section */}
      <InfiniteScrollTicker />

      {/* CTA Section */}
      <section id="cta" className="relative py-20 bg-gradient-to-br from-primary-600 to-accent-600 overflow-hidden">
        {/* Man Image Overlay */}
        <div className="absolute inset-0 z-30">
          <img 
            src="/src/assets/man.png" 
            alt="Professional man" 
            className="absolute bottom-0 right-0 lg:right-10 xl:right-20 h-full max-h-[80vh] w-auto object-contain opacity-60 "
          />
        </div>
        
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center z-40">
          <h2 className="text-4xl lg:text-5xl font-bold text-white mb-6">
            Ready to Join EduSphere?
          </h2>
          <p className="text-xl text-primary-100 mb-8 leading-relaxed">
            Connect with fellow students, join study rooms, and accelerate your learning with AI-powered collaboration tools.
          </p>
          <div className="flex flex-col sm:flex-row justify-center items-center space-y-4 sm:space-y-0 sm:space-x-6">
            <Link href={user ? "/rooms" : "/register"}>
              <Button 
                size="lg"
                className="px-8 py-4 bg-primary hover:bg-primary-600 text-primary-foreground rounded-xl font-semibold text-lg shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
                data-testid="button-get-started-free"
              >
                Get Started Free
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
            
          </div>
        </div>
      </section>

      <Footer />
      
     
    </div>
  );
}