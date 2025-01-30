import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server } from 'socket.io';

@WebSocketGateway(Number(process.env.APP_SOCKET_PORT), {
  cors: {
    origin: '*',
  },
  transports: ['websocket', 'polling'],
})
export class StatsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server: Server;

  handleConnection() {
    this.server.emit('onlineUsersCount', this.server.engine.clientsCount);
  }

  handleDisconnect() {
    this.server.emit('onlineUsersCount', this.server.engine.clientsCount - 1);
  }
}
