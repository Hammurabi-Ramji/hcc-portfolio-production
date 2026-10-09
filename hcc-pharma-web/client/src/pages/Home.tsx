import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";
import Hero from "@/components/home/hero";
import CompanyOverview from "@/components/home/company-overview";
import ValuePropositions from "@/components/home/value-propositions";
import ProductCategories from "@/components/home/product-categories";
import QualityProcess from "@/components/home/quality-process";
import FeaturedProduct from "@/components/home/featured-product";
import ClientPortalPreview from "@/components/home/client-portal-preview";
import Testimonials from "@/components/home/testimonials";
import CredibilityIndicators from "@/components/home/credibility-indicators";
import CtaSection from "@/components/home/cta-section";

const HomePage = () => {
  return (
    <>
      <div className="flex flex-col min-h-screen">
        <Header />
        
        <main className="flex-grow">
          <Hero />
          <CompanyOverview />
          <ValuePropositions />
          <ProductCategories />
          <QualityProcess />
          <FeaturedProduct />
          <ClientPortalPreview />
          <Testimonials />
          <CredibilityIndicators />
          <CtaSection />
        </main>
        
        <Footer />
      </div>
    </>
  );
};

export default HomePage;
