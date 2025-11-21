import Navigation from "@/components/Navigation";
import HeroSection from "@/components/HeroSection";
import Features from "@/components/Features";
import HowItWorks from "@/components/HowItWorks";
import Testimonials from "@/components/Testimonials";
import FAQ from "@/components/FAQ";
import Footer from "@/components/Footer";
import Mission from "@/components/Mission";

const Home = () => {
  return (
    <div className="min-h-screen">
      <Navigation />
      <HeroSection />
      <Features />
      <HowItWorks />
      <Testimonials />
      <Mission />
      <FAQ />
      <Footer />
    </div>
  );
};

export default Home;
