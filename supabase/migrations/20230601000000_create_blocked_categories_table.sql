-- Create a table for storing user's blocked categories
CREATE TABLE IF NOT EXISTS blocked_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    categories TEXT[] NOT NULL DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add Row Level Security policies
ALTER TABLE blocked_categories ENABLE ROW LEVEL SECURITY;

-- Policy to allow users to view only their own categories
CREATE POLICY "Users can view their own blocked categories" 
ON blocked_categories
FOR SELECT
USING (auth.uid() = user_id);

-- Policy to allow users to create their own categories
CREATE POLICY "Users can create their own blocked categories" 
ON blocked_categories
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Policy to allow users to update only their own categories
CREATE POLICY "Users can update their own blocked categories" 
ON blocked_categories
FOR UPDATE
USING (auth.uid() = user_id);

-- Policy to allow users to delete only their own categories
CREATE POLICY "Users can delete their own blocked categories" 
ON blocked_categories
FOR DELETE
USING (auth.uid() = user_id);

-- Create an index on user_id for faster lookups
CREATE INDEX IF NOT EXISTS blocked_categories_user_id_idx ON blocked_categories (user_id);

-- Add a trigger to update the updated_at column
CREATE OR REPLACE FUNCTION update_modified_column() 
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_blocked_categories_modtime
BEFORE UPDATE ON blocked_categories
FOR EACH ROW
EXECUTE FUNCTION update_modified_column();