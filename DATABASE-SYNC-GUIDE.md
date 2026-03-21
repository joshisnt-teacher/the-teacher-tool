# Database Sync Guide

This guide explains how to easily synchronize data between your local and cloud Supabase databases.

## 🚀 Quick Start

### 1. Setup Environment
First, get your Supabase service key:
1. Go to [Supabase Dashboard](https://app.supabase.com/project/aogorchudxilnkhtfvqq/settings/api)
2. Copy the **service_role** key (NOT the anon key)
3. Set it as an environment variable:

**Windows (PowerShell):**
```powershell
$env:SUPABASE_SERVICE_KEY="your_service_key_here"
```

**Windows (Command Prompt):**
```cmd
set SUPABASE_SERVICE_KEY=your_service_key_here
```

**Mac/Linux:**
```bash
export SUPABASE_SERVICE_KEY="your_service_key_here"
```

### 2. Common Operations

#### Pull data from cloud to local (recommended for development)
```bash
npm run db:pull
```
This will:
- Create a backup of your local database first
- Reset your local database
- Pull the latest schema and data from cloud

#### Push schema from local to cloud
```bash
npm run db:push
```
This will:
- Create a backup of your cloud database first
- Link your local project to cloud (if not already linked)
- Push all pending migrations to cloud
- Apply schema changes to your cloud database

**Important:** This pushes schema/migrations only, not data. For data syncing, use custom scripts.

#### Generate migration from local schema changes
If you've made schema changes locally that aren't in migrations yet:
```bash
node db-sync.js generate-migration <migration_name>
```
Example:
```bash
node db-sync.js generate-migration add_new_tables
```
This compares your local database to cloud and creates a migration file.

#### Create backups
```bash
# Backup local database
npm run db:backup-local

# Backup cloud database (placeholder for now)
npm run db:backup-cloud

# List all backups
npm run db:list-backups
```

#### Supabase management
```bash
# Start local Supabase
npm run supabase:start

# Stop local Supabase
npm run supabase:stop

# Check status
npm run supabase:status

# Reset local database
npm run supabase:reset
```

## 📋 Available Commands

| Command | Description |
|---------|-------------|
| `npm run db:pull` | Pull data from cloud to local |
| `npm run db:push` | Push migrations from local to cloud |
| `npm run db:generate-migration` | Generate migration from local schema differences |
| `npm run db:backup-local` | Create timestamped backup of local DB |
| `npm run db:backup-cloud` | Create backup of cloud DB |
| `npm run db:list-backups` | List all available backups |
| `npm run db:help` | Show detailed help |

## 🔧 Advanced Usage

### Direct script usage
```bash
# Pull from cloud
node db-sync.js pull

# Create local backup
node db-sync.js backup-local

# Restore from specific backup
node db-sync.js restore-local backups/local-backup-2024-10-02T10-30-00.sql

# List backups
node db-sync.js list-backups
```

### Manual Supabase CLI commands
```bash
# Pull schema changes only
supabase db pull --local

# Create migration
supabase migration new your_migration_name

# Push migrations to cloud
supabase db push

# Dump local database
supabase db dump --local -f backup.sql
```

## 🛡️ Safety Features

### Automatic Backups
- Local backups are created before any destructive operations
- All backups are timestamped for easy identification
- Backups are stored in the `backups/` directory

### Error Handling
- Operations will fail safely if prerequisites aren't met
- Clear error messages with suggested solutions
- Rollback instructions provided when operations fail

### Confirmation Prompts
- Dangerous operations require explicit confirmation
- Clear warnings about data loss potential

## 📁 File Structure

```
teacher-tempo/
├── db-sync.js              # Main sync utility
├── env.example             # Environment configuration template
├── backups/                # Timestamped backup files
│   ├── local-backup-2024-10-02T10-30-00.sql
│   └── cloud-backup-2024-10-02T11-15-00.sql
├── supabase/
│   ├── config.toml         # Supabase configuration
│   ├── migrations/         # Database migrations
│   └── seed.sql           # Seed data
└── package.json           # NPM scripts
```

## 🔄 Typical Workflows

### Development Workflow
1. Start local Supabase: `npm run supabase:start`
2. Pull latest data: `npm run db:pull` (optional, if you need cloud data)
3. Make your schema changes locally
4. Test thoroughly
5. Generate migration: `node db-sync.js generate-migration feature_name`
6. Review the migration file in `supabase/migrations/`
7. Push to cloud: `npm run db:push`

### Pushing Local Changes to Cloud
1. Ensure local Supabase is running: `npm run supabase:start`
2. Make your schema changes locally (via Supabase Studio or SQL)
3. Generate a migration from the differences:
   ```bash
   node db-sync.js generate-migration my_changes
   ```
4. Review the generated migration file in `supabase/migrations/`
5. Push migrations to cloud:
   ```bash
   npm run db:push
   ```
6. Verify changes in Supabase dashboard

### Data Recovery
1. List backups: `npm run db:list-backups`
2. Restore from backup: `node db-sync.js restore-local backups/backup-file.sql`

### Production Updates
1. Create local backup: `npm run db:backup-local`
2. Test changes locally
3. Create migration files
4. Use Supabase dashboard or CLI to apply to production

## ⚠️ Important Notes

### Cloud Operations
- Cloud backups currently require manual setup of database connection string
- Pushing to cloud is intentionally restrictive to prevent accidental data loss
- Always test changes locally first

### Environment Variables
- `SUPABASE_SERVICE_KEY`: Required for cloud operations
- Store sensitive keys in environment variables, not in code

### Best Practices
1. **Always backup before destructive operations**
2. **Test locally before pushing to cloud**
3. **Use migrations for schema changes**
4. **Keep backups organized and timestamped**
5. **Never commit service keys to version control**

## 🆘 Troubleshooting

### "Supabase CLI not found"
Install the Supabase CLI:
```bash
npm install -g supabase
```

### "Service key not configured"
Make sure you've set the `SUPABASE_SERVICE_KEY` environment variable with your actual service key from the Supabase dashboard.

### "Connection refused"
Make sure your local Supabase is running:
```bash
npm run supabase:start
```

### "Permission denied"
Make sure you're using the service_role key, not the anon key.

## 📞 Support

If you encounter issues:
1. Check the error messages carefully
2. Verify your environment variables are set
3. Ensure Supabase CLI is installed and updated
4. Check that local Supabase is running
5. Review the backup files to ensure they exist

For more help, run: `npm run db:help`
