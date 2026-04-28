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
  category text NOT NULL, -- e.g., 'Abbruch', 'Sanierung'
  category_en text,
  image_url text NOT NULL,
  description text,
  description_en text,
  created_at timestamptz DEFAULT now()
);

-- 3. Create table for Site Settings (Single row table)
CREATE TABLE IF NOT EXISTS site_settings (
  id integer PRIMARY KEY CHECK (id = 1),
  name text NOT NULL,
  slogan text NOT NULL,
  slogan_en text,
  description text,
  description_en text,
  phone text,
  email text,
  address text,
  facebook_url text,
  instagram_url text,
  linkedin_url text,
  updated_at timestamptz DEFAULT now()
);

-- 4. Enable Row Level Security (RLS) - Optional but recommended
-- For this demo, let's allow public read access to projects and settings
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read access" ON projects FOR SELECT USING (true);
CREATE POLICY "Allow public insert access" ON projects FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public delete access" ON projects FOR DELETE USING (true);

ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read access" ON site_settings FOR SELECT USING (true);
CREATE POLICY "Allow public update access" ON site_settings FOR UPDATE USING (true);

-- Allow public insert access for contact inquiries
ALTER TABLE contact_inquiries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public insert access" ON contact_inquiries FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public read access" ON contact_inquiries FOR SELECT USING (true);
CREATE POLICY "Allow public delete access" ON contact_inquiries FOR DELETE USING (true);

-- 5. Insert initial data for Site Settings
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
