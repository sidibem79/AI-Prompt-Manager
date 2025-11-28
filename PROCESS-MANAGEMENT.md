# PM2 Process Management Guide

This document explains how to manage the AI Prompt Manager application using PM2.

## Quick Start

The application is configured to run on **http://localhost:3010** using PM2 process manager.

### Starting the Application

```bash
npm run pm2:start
```

Or directly:
```bash
pm2 start ecosystem.config.cjs
```

### Stopping the Application

```bash
npm run pm2:stop
```

Or directly:
```bash
pm2 stop ai-prompt-manager
```

### Restarting the Application

```bash
npm run pm2:restart
```

Or directly:
```bash
pm2 restart ai-prompt-manager
```

## Monitoring

### View Process Status

```bash
npm run pm2:status
```

Or directly:
```bash
pm2 status
```

This shows:
- Process ID
- Status (online/stopped)
- CPU usage
- Memory usage
- Uptime

### View Logs

```bash
npm run pm2:logs
```

Or directly:
```bash
pm2 logs ai-prompt-manager
```

#### View Only Recent Logs
```bash
pm2 logs ai-prompt-manager --lines 50 --nostream
```

#### Clear Logs
```bash
pm2 flush
```

## Advanced Management

### Remove from PM2

To completely remove the application from PM2:

```bash
npm run pm2:delete
```

Or directly:
```bash
pm2 delete ai-prompt-manager
```

### View Detailed Information

```bash
pm2 show ai-prompt-manager
```

### Monitor in Real-time

```bash
pm2 monit
```

This opens an interactive dashboard showing CPU, memory, and logs in real-time.

## Auto-Start on System Reboot (Optional)

To make the application start automatically when your computer boots:

### Enable Auto-Start

```bash
pm2 startup
```

This command will output a command that you need to run with administrator privileges. Copy and run it.

### Save Current Process List

```bash
pm2 save
```

This saves the current running processes so they will be restored on reboot.

### Disable Auto-Start

```bash
pm2 unstartup
```

## Configuration

### Port Configuration

The application runs on port **3010** by default (configured in `ecosystem.config.cjs`).

To change the port, edit the `PORT` value in [ecosystem.config.cjs](ecosystem.config.cjs):

```javascript
env: {
  PORT: 3010,  // Change this to your desired port
  NODE_ENV: 'development'
},
```

Then restart the application:
```bash
npm run pm2:restart
```

### Log Files Location

PM2 logs are stored in:
- **Output logs**: `./logs/pm2-out.log`
- **Error logs**: `./logs/pm2-err.log`

## Troubleshooting

### Port Already in Use

If you see "port already in use" error:

1. Check if PM2 is already running:
   ```bash
   pm2 status
   ```

2. If it's running, stop it:
   ```bash
   npm run pm2:stop
   ```

3. Start it again:
   ```bash
   npm run pm2:start
   ```

### Application Not Starting

1. Check the logs:
   ```bash
   npm run pm2:logs
   ```

2. Verify the Vite dependency is installed:
   ```bash
   npm install
   ```

3. Delete and restart:
   ```bash
   npm run pm2:delete
   npm run pm2:start
   ```

### Check if Application is Accessible

Open your browser and navigate to:
- **Local**: http://localhost:3010
- **Network**: http://[your-ip]:3010

### Command Not Found

If you get "pm2: command not found", use npx:
```bash
npx pm2 status
npx pm2 start ecosystem.config.cjs
```

## Benefits of Using PM2

- **Always Running**: App continues running even when VS Code is closed
- **Auto-Restart**: Automatically restarts if the application crashes
- **Memory Management**: Restarts if memory usage exceeds 500MB
- **Log Management**: Centralized logging with timestamps
- **Process Monitoring**: Real-time monitoring of CPU and memory usage
- **Hot Reload**: Vite's HMR (Hot Module Replacement) still works

## NPM Scripts Reference

| Script | Command | Description |
|--------|---------|-------------|
| `npm run pm2:start` | `pm2 start ecosystem.config.cjs` | Start the application |
| `npm run pm2:stop` | `pm2 stop ai-prompt-manager` | Stop the application |
| `npm run pm2:restart` | `pm2 restart ai-prompt-manager` | Restart the application |
| `npm run pm2:logs` | `pm2 logs ai-prompt-manager` | View real-time logs |
| `npm run pm2:status` | `pm2 status` | Check process status |
| `npm run pm2:delete` | `pm2 delete ai-prompt-manager` | Remove from PM2 |

## Additional Resources

- [PM2 Official Documentation](https://pm2.keymetrics.io/docs/usage/quick-start/)
- [PM2 Process Management](https://pm2.keymetrics.io/docs/usage/process-management/)
- [PM2 Log Management](https://pm2.keymetrics.io/docs/usage/log-management/)
