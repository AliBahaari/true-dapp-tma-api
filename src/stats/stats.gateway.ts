import {
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

const socketPort = process.env.APP_SOCKET_PORT ? Number(process.env.APP_SOCKET_PORT) : 3001;

@WebSocketGateway(socketPort, {
  cors: {
    origin: '*',
  },
  transports: ['websocket', 'polling'],
})
export class StatsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server: Server;

  onlineSockets: { id: string, expiredAt: Date, timeout: NodeJS.Timeout }[] = [];

  handleConnection(@ConnectedSocket() client: Socket) {

    const socketIndex = this.onlineSockets.findIndex(socket => socket.id === client.id);
    if (socketIndex === -1) {
    // Add the connected socket to the onlineSockets array
    const timeout = setTimeout(() => {
      this.removeSocket(client.id);
      this.emitOnlineUserCount(); // Emit updated count after expiration
    }, 3600000); // 1 hour in milliseconds
      this.onlineSockets.push({
        id: client.id,
        expiredAt: new Date(Date.now() + 3600000), // 1 hour from now
        timeout: timeout,
      });
    }

    // Emit the updated online users count
    this.emitOnlineUserCount();
  }

  handleDisconnect(@ConnectedSocket() client: Socket) {

    // Do NOT remove the socket from the onlineSockets array
    // Let it be removed automatically after 1 hour

    // Emit the updated online users count
    this.emitOnlineUserCount();
  }

  private removeSocket(socketId: string) {
    const socketIndex = this.onlineSockets.findIndex(socket => socket.id === socketId);
    if (socketIndex !== -1) {
      const [removedSocket] = this.onlineSockets.splice(socketIndex, 1);
      clearTimeout(removedSocket.timeout); // Clear the timeout to prevent memory leaks
    }
  }

  private emitOnlineUserCount() {
    // Filter out expired sockets
    const nonExpiredSockets = this.onlineSockets.filter(socket => socket.expiredAt > new Date());

    // Emit the count of non-expired sockets
    this.server.emit('onlineUsersCount', nonExpiredSockets.length);
  }
}