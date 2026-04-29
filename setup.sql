-- 1. Create table for Contact Inquiries
CREATE TABLE IF NOT EXISTS contact_inquiries (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  email text NOT NULL,
  subject text,
  message text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- 2. Create table for Projects
CREATE TABLE IF NOT EXISTS projects (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  title text NOT NULL,
  title_en text,
  title_de text,
  category text NOT NULL, -- e.g., 'Abbruch', 'Sanierung'
  category_en text,
  category_de text,
  image_url text NOT NULL,
  description text,
  description_en text,
  description_de text,
  created_at timestamptz DEFAULT now()
);

-- Ensure translation columns exist if table was created previously
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='projects' AND column_name='title_en') THEN
        ALTER TABLE projects ADD COLUMN title_en text;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='projects' AND column_name='title_de') THEN
        ALTER TABLE projects ADD COLUMN title_de text;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='projects' AND column_name='category_en') THEN
        ALTER TABLE projects ADD COLUMN category_en text;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='projects' AND column_name='category_de') THEN
        ALTER TABLE projects ADD COLUMN category_de text;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='projects' AND column_name='description_en') THEN
        ALTER TABLE projects ADD COLUMN description_en text;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='projects' AND column_name='description_de') THEN
        ALTER TABLE projects ADD COLUMN description_de text;
    END IF;
END $$;

-- 3. Create table for Site Settings (Single row table)
CREATE TABLE IF NOT EXISTS site_settings (
  id integer PRIMARY KEY CHECK (id = 1),
  name text NOT NULL,
  slogan text NOT NULL,
  slogan_en text,
  slogan_de text,
  description text,
  description_en text,
  description_de text,
  phone text,
  email text,
  address text,
  facebook_url text,
  instagram_url text,
  linkedin_url text,
  -- Dynamic Images
  hero_image_url text,
  about_image_url text,
  cta_image_url text,
  contact_image_url text,
  updated_at timestamptz DEFAULT now()
);

-- 4. Enable Row Level Security (RLS) - Optional but recommended
-- IMPORTANT: You must manually create a bucket named "images" in your Supabase Dashboard
-- under "Storage" and set it to "Public" for images to load correctly.
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read access" ON projects FOR SELECT USING (true);
CREATE POLICY "Allow public insert access" ON projects FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update access" ON projects FOR UPDATE USING (true);
CREATE POLICY "Allow public delete access" ON projects FOR DELETE USING (true);

ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read access" ON site_settings FOR SELECT USING (true);
CREATE POLICY "Allow public insert access" ON site_settings FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update access" ON site_settings FOR UPDATE USING (true);

-- Allow public insert access for contact inquiries
ALTER TABLE contact_inquiries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public insert access" ON contact_inquiries FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public read access" ON contact_inquiries FOR SELECT USING (true);
CREATE POLICY "Allow public delete access" ON contact_inquiries FOR DELETE USING (true);

-- 6. Supabase Storage Policies (COPY AND RUN IN SUPABASE SQL EDITOR)
-- This fixes the "new row violates row-level security policy" error on upload
-- Make sure you have created a bucket named "images" first!

/*
-- Create the bucket if you haven't already (Alternative to UI)
INSERT INTO storage.buckets (id, name, public)
VALUES ('images', 'images', true)
ON CONFLICT (id) DO NOTHING;

-- Policy: Allow Public Uploads
CREATE POLICY "Allow public uploads"
ON storage.objects FOR INSERT
TO public
WITH CHECK (bucket_id = 'images');

-- Policy: Allow Public View/Select
CREATE POLICY "Allow public view"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'images');

-- Policy: Allow Public Update
CREATE POLICY "Allow public updates"
ON storage.objects FOR UPDATE
TO public
USING (bucket_id = 'images');
*/

-- 7. Insert initial data for Site Settings
INSERT INTO site_settings (id, name, slogan, description, phone, email, address)
VALUES (
  1, 
  'FJ BAUSERVICE', 
  'Raum für Neues schaffen', 
  'Ihr Partner für professionelle Abbrucharbeiten, Entkernung und Rückbau in ganz Deutschland.',
  '0159 06142923',
  'amjad.ali@fj-bauservice.com',
  'Bahnhofstraße 9, 83022 Rosenheim, Deutschland'
) ON CONFLICT (id) DO NOTHING;

-- 6. Insert some sample projects
INSERT INTO projects (title, category, image_url)
VALUES 
('Badezimmersanierung München', 'Sanierung', 'https://picsum.photos/seed/proj1/800/800?grayscale'),
('Garagenabbruch Rosenheim', 'Abbruch', 'https://picsum.photos/seed/proj2/800/800?grayscale'),
('Wandabbruch Villa', 'Abbruch', 'https://picsum.photos/seed/proj3/800/800?grayscale'),
('Kernbohrung Industrie', 'Technik', 'https://picsum.photos/seed/proj4/800/800?grayscale'),
('Entkernung Altbau', 'Sanierung', 'https://picsum.photos/seed/proj5/800/800?grayscale'),
('Bürogebäude Rückbau', 'Rückbau', 'https://picsum.photos/seed/proj6/800/800?grayscale');
