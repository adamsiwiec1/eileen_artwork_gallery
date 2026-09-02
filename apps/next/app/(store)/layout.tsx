import { SmoothScroll } from '@/components/store/SmoothScroll';
import { StoreChrome } from '@/components/store/StoreChrome';

export default function StoreLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SmoothScroll />
      <StoreChrome>{children}</StoreChrome>
    </>
  );
}
