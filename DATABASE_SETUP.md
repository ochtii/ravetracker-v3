# 🎵 RaveTracker v3.0 Database Setup

## Problem
You're seeing these errors in your browser console:
- `relation "public.profiles" does not exist`
- `Could not find a relationship between 'event_attendance' and 'events' in the schema cache`

This means your Supabase database doesn't have the required tables set up yet.

## Solution

### Option 1: Quick Setup (Recommended)

1. **Go to your Supabase Dashboard**
   - Visit: https://supabase.com/dashboard
   - Select your project: `njovoopqcfywrlhhndlb`

2. **Open SQL Editor**
   - In the left sidebar, click "SQL Editor"
   - Click "New query"

3. **Run the Setup Script**
   - Open the file `database-setup.sql` in this project
   - Copy the entire contents
   - Paste it into the Supabase SQL Editor
   - Click "Run" button

4. **Verify Success**
   - You should see a success message: "🎉 RaveTracker v3.0 Database Setup Complete!"
   - Check the "Table Editor" in Supabase to see your new tables

### Option 2: Manual Table Creation

If you prefer to set up tables manually, go to "Table Editor" in Supabase and create these tables in order:

1. **profiles** - User profile information
2. **event_categories** - Event categories (Techno, House, etc.)
3. **events** - Event details and information
4. **event_attendance** - User event attendance tracking
5. **notifications** - User notifications

### What Gets Created

The setup script creates:

- ✅ **5 main tables** with proper relationships
- ✅ **Row Level Security (RLS)** policies for data protection
- ✅ **Indexes** for optimal performance
- ✅ **Sample event categories** (Techno, House, Trance, etc.)
- ✅ **Triggers** for automatic timestamp updates

### After Setup

Once the database is set up:

1. **Restart your dev server**:
   ```bash
   npm run dev
   ```

2. **Test the application**:
   - Go to http://localhost:5173
   - The console errors should be gone
   - You can now register/login and use all features

### Troubleshooting

**If you still see errors:**

1. **Clear browser cache** and reload
2. **Check Supabase logs** in the Dashboard > Logs section
3. **Verify tables exist** in Table Editor
4. **Check RLS policies** are enabled

**Need help?**
- The database setup script includes detailed comments
- All tables have proper foreign key relationships
- RLS policies ensure data security

---

## Database Schema Overview

```
auth.users (Supabase built-in)
    ↓
profiles (user profiles)
    ↓
events (event details)
    ↓
event_attendance (who's attending what)
    ↓
notifications (user notifications)
```

Each table has:
- Primary keys (UUID)
- Foreign key relationships
- Timestamps (created_at, updated_at)
- Row Level Security policies
- Proper indexes for performance
