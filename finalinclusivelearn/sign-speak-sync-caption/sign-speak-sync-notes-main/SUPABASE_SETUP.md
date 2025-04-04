# Supabase Setup Instructions

This document provides instructions on how to set up the Supabase database for the SignSpeakSync application.

## Setting Up the User Profiles Table

The application requires a `user_profiles` table in your Supabase database to store user roles. Follow these steps to create the table:

1. Log in to your Supabase dashboard at https://app.supabase.io/
2. Select your project
3. Go to the SQL Editor
4. Create a new query
5. Copy and paste the contents of the `supabase/setup.sql` file
6. Run the query

This will:
- Create the `user_profiles` table with the necessary columns
- Set up triggers to update the `updated_at` column
- Create Row Level Security (RLS) policies
- Set up a trigger to automatically create a profile for new users
- Insert existing users into the `user_profiles` table

## Verifying the Setup

After running the SQL script, you can verify that the table was created correctly:

1. Go to the Table Editor in your Supabase dashboard
2. You should see a `user_profiles` table with the following columns:
   - `id` (UUID, primary key)
   - `email` (text)
   - `role` (text)
   - `created_at` (timestamp with time zone)
   - `updated_at` (timestamp with time zone)

## Troubleshooting

If you encounter any issues:

1. Check the SQL Editor for any error messages
2. Make sure you have the necessary permissions to create tables and triggers
3. If the table already exists, you may need to drop it first or modify the script to handle existing tables

## Updating User Roles

To update a user's role:

1. Go to the Table Editor in your Supabase dashboard
2. Select the `user_profiles` table
3. Find the user you want to update
4. Change the `role` field to either `'student'` or `'teacher'`
5. Save the changes 