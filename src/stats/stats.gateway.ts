import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server } from 'socket.io';

@WebSocketGateway(3001, {
  cors: {
    origin: 'http://40.172.49.49:3001',
  },
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
