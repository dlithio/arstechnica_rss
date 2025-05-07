-- Create a table for storing user's blocked phrases
CREATE TABLE IF NOT EXISTS blocked_phrases (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    phrase TEXT NOT NULL,
    match_title BOOLEAN NOT NULL DEFAULT true,
    match_content BOOLEAN NOT NULL DEFAULT true,
    case_sensitive BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add Row Level Security policies
ALTER TABLE blocked_phrases ENABLE ROW LEVEL SECURITY;

-- Policy to allow users to view only their own blocked phrases
CREATE POLICY "Users can view their own blocked phrases" 
ON blocked_phrases
FOR SELECT
USING (auth.uid() = user_id);

-- Policy to allow users to create their own blocked phrases
CREATE POLICY "Users can create their own blocked phrases" 
ON blocked_phrases
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Policy to allow users to update only their own blocked phrases
CREATE POLICY "Users can update their own blocked phrases" 
ON blocked_phrases
FOR UPDATE
USING (auth.uid() = user_id);

-- Policy to allow users to delete only their own blocked phrases
CREATE POLICY "Users can delete their own blocked phrases" 
ON blocked_phrases
FOR DELETE
USING (auth.uid() = user_id);

-- Create an index on user_id for faster lookups
CREATE INDEX IF NOT EXISTS blocked_phrases_user_id_idx ON blocked_phrases (user_id);

-- Add a trigger to update the updated_at column
CREATE TRIGGER update_blocked_phrases_modtime
BEFORE UPDATE ON blocked_phrases
FOR EACH ROW
EXECUTE FUNCTION update_modified_column();