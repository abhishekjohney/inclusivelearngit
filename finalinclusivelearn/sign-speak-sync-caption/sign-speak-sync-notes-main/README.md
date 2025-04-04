# Sign-Speak-Sync-Notes

A web application for synchronized sign language and speech notes.

## Setup Instructions

### Supabase Database Setup

1. Log in to your Supabase dashboard at https://app.supabase.io/
2. Select your project
3. Go to the SQL Editor
4. Create a new query
5. Copy and paste the contents of the `supabase_setup.sql` file
6. Run the query

This will:
- Create the `user_profiles` table if it doesn't exist
- Set up Row Level Security (RLS) policies
- Create a trigger to automatically create user profiles when new users sign up
- Grant necessary permissions to anonymous and authenticated users

### Troubleshooting

If you encounter issues with user signup:

1. Check if the `user_profiles` table exists in your Supabase database
2. Verify that the table has the correct structure
3. Check the permissions on the table
4. Look for any triggers that might be failing

You can run the following SQL query to check if the table exists:

```sql
SELECT EXISTS (
   SELECT FROM information_schema.tables 
   WHERE table_schema = 'public'
   AND table_name = 'user_profiles'
);
```

If the table doesn't exist, run the `supabase_setup.sql` script again.

## Development

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn

### Installation

1. Clone the repository
2. Install dependencies:

```bash
npm install
# or
yarn install
```

3. Start the development server:

```bash
npm run dev
# or
yarn dev
```

4. Open your browser and navigate to `http://localhost:8080`

## Features

- User authentication (sign up, sign in, sign out)
- User roles (student, teacher)
- Synchronized sign language and speech notes
- Real-time collaboration

# Welcome to your Lovable project

## Project info

**URL**: https://lovable.dev/projects/fb4a3c55-4815-427a-aabb-00de6533fc70

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/fb4a3c55-4815-427a-aabb-00de6533fc70) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/fb4a3c55-4815-427a-aabb-00de6533fc70) and click on Share -> Publish.

## Can I connect a custom domain to my Lovable project?

Yes it is!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/tips-tricks/custom-domain#step-by-step-guide)
