import React, { useEffect, useState } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Pagination, Autoplay, EffectCoverflow } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/pagination';
import 'swiper/css/effect-coverflow';
import type { Product } from '@/types';
import { ArrowRight, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface LargeAnimalFeatureProps {
  products: Product[];
  onProductSelect: (product: Product) => void;
}

const LargeAnimalFeature: React.FC<LargeAnimalFeatureProps> = ({ 
  products, 
  onProductSelect
}) => {
  const [highlightedProducts, setHighlightedProducts] = useState<Product[]>([]);
  
  useEffect(() => {
    // Filter for highlighted products or use the first 3 if none are marked as highlighted
    const featured = products.filter(p => p.isHighlighted);
    setHighlightedProducts(
      featured.length > 0 
        ? featured 
        : products.filter(p => p.category === 'veterinary-pharmaceuticals').slice(0, 3)
    );
  }, [products]);
  
  if (highlightedProducts.length === 0) {
    return null;
  }
  
  return (
    <div className="py-8">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-[#1A5F7A] mb-3 flex items-center">
          <div className="w-10 h-10 mr-3 flex-shrink-0">
            <svg viewBox="0 0 100 100" className="w-full h-full">
              <path d="M50 10 Q70 30 90 35 Q70 40 65 60 Q60 80 50 90 Q40 80 35 60 Q30 40 10 35 Q30 30 50 10Z" 
                fill="#086D38" stroke="#1A5F7A" strokeWidth="2"/>
            </svg>
          </div>
          Large Animal Pharmaceuticals
        </h2>
        <p className="text-gray-600 max-w-3xl">
          Radix Laboratories specializes in high-quality pharmaceuticals and supplements for large animal veterinary practices. 
          Our products are formulated with the highest quality ingredients and manufactured under strict quality control.
        </p>
      </div>
      
      <Swiper
        effect={'coverflow'}
        grabCursor={true}
        centeredSlides={true}
        slidesPerView={'auto'}
        coverflowEffect={{
          rotate: 10,
          stretch: 0,
          depth: 100,
          modifier: 1,
          slideShadows: true,
        }}
        autoplay={{
          delay: 3500,
          disableOnInteraction: false,
        }}
        pagination={{
          clickable: true,
        }}
        modules={[EffectCoverflow, Pagination, Autoplay]}
        className="w-full"
      >
        {highlightedProducts.map((product) => (
          <SwiperSlide key={product.id} className="max-w-md">
            <div className="bg-white p-6 rounded-lg shadow-lg m-4 border border-gray-100 hover:shadow-xl transition-shadow duration-300">
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <h3 className="text-2xl font-medium text-[#1A5F7A]">{product.name}</h3>
                  <p className="text-gray-500 text-sm mb-1">#{product.productNumber}</p>
                </div>
                {product.size && (
                  <span className="px-3 py-1 bg-[#086D38]/10 text-[#086D38] text-sm rounded-full">
                    {product.size}
                  </span>
                )}
              </div>
              
              <div className="mb-4 h-48 flex items-center justify-center bg-gray-50 rounded-lg overflow-hidden">
                <img 
                  src={product.image || '/images/placeholder.svg'} 
                  alt={product.name}
                  className="max-h-full max-w-full object-contain"
                />
              </div>
              
              <p className="text-gray-600 mb-6">{product.description}</p>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Star className="h-4 w-4 text-yellow-500 mr-1" fill="currentColor" />
                  <Star className="h-4 w-4 text-yellow-500 mr-1" fill="currentColor" />
                  <Star className="h-4 w-4 text-yellow-500 mr-1" fill="currentColor" />
                  <Star className="h-4 w-4 text-yellow-500 mr-1" fill="currentColor" />
                  <Star className="h-4 w-4 text-yellow-500" fill="currentColor" />
                </div>
                <Button 
                  variant="outline" 
                  className="border-[#1A5F7A] text-[#1A5F7A] hover:bg-[#1A5F7A] hover:text-white"
                  onClick={() => onProductSelect(product)}
                >
                  Details <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>
          </SwiperSlide>
        ))}
      </Swiper>
      
      <div className="bg-[#086D38]/5 p-4 mt-8 rounded-lg border border-[#086D38]/20">
        <h3 className="text-lg font-medium text-[#1A5F7A] mb-2">For Veterinary Professionals</h3>
        <p className="text-gray-600">
          Our large animal pharmaceutical products are only available to licensed veterinary professionals. 
          Please <a href="#" className="text-[#086D38] hover:underline">login</a> or <a href="#" className="text-[#086D38] hover:underline">register</a> to see detailed product information, pricing, and documentation.
        </p>
      </div>
    </div>
  );
};

export default LargeAnimalFeature;