import childProcess from "child_process";

const server = childProcess.spawn('npm', ['run', 'dev']);

function toExit() {
    if (server) {
        server.kill(0);
    }
}
process.on('SIGTERM', toExit);
process.on('exit', toExit);