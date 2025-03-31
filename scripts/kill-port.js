const { exec } = require('child_process');

const PORT = process.env.PORT || 3000;

console.log(`Attempting to kill any process using port ${PORT}...`);

// For Windows
if (process.platform === 'win32') {
  exec(`netstat -ano | findstr :${PORT}`, (error, stdout, stderr) => {
    if (error) {
      console.log(`No process found using port ${PORT}`);
      return;
    }
    
    const lines = stdout.trim().split('\n');
    if (lines.length > 0) {
      // Get PID from the last column
      const pid = lines[0].trim().split(/\s+/).pop();
      
      if (pid) {
        console.log(`Found process ${pid} using port ${PORT}, killing it...`);
        exec(`taskkill /F /PID ${pid}`, (error, stdout, stderr) => {
          if (error) {
            console.error(`Failed to kill process: ${error.message}`);
            return;
          }
          console.log(`Process ${pid} killed successfully`);
        });
      }
    }
  });
}
// For Unix/Linux/Mac
else {
  exec(`lsof -i :${PORT} -t`, (error, stdout, stderr) => {
    if (error) {
      console.log(`No process found using port ${PORT}`);
      return;
    }
    
    const pid = stdout.trim();
    if (pid) {
      console.log(`Found process ${pid} using port ${PORT}, killing it...`);
      exec(`kill -9 ${pid}`, (error, stdout, stderr) => {
        if (error) {
          console.error(`Failed to kill process: ${error.message}`);
          return;
        }
        console.log(`Process ${pid} killed successfully`);
      });
    }
  });
}
