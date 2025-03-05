-- Create a table for tracking when users last viewed the RSS feed
CREATE TABLE IF NOT EXISTS last_visit (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    last_visited_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add Row Level Security policies
ALTER TABLE last_visit ENABLE ROW LEVEL SECURITY;

-- Policy to allow users to view only their own visit data
CREATE POLICY "Users can view their own last visit data" 
ON last_visit
FOR SELECT
USING (auth.uid() = user_id);

-- Policy to allow users to create their own visit data
CREATE POLICY "Users can create their own last visit data" 
ON last_visit
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Policy to allow users to update only their own visit data
CREATE POLICY "Users can update their own last visit data" 
ON last_visit
FOR UPDATE
USING (auth.uid() = user_id);

-- Policy to allow users to delete only their own visit data
CREATE POLICY "Users can delete their own last visit data" 
ON last_visit
FOR DELETE
USING (auth.uid() = user_id);

-- Create an index on user_id for faster lookups
CREATE INDEX IF NOT EXISTS last_visit_user_id_idx ON last_visit (user_id);

-- Add a trigger to update the updated_at column
CREATE TRIGGER update_last_visit_modtime
BEFORE UPDATE ON last_visit
FOR EACH ROW
EXECUTE FUNCTION update_modified_column();
