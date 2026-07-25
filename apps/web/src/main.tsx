import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Route, Routes } from 'react-router';

import './index.css';
import { Layout } from './components/Layout';
import { Home } from './routes/Home';
import { GalleryPage } from './routes/GalleryPage';
import { Studio } from './routes/Studio';
import { Complete } from './routes/Complete';
import { NotFound } from './routes/NotFound';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Home />} />
          <Route path="/gallery" element={<GalleryPage />} />
          <Route path="/studio" element={<Studio />} />
          <Route path="/studio/complete" element={<Complete />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </BrowserRouter>
  </StrictMode>,
);
