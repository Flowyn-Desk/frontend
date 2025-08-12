# Frontend Setup Instructions

## Quick Start

1. **Create the frontend directory structure:**
```bash
mkdir frontend
cd frontend
```

2. **Create the files:**
   - Save the HTML content as `index.html`
   - Save the Dockerfile as `Dockerfile`
   - Save the nginx config as `nginx.conf`

3. **Build and run the frontend container:**
```bash
# Build the Docker image
docker build -t ticket-frontend .

# Run the container
docker run -p 8080:80 ticket-frontend
```

4. **Access the application:**
   - Frontend: http://localhost:8080
   - Backend API: http://localhost:3000 (ensure your backend is running)

## Full Stack with Docker Compose

If you want to run everything together, create a `docker-compose.yml` file in your project root and run:

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop all services
docker-compose down
```

## Environment Variables for Docker Compose

Create a `.env` file in your project root:
```bash
GOOGLE_AI_API_KEY=your-google-ai-api-key
LLM_API_KEY=your-llm-api-key
```

## Directory Structure

```
project-root/
├── backend/
│   ├── src/
│   ├── package.json
│   ├── Dockerfile
│   └── ... (your backend files)
├── frontend/
│   ├── index.html
│   ├── nginx.conf
│   └── Dockerfile
├── docker-compose.yml
└── .env
```

## Frontend Features

✅ **Authentication & Authorization**
- Login with email/password and workspace key
- Role-based UI (Associate, Manager, Admin)
- Session management with localStorage

✅ **Ticket Management**
- Create tickets with AI severity suggestions
- View all tickets with filtering by status
- Edit ticket details (title, description)
- Soft delete tickets
- Manager review workflow

✅ **CSV Operations**
- Export pending tickets to CSV
- Import processed CSV files
- Automated workflow simulation

✅ **User Management** (Admin only)
- Create new users
- View workspace members
- Edit user roles

✅ **UI Features**
- Responsive design for mobile/desktop
- Real-time status updates
- Interactive modals for editing
- Clickable workspace key with copy functionality
- Loading states and error handling

## API Integration

The frontend is designed to work with your exact backend API structure:

- Uses email-based login (not username)
- Proper workspace-uuid header handling
- Matches your controller method signatures
- Handles your response format: `{statusCode, data, message}`

## Production Considerations

- Uses nginx for efficient static file serving
- Gzip compression enabled
- Security headers configured
- Health check endpoint available
- Auto-scaling compatible (stateless)

## Testing the Assessment Requirements

1. **Create tickets** - Associates can create tickets with AI suggestions
2. **Review workflow** - Managers can review and modify severity
3. **CSV operations** - Export/import with status updates
4. **Role permissions** - Different UI based on user role
5. **Ticket lifecycle** - Draft → Review → Pending → Open → Closed
6. **Sequential ticket numbers** - Display TKT-YYYY-XXXXXX format
7. **Workspace isolation** - Shows workspace key for reference

The frontend is intentionally minimal but fully functional to meet all assessment requirements without unnecessary complexity.